---
id: newest-agents-first
status: active
risk: green
introduced_by: newest-agents-first
last_reconciled_with: 2fa5ef4c7bf3aafabe98392d25be7eb86847ce8f
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

- 2026-09-05, upstream `2fa5ef4c7bf3aafabe98392d25be7eb86847ce8f`: `unaffected`; incoming
  provider, runtime-diagnostic, and client presentation changes do not alter newest-first direct
  agent ordering or stable row positions.

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
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `unaffected`; incoming pinned
  thread ordering and work-log rendering changes do not touch direct-agent ordering or row stability.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `unaffected`; incoming
  provider, thread, pull-request, attachment, and mobile list changes do not touch the shared direct
  agent ordering model or row stability.
- 2026-08-27, upstream `ead4ce52a1624d9c55461f61524580978fc8b719`: `unaffected`; incoming Codex
  multi-agent event support and Grok provider changes do not touch direct-agent ordering or row
  stability in the shared client runtime.
- 2026-08-29, upstream `0e2905eb783fd2385f358a95f0b25bbf07ff7122`: `mechanical-overlap`;
  adopted upstream's sub-agent model and effort metadata coverage in the shared runtime tests while
  retaining stable newest-first ordering for direct agents.
- 2026-08-28, upstream `22c311ddecfbab2e541a374a46f2df87d4fc6305`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-29, upstream `053affbed2659f90cd1b1efaaa7a75865c4131c7`: `unaffected`; incoming
  client attachment, server descriptor, and settling changes do not alter direct-agent ordering or
  row stability.
- 2026-08-30, upstream `c0e09f323ac9f6bf4b9119cbad841db3379588d6`: `unaffected`; incoming
  markdown, preview, composer, pull-request, and title-retry changes do not alter direct-agent
  ordering or row stability.
- 2026-08-30, upstream `2daff8c25adf701fddd062ae93b94cc57d420ec2`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-31, upstream `352710d497cc640553e3e18e23fb5a5f3f890466`: `unaffected`; incoming
  attachment, artifact-template, interim-turn, and mobile changes do not alter direct-agent
  ordering or row stability.
- 2026-09-02, upstream `2d156a83b96ebf2e4a9c6017251baad357ae6ab1`: `unaffected`; incoming agent
  activity visibility, work-log, provider, and client-runtime changes do not alter direct-agent
  ordering or row stability.
- 2026-09-02, upstream `60cef47ec983637ddc68faed7b1488b6f3c3a175`: `unaffected`; incoming chat
  activity, mobile work-log, and provider-model changes do not alter direct-agent ordering or row
  stability.
- 2026-09-02, upstream `70cd258d8aac43ea57494527b00bf36de3efa6c0`: `unaffected`; incoming chat,
  task-progress, provider, and mobile work-log changes do not alter direct-agent ordering or row
  stability.
- 2026-09-03, upstream `5b8445b7a777ab1070aa97b062b1618971073a96`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-04, upstream `caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6`: `mechanical-overlap`;
  adopted upstream Antigravity subagent lifecycle fixes while retaining newest-first direct-agent
  ordering and stable row positions.
- 2026-09-04, upstream `c3b8825bf476cbce5e061c0f99570cf1f6723b89`: `mechanical-overlap`;
  adopted upstream's batch identity and idle presentation while retaining newest-first direct-agent
  ordering and stable row positions.
