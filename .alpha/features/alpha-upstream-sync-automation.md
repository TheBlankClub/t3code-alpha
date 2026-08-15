---
id: alpha-upstream-sync-automation
status: active
risk: red
introduced_by: alpha-upstream-sync-automation
last_reconciled_with: ec141c125726ae70f31f392e780afa8de446fdc4
upstream_issue: null
upstream_pr: null
surfaces:
  - ci
  - operations
tests:
  - actionlint .github/workflows/sync-upstream.yml .github/workflows/ci.yml .github/workflows/mobile-fingerprint-check.yml
---

# Intent

Detect upstream changes every day and prepare a reviewable merge-ancestry sync without allowing
automation to make unverified semantic reconciliation claims about Alpha-only features.

# Behavioral invariants

- Sync candidates always start from the current `alpha` branch and merge official
  `pingdotgg/t3code` `main` with a merge commit.
- A clean merge updates one reusable automation branch and one pull request; it never auto-merges
  into Alpha.
- A textual merge conflict creates or updates a visible blocker issue containing the exact Alpha
  base, upstream commit, and conflicted paths.
- The PR cannot be merged under the fork policy until every active feature is classified, retained
  behavior is tested, feature records are updated, and a reconciliation journal entry is added.
- Fork CI runs on standard GitHub-hosted runners and validates pushes to `alpha` plus pull requests.
- Sync mutations use a narrowly installed GitHub App so automation-created pull requests trigger
  CI without per-run approval.

# Current delta

- `.github/workflows/sync-upstream.yml` performs scheduled divergence checks and maintains the
  `automation/upstream-main` sync PR.
- The fork's core CI and mobile fingerprint check use public GitHub-hosted runner labels rather
  than upstream's repository-specific Blacksmith runners.
- The local `maintain-alpha-fork` skill remains the authority for semantic conflict resolution and
  retirement decisions.

# Retirement conditions

- Retire the workflow if upstream provides a fork-safe integration mechanism with merge ancestry,
  semantic feature reconciliation, visible conflict escalation, and configurable runner pools.

# Reconciliation notes

- 2026-08-15, upstream `74f7b434865c2d758c7b1cd5f52f4c96b76d03fb`: added the daily sync
  preparation workflow and fork-owned CI runners after the initial manual reconciliation.
- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: `unaffected`; retained the
  fork sync workflow while adopting the incoming product change through merge ancestry.
- 2026-08-15, upstream `ec141c125726ae70f31f392e780afa8de446fdc4`: `unaffected`; retained the
  fork-owned daily reconciliation workflow and review gates.
