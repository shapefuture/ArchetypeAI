#!/usr/bin/env python3
"""Restore the full mission, check live Beads coverage, and record a handoff.

No JSONL fallback, task closure, dependency override, or acceptance inference.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

REQUIRED_ROOTS = frozenset({
    "ArchetypeAI-28h", "ArchetypeAI-d6d", "ArchetypeAI-n0h", "ArchetypeAI-we2s",
})
REPO = Path(__file__).resolve().parents[2]


class ContinuityError(RuntimeError):
    pass


def load_scope(repo=REPO):
    scope = json.loads((repo / "scripts/roadmap/mission.json").read_text())
    roots = [row["id"] for row in scope["roots"]]
    if scope.get("schema_version") != 1 or set(roots) != REQUIRED_ROOTS or len(roots) != 4:
        raise ContinuityError("Mission must account for all four approved roots exactly once.")
    if not scope.get("objective") or not scope.get("constraints"):
        raise ContinuityError("Mission objective and persistent user constraints are required.")
    return scope


def beads_executable(repo=REPO):
    candidates = [
        os.environ.get("BEADS_BIN"), shutil.which("bd"),
        str(repo.parent / ".onboarding/bin/bd"),
        str(repo.parent / "tools/bd"), "/tmp/beads-bin/bd",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file() and os.access(candidate, os.X_OK):
            return candidate
    raise ContinuityError("Beads executable unavailable. Restore setup; never substitute issues.jsonl.")


def beads_environment(repo=REPO):
    env = os.environ.copy()
    if not env.get("DOLT_ROOT_PATH"):
        configured = repo.parent / ".config/dolt"
        target = configured if configured.is_dir() else repo / ".beads/runtime/dolt-config"
        target.mkdir(parents=True, exist_ok=True)
        env["DOLT_ROOT_PATH"] = str(target)
    return env


def run_beads(args, repo=REPO, write=False, as_json=True):
    command = [beads_executable(repo), "--sandbox"]
    if not write:
        command.append("--readonly")
    if as_json:
        command.append("--json")
    result = subprocess.run(
        [*command, *args], cwd=repo, env=beads_environment(repo),
        capture_output=True, text=True, timeout=45,
    )
    if result.returncode:
        raise ContinuityError(
            f"Live Beads command {args[0]} failed (exit {result.returncode}). "
            "Diagnose the executable/Dolt configuration or access; do not reinitialize/import the tracker."
        )
    return json.loads(result.stdout) if as_json else result.stdout


def root_of(issue_id, by_id, roots):
    seen = set()
    while issue_id in by_id:
        if issue_id in roots:
            return issue_id
        if issue_id in seen:
            raise ContinuityError(f"Hierarchy cycle at {issue_id}.")
        seen.add(issue_id)
        row = by_id[issue_id]
        parents = {edge["depends_on_id"] for edge in row.get("dependencies", [])
                   if edge.get("type") == "parent-child"}
        if row.get("parent"):
            parents.add(row["parent"])
        if len(parents) > 1:
            raise ContinuityError(f"Multiple parent authorities at {issue_id}.")
        issue_id = next(iter(parents), None)
    return None


def assess(scope, issues, ready):
    by_id = {row["id"]: row for row in issues}
    if len(by_id) != len(issues):
        raise ContinuityError("Duplicate issue IDs in the live response.")
    roots = {row["id"] for row in scope["roots"]}
    missing = (roots | set(scope.get("linked_integration_tasks", []))) - by_id.keys()
    if missing:
        raise ContinuityError("Missing live scope roots or linked integration tasks: " + ", ".join(sorted(missing)))
    ownership = {issue_id: root_of(issue_id, by_id, roots) for issue_id in by_id}
    allowed = {issue_id for issue_id, root in ownership.items() if root}
    allowed.update(set(scope.get("linked_integration_tasks", [])) & by_id.keys())
    all_ready_ids = {row["id"] for row in ready}
    if not all_ready_ids <= by_id.keys():
        raise ContinuityError("Ready frontier and issue snapshot disagree; reread the live tracker.")
    ready_ids = {issue_id for issue_id in all_ready_ids & allowed
                 if by_id[issue_id]["issue_type"] in {"task", "feature", "spike"}}
    if any(by_id[issue_id]["status"] not in {"open", "in_progress"} for issue_id in ready_ids):
        raise ContinuityError("Ready frontier changed status during inspection; reread the live tracker.")
    return {"by_id": by_id, "ownership": ownership, "allowed": allowed, "ready": ready_ids}


def validate_artifacts(scope, report, repo=REPO):
    missing = [row["spec"] for row in scope["roots"] if not (repo / row["spec"]).is_file()]
    missing += [name for name in scope["source_maps"] if not (repo / name).is_file()]
    if missing:
        raise ContinuityError("Restore/publish missing scope artifacts: " + ", ".join(missing))
    for name in scope["source_maps"]:
        planned = set(json.loads((repo / name).read_text())["beads_ids"].values())
        absent = planned - report["by_id"].keys()
        detached = planned - report["allowed"] - absent
        if absent or detached:
            raise ContinuityError(
                f"Plan coverage mismatch in {name}: {len(absent)} missing and {len(detached)} detached IDs."
            )


def validate_selection(report, task_id):
    row = report["by_id"].get(task_id)
    if not row or task_id not in report["allowed"]:
        raise ContinuityError(f"{task_id} is outside the declared full program.")
    if row["issue_type"] not in {"task", "feature", "spike"}:
        raise ContinuityError(f"{task_id} is not an executable slice.")
    if task_id not in report["ready"] and row["status"] != "in_progress":
        raise ContinuityError(f"{task_id} is neither ready nor an active slice; resolve its prerequisites.")


def require_complete(report):
    pending = [issue_id for issue_id in report["allowed"]
               if report["by_id"][issue_id]["status"] != "closed"]
    if pending:
        raise ContinuityError(f"Whole-program completion rejected: {len(pending)} scope records remain unfinished.")


def priority(row):
    return (row.get("priority", 4), row["id"])


def report_text(scope, report):
    lines = ["FULL IMPLEMENTATION MISSION", scope["objective"], "", "LIVE SCOPE — task statuses, not feature percentages"]
    for root in scope["roots"]:
        rows = [row for issue_id, row in report["by_id"].items()
                if report["ownership"][issue_id] == root["id"]]
        tasks = [row for row in rows if row["issue_type"] == "task"]
        counts = Counter(row["status"] for row in tasks)
        lines.append(f"{root['id']} | {root['name']} | root={report['by_id'][root['id']]['status']} | tasks={len(tasks)} {dict(counts)}")
        executable = [row for row in rows if row["issue_type"] in {"task", "feature", "spike"}]
        candidates = sorted([row for row in executable if row["id"] in report["ready"]], key=priority)
        active = sorted([row for row in executable if row["status"] == "in_progress"], key=priority)
        lines.append(f"  ready={len(candidates)}, active={len(active)}")
        for row in candidates[:3]:
            lines.append(f"  NEXT {row['id']} P{row.get('priority', 4)} {row['title']}")
        for row in active[:2]:
            lines.append(f"  ACTIVE {row['id']} {row['title']}")
        for row in sorted([row for row in rows if row["issue_type"] == "milestone"], key=priority):
            lines.append(f"  ACCEPTANCE {row['id']} {row['status']}")
    linked = [report["by_id"][issue_id] for issue_id in scope.get("linked_integration_tasks", [])
              if issue_id in report["by_id"] and report["by_id"][issue_id]["status"] != "closed"]
    for row in linked:
        lines.append(f"LINKED {row['id']} {row['status']} ready={row['id'] in report['ready']} {row['title']}")
    lines.extend(["", f"Eligible scope work items: {len(report['ready'])}. A held evidence/service scope does not hold independent work.",
                  "Inspect the selected Bead and exact predecessor outputs before implementation. This report is not an AAA lease or acceptance decision.",
                  "After a coherent slice, record completed criteria, evidence, remaining scope, external blockers and an actual next Bead. Avoid repeated cosmetic passes without criterion progress."])
    return "\n".join(lines)


def handoff_text(scope, report, args):
    if args.task not in report["allowed"]:
        raise ContinuityError("Handoff source task is outside the full program.")
    validate_selection(report, args.next)
    for field in ["completed", "remaining", "evidence"]:
        if not getattr(args, field).strip():
            raise ContinuityError(f"Handoff requires nonempty {field}.")
    return "\n".join([
        "FULL-PLAN HANDOFF " + datetime.now(timezone.utc).isoformat(),
        f"Work Bead: {args.task}", f"Completed criterion/slice: {args.completed}",
        f"Evidence and limitations: {args.evidence}", f"Remaining criteria/scope: {args.remaining}",
        f"External blockers: {args.external_blocker or 'None reported; this does not establish acceptance.'}",
        f"Next Bead: {args.next}", "", report_text(scope, report),
        "Handoff counts are historical context. Recompute live scope at the next session; never infer task closure from this memory.",
    ])


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("schema", help="Validate the permanent scope declaration without accessing Beads.")
    sub.add_parser("session", help="Restore mission, last handoff and live scope after startup/compaction.")
    status = sub.add_parser("status", help="Read scope and eligible work from live Beads.")
    status.add_argument("--task")
    status.add_argument("--require-complete", action="store_true")
    handoff = sub.add_parser("handoff", help="Append evidence-bounded continuation to Beads and save its memory.")
    for name in ["task", "next", "completed", "remaining", "evidence"]:
        handoff.add_argument("--" + name, required=True)
    handoff.add_argument("--external-blocker", default="")
    args = parser.parse_args(argv)
    scope = load_scope()
    if args.command == "schema":
        print("Scope schema valid: all four approved implementation roots are declared.")
        return 0
    if args.command == "session":
        print(run_beads(["prime"], as_json=False))
        for key in ["full-plan-implementation", "full-plan-handoff"]:
            try:
                print(f"RESTORED BEADS MEMORY {key}\n" + run_beads(["recall", key], as_json=False))
            except ContinuityError:
                print(f"Memory {key} unavailable; permanent mission and live scope remain mandatory.")
    issues = run_beads(["list", "--all", "--limit", "0"])
    ready = run_beads(["ready", "--limit", "0"])
    report = assess(scope, issues, ready)
    validate_artifacts(scope, report)
    if args.command == "handoff":
        text = handoff_text(scope, report, args)
        run_beads(["comments", "add", args.task, text], write=True, as_json=False)
        run_beads(["remember", text, "--key", "full-plan-handoff"], write=True, as_json=False)
        print(f"Handoff appended to {args.task}; next={args.next}; all four roots accounted for. No status or dependency changed.")
    else:
        print(report_text(scope, report))
        if getattr(args, "task", None):
            validate_selection(report, args.task)
        if getattr(args, "require_complete", False):
            require_complete(report)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ContinuityError, OSError, ValueError, KeyError, subprocess.TimeoutExpired) as error:
        print(f"Continuity check failed: {error}", file=sys.stderr)
        raise SystemExit(2)
