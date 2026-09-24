---
id: antigravity-path-canonicalization
status: active
risk: amber
introduced_by: antigravity-path-canonicalization
last_reconciled_with: f26ee083fe41720207fb10616359500dcecc19d3
upstream_issue: null
upstream_pr: null
surfaces:
  - server
  - providers
tests:
  - vp test run apps/server/src/provider/AntigravityInstallation.test.ts apps/server/src/provider/Layers/AntigravityAdapter.test.ts
---

# Intent

Keep Antigravity executable discovery and client file writes correct on filesystems where one
directory has multiple path spellings, without allowing a symlinked ancestor to escape the
session workspace.

# Behavioral invariants

- External Antigravity executables resolve to their canonical filesystem paths.
- Client file writes can create missing nested directories below a canonical workspace root when
  the requested path uses an alias such as macOS `/var` for `/private/var`.
- An existing ancestor symlink that points outside an allowed root is rejected before any missing
  directory or file is created.

# Current delta

- Antigravity client file resolution canonicalizes the nearest existing parent before it checks
  the allowed session roots and creates missing descendants.
- Provider tests cover canonical executable results, alias paths, and an escape through a symlinked
  ancestor with a missing child directory.

# Retirement conditions

- Retire when upstream canonicalizes Antigravity executable expectations and nearest existing file
  parents while preserving the same workspace escape checks.

# Reconciliation notes

- 2026-09-24, upstream `f26ee083fe41720207fb10616359500dcecc19d3`: `unaffected`. Incoming web appearance and linked pull-request label changes do not alter this feature.

- 2026-09-24, upstream `b2b43bef73447c483ceae486890cb79f01c369cb`: `unaffected`. The incoming changes preserve this feature and its recorded invariants.

- 2026-09-21, upstream `1de563c1491c7d82563e4553bf5bf689ce6adbb9`: `unaffected`. Upstream does not change Antigravity path resolution or workspace write checks.

- 2026-09-20, upstream `c14f6015bfe479d313355cb234af1a5c16dbb15f`: `unaffected`. The header layout and action menus do not change this feature.

- 2026-09-20, upstream `7445aa733ada33e45289e5aa5055f79142556513`: `unaffected`. ACP stderr handling preserves Antigravity executable and workspace path checks.

- 2026-09-19, upstream `dfbb11bdd7c3f1a5575cb55d3e3abb12be025727`: `unaffected`. No incoming change alters Antigravity path handling.

- 2026-09-18, upstream `03950089ffa5cecf0ce731227f58551f6437495f`: `mechanical-conflict`. Adopted upstream runtime discovery changes while retaining canonical-parent handling and symlink-escape checks.

- 2026-09-15, upstream `5623089aea68ca62811f51321686c259fa4c810f`: `unaffected`. No incoming changes alter Antigravity path canonicalization or workspace containment.

- 2026-09-14, upstream `1bbca0e78202c8ece73351fccd29f3c99070b82e`: `unaffected`.
  The streaming-mode contract and settings changes preserve this feature.

- 2026-09-14, upstream `3b75e607eb909522a8f5562fb40e44efc72bb66c`: `unaffected`.
  Incoming changes do not alter this feature or its retirement conditions.

- 2026-09-13, upstream `20363c32c9bfdbf49c2716ef11d1f18483fcc01b`: `unaffected`.
  Upstream ACP context changes leave canonical path checks intact.

- 2026-09-12, upstream `e816064945144957b6eb9b268912a98b0555644b`: `unaffected`. No incoming
  change touches Antigravity session path parsing.

- 2026-09-12, upstream `efccda9ac9230db22b36990cffabdad218fa41b0`: `unaffected`. Provider
  history, model selection, and rewind changes do not alter Antigravity session path parsing.

- 2026-09-11, upstream `c52b8d96e4b34201f19b5e5bb12c6b2a77bfaa9a`: `mechanical-overlap`. Upstream
  passes the agent device environment through the Antigravity session options. Nearest-existing-
  parent canonicalization and workspace escape checks are retained.

- 2026-09-10, upstream `d29c56a5c404cb0f58d3b2ac41762fa0d0ac28d4`: `mechanical-overlap`.
  Adopted upstream's Effect and provider export changes while retaining nearest-existing-parent
  canonicalization and workspace escape checks.

- 2026-09-07, upstream `dc39615aec702ea6d402168f80b4d1613f4f2e0f`: `unaffected`. The five incoming mobile
  fixes and LegendList patch do not change this feature. The Alpha release changes remain intact.

- 2026-09-07, upstream `f57d3832c0219b4f6fbe2e86f824fedd232492c0`: `unaffected`. Adopted upstream compaction support while retaining nearest-existing-parent canonicalization and workspace escape checks.

- 2026-09-06, upstream `e5d086c262daab13a8adbb253e281c07ab235533`: `unaffected`. Adopted upstream authentication and skills changes while retaining canonical executable paths and missing-descendant workspace escape checks.

- 2026-09-05, upstream `07d2497db89014ccd71aa077fc809aff47e4af91`: `unaffected`; provider
  settings field-reader cleanup does not alter Antigravity path handling.

- 2026-09-05, upstream `e5a87e8b9ca9db21e0291ddbd54438c5fe56b277`: `unaffected`; pull request
  filter deduplication does not alter Antigravity path handling.

- 2026-09-05, upstream `2fa5ef4c7bf3aafabe98392d25be7eb86847ce8f`: `mechanical-conflict`;
  adopted host-platform Antigravity fixtures and the Windows skip while retaining canonical
  executable results and the missing-descendant symlink escape check.

- 2026-09-04, upstream `caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6`: `mechanical-conflict`;
  fixed two macOS failures in the new Antigravity provider and added a cross-platform regression
  test for missing descendants below a symlink that exits the workspace.
- 2026-09-04, upstream `c3b8825bf476cbce5e061c0f99570cf1f6723b89`: `mechanical-overlap`;
  adopted upstream's Antigravity runtime instructions and batch task identity while retaining
  executable and nearest-existing-parent path canonicalization.
- 2026-09-07, upstream `8b2838e0e8a73d3fa6476940445c372e47b99db4`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-13, upstream `dd6ba84dc96f83000388e14b90f6533d5f63315d`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-13, upstream `df7ccc8fd01f5d2a1d8ec21bef8f9c59398fe913`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-20, upstream `0ff87f251dafb32703d5f531e7b248ad0a581ee2`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
