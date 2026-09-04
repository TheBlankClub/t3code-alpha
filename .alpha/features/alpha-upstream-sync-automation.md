---
id: alpha-upstream-sync-automation
status: active
risk: red
introduced_by: alpha-upstream-sync-automation
last_reconciled_with: c3b8825bf476cbce5e061c0f99570cf1f6723b89
upstream_issue: null
upstream_pr: null
surfaces:
  - ci
  - operations
tests:
  - actionlint .github/workflows/sync-upstream.yml .github/workflows/finalize-upstream-sync.yml .github/workflows/ci.yml .github/workflows/mobile-fingerprint-check.yml
  - vp test run scripts/alpha-workflow-contract.test.ts scripts/classify-alpha-sync.test.ts scripts/record-alpha-safe-sync.test.ts
---

# Intent

Detect upstream changes every six hours and automatically integrate conflict-free, CI-validated
merge-ancestry candidates. Report semantic overlap without making unverified claims that an
Alpha-only feature is unaffected.

# Behavioral invariants

- Sync candidates always start from the current `alpha` branch and merge official
  `pingdotgg/t3code` `main` with a merge commit.
- Incoming paths are compared with the current Alpha delta and protected surfaces. The pull request
  reports and labels semantic overlap, but overlap does not block a conflict-free candidate.
- A conflict-free merge updates one reusable automation branch and pull request, records active
  features as auto-merged, and becomes eligible for automatic merge only after required CI.
- A textual merge conflict creates or updates a visible blocker issue containing the exact Alpha
  base, upstream commit, and conflicted paths.
- A successful first CI pass causes the finalizer to append a journal entry tied to the tested
  candidate and CI run. A second CI pass over that journaled head is required before auto-merge.
- Candidates with failed CI remain open with a blocker issue and never auto-merge or trigger a
  release.
- Fork CI runs on standard GitHub-hosted runners and validates pushes to `alpha` plus pull requests.
- Sync mutations use a narrowly installed GitHub App so automation-created pull requests trigger
  CI without per-run approval.

# Current delta

- `.github/workflows/sync-upstream.yml` performs scheduled divergence checks and maintains the
  `automation/upstream-main` sync PR.
- `.github/workflows/finalize-upstream-sync.yml` journals tested conflict-free candidates and
  enables their
  merge only after the journaled head also passes CI.
- `.alpha/auto-sync-policy.json` and `scripts/classify-alpha-sync.ts` define the advisory semantic
  overlap report.
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
- 2026-08-18, upstream `cebac353defde6211c9e8c3d8ecd140c92042930`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-20, upstream `f708f63fa9bcd7e51f1f62531f6f9ed966b71807`: `unaffected`;
  the protected updater, server-package, and identity overlaps correctly required manual
  reconciliation; the automation policy and workflows remain unchanged.
- 2026-08-20, upstream `beab6886f45bf42906d0bd01aefe5dfe9e66a867`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-22, upstream `b381fdb12cb7cb241e2b8aca84941375f3fb43f4`: `mechanical-conflict`; adopted
  upstream's `mobile_native_changes` gate for the mobile native lint job while remapping its
  Blacksmith runner labels back to public GitHub-hosted runners in core CI.
- 2026-08-22, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `mechanical-overlap`;
  the protected official release workflow changed, so this reconciliation stayed manual. The
  six-hour classifier, journal finalizer, public runners, and CI merge gate remain unchanged.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `mechanical-overlap`;
  protected packaging, persistence, contracts, and a new preview workflow required manual review.
  The preview workflow now uses a public GitHub-hosted runner; the sync classifier, journal
  finalizer, and CI merge gates remain unchanged.
- 2026-08-27, upstream `ead4ce52a1624d9c55461f61524580978fc8b719`: `mechanical-overlap`;
  protected preview, package, and contract paths correctly required manual review. The expanded
  preview workflow uses public runners, while the sync classifier, journal finalizer, and CI merge
  gates remain unchanged.
- 2026-08-29, upstream `0e2905eb783fd2385f358a95f0b25bbf07ff7122`: `mechanical-overlap`;
  protected packaging, telemetry, persistence, contract, and workflow paths correctly required
  manual review. Fork CI keeps public runners, and the classifier, journal finalizer, and merge
  gates remain unchanged.
- 2026-08-29, automation policy: semantic overlap is now advisory. Every conflict-free candidate
  can auto-merge after CI passes on the candidate and journaled head. Git conflicts, failed CI,
  and changed head SHAs remain hard blockers.
- 2026-08-28, upstream `22c311ddecfbab2e541a374a46f2df87d4fc6305`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-29, upstream `053affbed2659f90cd1b1efaaa7a75865c4131c7`: `unaffected`; incoming
  product-default review policy and protected package, contract, and dependency paths correctly
  required manual reconciliation. Fork sync, journal, public-runner, and CI gates remain unchanged.
- 2026-08-30, upstream `c0e09f323ac9f6bf4b9119cbad841db3379588d6`: `unaffected`; the classifier
  correctly flagged the Alpha composer overlap and protected title-generation paths for manual
  review. Fork sync, journal, public-runner, and CI gates remain unchanged.
- 2026-08-30, upstream `2daff8c25adf701fddd062ae93b94cc57d420ec2`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-31, upstream `352710d497cc640553e3e18e23fb5a5f3f890466`: `unaffected`; the classifier
  correctly flagged Alpha chat, desktop protocol, server origin, and dependency overlaps for
  manual review. Fork sync, journal, public-runner, and CI gates remain unchanged.
- 2026-09-02, upstream `2d156a83b96ebf2e4a9c6017251baad357ae6ab1`: `unaffected`; the classifier
  flagged package, composer, client-runtime, contract, persistence, and dependency paths for
  review. Fork sync, journal, public-runner, and CI gates remain unchanged.
- 2026-09-02, upstream `60cef47ec983637ddc68faed7b1488b6f3c3a175`: `unaffected`; the classifier
  flagged Alpha package, chat, settings, contract, and lockfile overlaps for review. Fork sync,
  journal, public-runner, and CI gates remain unchanged.
- 2026-09-02, upstream `70cd258d8aac43ea57494527b00bf36de3efa6c0`: `unaffected`; the classifier
  flagged identity, updater, service, contract, persistence, and lockfile paths for review. Fork
  sync, journal, public-runner, and CI gates remain unchanged.
- 2026-09-03, upstream `5b8445b7a777ab1070aa97b062b1618971073a96`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-04, upstream `caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6`: `mechanical-overlap`;
  adopted upstream CI build-library setup and the on-demand Windows workflow while preserving the
  fork's GitHub-hosted runners, semantic classifier, journal finalizer, and merge-ancestry flow.
- 2026-09-04, upstream `c3b8825bf476cbce5e061c0f99570cf1f6723b89`: `unaffected`;
  incoming application changes do not alter the classifier, journal finalizer, runner policy, or
  merge-ancestry flow.
