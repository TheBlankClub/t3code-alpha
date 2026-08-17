---
id: alpha-upstream-sync-automation
status: active
risk: red
introduced_by: alpha-upstream-sync-automation
last_reconciled_with: a4cc1367b03ee0c1dc2b50fceac81ef5e63212e2
upstream_issue: null
upstream_pr: null
surfaces:
  - ci
  - operations
tests:
  - actionlint .github/workflows/sync-upstream.yml .github/workflows/finalize-upstream-sync.yml .github/workflows/ci.yml .github/workflows/mobile-fingerprint-check.yml
  - vp test run scripts/classify-alpha-sync.test.ts scripts/record-alpha-safe-sync.test.ts
---

# Intent

Detect upstream changes every six hours and automatically integrate only policy-safe,
CI-validated merge-ancestry candidates without allowing automation to make unverified semantic
reconciliation claims about Alpha-only features.

# Behavioral invariants

- Sync candidates always start from the current `alpha` branch and merge official
  `pingdotgg/t3code` `main` with a merge commit.
- Incoming paths are compared with the current Alpha delta and a protected-surface policy. Exact
  overlaps and identity, persistence, contract, packaging, updater, SSH, or release changes require
  human review even when Git merges cleanly.
- A policy-safe merge updates one reusable automation branch and pull request, updates active
  feature records as unaffected, and becomes eligible for automatic merge only after required CI.
- A textual merge conflict creates or updates a visible blocker issue containing the exact Alpha
  base, upstream commit, and conflicted paths.
- A successful first CI pass causes the finalizer to append a journal entry tied to the tested
  candidate and CI run. A second CI pass over that journaled head is required before auto-merge.
- Review-required candidates remain open with an issue and never auto-merge or trigger a release.
- Fork CI runs on standard GitHub-hosted runners and validates pushes to `alpha` plus pull requests.
- Sync mutations use a narrowly installed GitHub App so automation-created pull requests trigger
  CI without per-run approval.

# Current delta

- `.github/workflows/sync-upstream.yml` performs scheduled divergence checks and maintains the
  `automation/upstream-main` sync PR.
- `.github/workflows/finalize-upstream-sync.yml` journals tested safe candidates and enables their
  merge only after the journaled head also passes CI.
- `.alpha/auto-sync-policy.json` and `scripts/classify-alpha-sync.ts` define the conservative
  automatic-versus-review boundary.
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
- 2026-08-15, upstream `20a70420a85aecab0bde1a58921197f423e401cc`: `unaffected`; retained the
  fork-owned daily reconciliation workflow and review gates.
- 2026-08-16, upstream `2f486ab80c748b4d8e3d3b17e49b5a327cb93335`: `unaffected`; retained the
  six-hour fork sync workflow, protected-surface policy, journal gate, and merge-ancestry model.
- 2026-08-17, upstream `a4cc1367b03ee0c1dc2b50fceac81ef5e63212e2`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
