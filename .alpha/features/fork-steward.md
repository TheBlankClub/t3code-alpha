---
id: fork-steward
status: active
risk: green
introduced_by: alpha-foundation
last_reconciled_with: ec141c125726ae70f31f392e780afa8de446fdc4
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
