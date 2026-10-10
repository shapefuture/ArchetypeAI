import argparse
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import continuity


class ContinuityTests(unittest.TestCase):
    def setUp(self):
        self.scope = continuity.load_scope()
        self.scope["linked_integration_tasks"] = []
        self.issues = [{"id": root["id"], "title": root["name"], "issue_type": "epic",
                        "status": "open", "priority": 1} for root in self.scope["roots"]]
        self.task = {"id": "ArchetypeAI-test-slice", "title": "Real implementation slice",
                     "issue_type": "task", "status": "open", "priority": 1,
                     "parent": "ArchetypeAI-we2s", "notes": "PRIVATE-NOTES-MUST-NOT-PRINT"}
        self.issues.append(self.task)

    def report(self, ready=True):
        return continuity.assess(self.scope, self.issues, [self.task] if ready else [])

    def test_removing_social_or_architecture_root_fails_schema(self):
        for omitted in ["ArchetypeAI-we2s", "ArchetypeAI-n0h"]:
            altered = copy.deepcopy(self.scope)
            altered["roots"] = [x for x in altered["roots"] if x["id"] != omitted]
            with tempfile.TemporaryDirectory() as directory:
                base = Path(directory)
                (base / "scripts/roadmap").mkdir(parents=True)
                (base / "scripts/roadmap/mission.json").write_text(json.dumps(altered))
                with self.assertRaises(continuity.ContinuityError):
                    continuity.load_scope(base)

    def test_missing_live_root_cannot_use_partial_scope(self):
        with self.assertRaises(continuity.ContinuityError):
            continuity.assess(self.scope, self.issues[1:], [self.task])

    def test_missing_linked_integration_task_fails_coverage(self):
        self.scope["linked_integration_tasks"] = ["missing-integration"]
        with self.assertRaisesRegex(continuity.ContinuityError, "missing-integration"):
            self.report()

    def test_legacy_feature_is_visible_and_selectable(self):
        self.task["issue_type"] = "feature"
        report = self.report()
        continuity.validate_selection(report, self.task["id"])
        self.assertIn("NEXT " + self.task["id"], continuity.report_text(self.scope, report))

    def test_frontier_snapshot_race_is_rejected(self):
        with self.assertRaises(continuity.ContinuityError):
            continuity.assess(self.scope, self.issues, [{"id": "new-since-snapshot"}])
        self.task["status"] = "closed"
        with self.assertRaises(continuity.ContinuityError):
            self.report()

    def test_parent_edges_include_new_nested_tasks_without_static_queue(self):
        self.issues.append({"id": "nested", "title": "Nested slice", "issue_type": "task",
                            "status": "open", "dependencies": [{"type": "parent-child",
                            "depends_on_id": self.task["id"]}]})
        self.assertEqual(self.report()["ownership"]["nested"], "ArchetypeAI-we2s")

    def test_hierarchy_cycle_and_multiple_parents_fail(self):
        self.task["parent"] = self.task["id"]
        with self.assertRaises(continuity.ContinuityError):
            self.report()
        self.task["parent"] = "ArchetypeAI-we2s"
        self.task["dependencies"] = [{"type": "parent-child", "depends_on_id": "ArchetypeAI-n0h"}]
        with self.assertRaises(continuity.ContinuityError):
            self.report()

    def test_blocked_or_out_of_scope_next_is_rejected(self):
        with self.assertRaises(continuity.ContinuityError):
            continuity.validate_selection(self.report(False), self.task["id"])
        with self.assertRaises(continuity.ContinuityError):
            continuity.validate_selection(self.report(), "unrelated")

    def test_active_authorized_slice_can_continue_with_acceptance_pending(self):
        self.task["status"] = "in_progress"
        continuity.validate_selection(self.report(False), self.task["id"])

    def test_whole_program_completion_requires_open_gates_and_roots(self):
        self.task["status"] = "closed"
        with self.assertRaises(continuity.ContinuityError):
            continuity.require_complete(self.report(False))
        for row in self.issues:
            row["status"] = "closed"
        self.issues.append({"id": "gate", "title": "Acceptance", "issue_type": "milestone",
                            "status": "open", "parent": "ArchetypeAI-28h"})
        with self.assertRaises(continuity.ContinuityError):
            continuity.require_complete(self.report(False))
        self.issues[-1]["status"] = "closed"
        continuity.require_complete(self.report(False))

    def test_report_includes_all_roots_but_no_private_issue_notes(self):
        text = continuity.report_text(self.scope, self.report())
        for root in continuity.REQUIRED_ROOTS:
            self.assertIn(root, text)
        self.assertNotIn("PRIVATE-NOTES", text)

    def test_handoff_requires_evidence_and_a_real_next_task(self):
        args = argparse.Namespace(task=self.task["id"], next=self.task["id"],
                                  completed="Guard implemented", remaining="Participant acceptance pending",
                                  evidence="Focused regression checks passed; no participant session",
                                  external_blocker="Real participants unavailable")
        text = continuity.handoff_text(self.scope, self.report(), args)
        for root in continuity.REQUIRED_ROOTS:
            self.assertIn(root, text)
        args.evidence = " "
        with self.assertRaises(continuity.ContinuityError):
            continuity.handoff_text(self.scope, self.report(), args)

    def test_missing_executable_does_not_fall_back_to_passive_jsonl(self):
        with patch.dict(continuity.os.environ, {}, clear=True), \
                patch.object(continuity.shutil, "which", return_value=None), \
                patch.object(continuity.Path, "is_file", return_value=False):
            with self.assertRaisesRegex(continuity.ContinuityError, "never substitute issues.jsonl"):
                continuity.beads_executable()

    def test_source_map_cannot_silently_lose_a_planned_task(self):
        scope = copy.deepcopy(self.scope)
        scope["source_maps"] = ["plan.json"]
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            for root in scope["roots"]:
                destination = base / root["spec"]
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_text("Specification")
            (base / "plan.json").write_text(json.dumps({"beads_ids": {"missing": "absent-id"}}))
            with self.assertRaisesRegex(continuity.ContinuityError, "1 missing"):
                continuity.validate_artifacts(scope, self.report(), base)


if __name__ == "__main__":
    unittest.main()
