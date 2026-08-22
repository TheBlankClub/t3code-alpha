---
id: newest-agents-first
status: active
risk: green
introduced_by: newest-agents-first
last_reconciled_with: 035058a23e651ea5f407c9ab73cf5329cc40c102
upstream_issue: null
upstream_pr: null
surfaces:
  - web
  - client-runtime
tests:
  - vp test run packages/client-runtime/src/state/subagentRuntime.test.ts
---

# Intent

Keep newly spawned direct agents immediately visible at the top of the Agents panel without making
users scroll past older agents.

# Behavioral invariants

- Direct agents render newest-first according to when each agent was first observed.
- Activity, status, and completion updates never reorder existing rows.
- Workflow, phase, status, retention, and summary behavior remain unchanged.

# Current delta

- The shared agent-panel model sorts direct agents by `firstSeenAt` descending with a deterministic
  ID tie-breaker.

# Retirement conditions

- Retire when upstream presents direct agents newest-first while preserving stable row positions
  across activity updates.

# Reconciliation notes

- 2026-08-17, upstream `cd096b9ad5a4156ffeab85de617cbb219057007f`: `unaffected`; current
  upstream still orders direct agents oldest-first and incoming changes do not touch the subagent
  runtime or Agents panel.
- 2026-08-17, upstream `a4cc1367b03ee0c1dc2b50fceac81ef5e63212e2`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-18, upstream `cebac353defde6211c9e8c3d8ecd140c92042930`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-20, upstream `f708f63fa9bcd7e51f1f62531f6f9ed966b71807`: `unaffected`;
  incoming tool-activity presentation changes do not touch the shared agent-panel ordering model.
- 2026-08-20, upstream `beab6886f45bf42906d0bd01aefe5dfe9e66a867`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-22, upstream `b381fdb12cb7cb241e2b8aca84941375f3fb43f4`: `unaffected`; incoming composer,
  terminal, and scroll-anchoring changes do not touch the shared agent-panel ordering model.
- 2026-08-22, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
