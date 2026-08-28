---
id: fork-steward
status: active
risk: green
introduced_by: alpha-foundation
last_reconciled_with: 22c311ddecfbab2e541a374a46f2df87d4fc6305
upstream_issue: null
upstream_pr: null
surfaces:
  - repository-workflow
tests:
  - python3 /Users/maverick/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/maintain-alpha-fork
  - .agents/skills/maintain-alpha-fork/scripts/inspect-upstream.sh --fetch
---

# Intent

Keep the Alpha fork close to official T3 Code while preserving intentional Alpha behavior and
retiring fork code when upstream provides an equivalent or better implementation.

# Behavioral invariants

- Agents treat upstream `main` as the preferred implementation baseline.
- Textual conflict resolution never silently drops an active Alpha behavior.
- Semantic overlap is reviewed even when Git reports no conflict.
- An Alpha delta is removed once upstream satisfies all of its recorded invariants.
- Ambiguous, persistence-sensitive, updater, signing, and release conflicts do not auto-release.
- Shared `alpha` history is merged, not force-pushed.

# Current delta

- `.agents/skills/maintain-alpha-fork/` defines the reconciliation workflow, risk gates, ledger
  format, release constraints, and a deterministic upstream audit.
- `.alpha/features/` records the behavior and retirement conditions of intentional fork deltas.

# Retirement conditions

- Retire only if the repository adopts an upstream-owned fork reconciliation workflow that covers
  semantic feature retirement, Alpha release isolation, and the same safety gates.

# Reconciliation notes

- 2026-08-15, upstream `9885a845c97325b1099b095011da8385485616f5`: created the initial
  repository-owned stewardship foundation. Product identity and release behavior remain unchanged.
- 2026-08-15, upstream `74f7b434865c2d758c7b1cd5f52f4c96b76d03fb`: `unaffected`; retained
  the stewardship workflow while adopting upstream Git, AUR packaging, and theme fixes unchanged.
- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: `unaffected`; no upstream
  change replaces the repository-owned reconciliation policy or validation tooling.
- 2026-08-15, upstream `ec141c125726ae70f31f392e780afa8de446fdc4`: `unaffected`; no incoming
  change replaces the feature ledger, semantic conflict policy, or release gates.
- 2026-08-15, upstream `20a70420a85aecab0bde1a58921197f423e401cc`: `unaffected`; no incoming
  change replaces the feature ledger, semantic conflict policy, or release gates.
- 2026-08-16, upstream `2f486ab80c748b4d8e3d3b17e49b5a327cb93335`: `unaffected`; adopted the
  upstream theme fixes unchanged while retaining the feature ledger, semantic conflict policy,
  release gates, and reconciliation tooling.
- 2026-08-17, upstream `a4cc1367b03ee0c1dc2b50fceac81ef5e63212e2`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-18, upstream `cebac353defde6211c9e8c3d8ecd140c92042930`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-20, upstream `f708f63fa9bcd7e51f1f62531f6f9ed966b71807`: `unaffected`;
  reconciliation retained merge ancestry, classified protected overlaps, and updated the feature
  ledger without changing fork policy or release gates.
- 2026-08-20, upstream `beab6886f45bf42906d0bd01aefe5dfe9e66a867`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-22, upstream `b381fdb12cb7cb241e2b8aca84941375f3fb43f4`: `unaffected`; incoming web
  composer, terminal, preview, and CI-parallelization changes do not touch this feature's
  surfaces.
- 2026-08-22, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `unaffected`; retained the
  feature ledger, merge-ancestry policy, and reconciliation tooling while adopting the incoming
  product and packaging changes.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `unaffected`; retained the
  feature ledger, merge-ancestry policy, reconciliation tooling, and human review boundary while
  adopting the incoming product, contract, persistence, and packaging changes.
- 2026-08-27, upstream `ead4ce52a1624d9c55461f61524580978fc8b719`: `unaffected`; retained the
  feature ledger, merge-ancestry policy, reconciliation tooling, and human review boundary while
  adopting the incoming provider, contract, package, and preview changes.
- 2026-08-29, upstream `0e2905eb783fd2385f358a95f0b25bbf07ff7122`: `unaffected`; retained the
  feature ledger, merge-ancestry policy, reconciliation tooling, and human review boundary while
  adopting the incoming client, provider, persistence, contract, and packaging changes.
- 2026-08-28, upstream `22c311ddecfbab2e541a374a46f2df87d4fc6305`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
