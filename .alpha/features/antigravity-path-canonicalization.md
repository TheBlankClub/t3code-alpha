---
id: antigravity-path-canonicalization
status: active
risk: amber
introduced_by: antigravity-path-canonicalization
last_reconciled_with: caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6
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

- 2026-09-04, upstream `caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6`: `mechanical-conflict`;
  fixed two macOS failures in the new Antigravity provider and added a cross-platform regression
  test for missing descendants below a symlink that exits the workspace.
