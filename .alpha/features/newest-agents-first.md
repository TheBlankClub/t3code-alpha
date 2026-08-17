---
id: newest-agents-first
status: active
risk: green
introduced_by: newest-agents-first
last_reconciled_with: cd096b9ad5a4156ffeab85de617cbb219057007f
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
