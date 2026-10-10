# Reusable full-plan delivery skill

Download [full-plan-delivery.zip](full-plan-delivery.zip), extract it, and install the **entire** directory into another project:

```bash
python3 full-plan-delivery/scripts/bootstrap.py --project /path/to/project --install-only --apply
```

Start a new Codex session in that project and invoke:

```text
$full-plan-delivery Set up the complete planning and execution process for this
project. Recover every approved stage, prepare safe parallel agent sweeps,
verify the development environment and continue within the authorization given.
```

The agent follows the skill to discover the existing tracker, complete the mission/criterion mapping, preserve decisions, configure quality checks and persist recovery instructions. A setup-only request can explicitly say not to begin implementation.

The source is [SKILL.md](../../.agents/skills/full-plan-delivery/SKILL.md); [README.md](../../.agents/skills/full-plan-delivery/README.md) covers Codex/Claude installation, commands and limitations. Beads works directly; other trackers require the documented explicit adapter. No project task IDs or credentials are included in the package.

Rebuild the portable archive after changing the source:

```bash
python3 .agents/skills/full-plan-delivery/scripts/package.py --output docs/skills/full-plan-delivery.zip --replace
```

This archive preserves the source references, templates, stdlib Python tools and meaningful checks. It excludes bytecode, runtime execution state and unrelated project files. The skill supplies resumable execution and local coordination; the host provides subagent execution/isolation, and real acceptance evidence remains required.
