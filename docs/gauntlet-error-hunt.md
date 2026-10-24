# Gauntlet: production error hunt

A [gauntlet loop](../.claude/skills/gauntlet-loop/SKILL.md) prompt for finding and fixing every defect in the React app, the Worker and the Firestore rules. Paste it into a fresh agent session.

```
Make Innerverse free of defects a user, an attacker or a Russian reader could hit.

The bar is two things at once. The repo's own gates all pass on the same commit: npm run lint, npm test, npm run test:rules, then npm run build and npm run test:browser. And a fresh critic who has never seen the code cannot reproduce a single defect, whether a failing input, a rule hole, a crash, a wrong score, a lost save, an axe violation, or Russian copy that breaks src/shared/i18n/strings.ts («вы», its terms). Run the gates for real and try the inputs for real. Do not judge from reading alone.

Break the system into the smallest parts that can be attacked on their own. For each part, fan out a builder and a separate critic with fresh context. The critic attacks the actual code and the running app, proves each defect with a failing test or command, and names the single worst one. Then it goes back to the builder, who fixes it test-first.

The critic should be a harsh critic. Praise is not useful. If it finds anything, it keeps going.

/loop on each part until a fresh critic finds nothing it can reproduce and every gate is green. Do not stop before that.

Keep a live progress page updating as the work evolves so I can watch it.

Fan out subagents and ultracode.
```

Constraints that apply to every run: no writes to production Firebase or Stripe, read-only requests to the live sites only, no Angular code, and Beads stays the task tracker (`bd`), never `issues.jsonl`.
