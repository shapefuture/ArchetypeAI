# Beads progress tracking

This repository uses [gastownhall/beads](https://github.com/gastownhall/beads), with an existing embedded Dolt database and the `ArchetypeAI` issue prefix.

Read [the roadmap guide](../docs/beads-roadmap.md) for the root epic, stage gates, task index, installation and workflow. [80-20-plan.md](../docs/80-20-plan.md) is the detailed product/implementation specification; status and evidence live in Beads.

```bash
bd prime
bd dolt pull
bd ready --label roadmap --type task
bd show ArchetypeAI-28h
bd dep cycles
bd dolt push
```

Issues live in `.beads/embeddeddolt` on this configured workspace. Cross-machine synchronization uses the separate `refs/dolt/data` on the GitHub remote. `.beads/issues.jsonl` is a passive export, not the synchronization protocol or a complete database backup. Git code commits and tracker sync are separate operations; do not assume a code push automatically published task changes.

Use `bd update <id> --claim`, attach acceptance evidence with `bd update <id> --append-notes`, and complete work with `bd close <id> --reason`. Preserve existing history; do not reinitialize or routinely import exports. Never include credentials in issue descriptions or notes.
