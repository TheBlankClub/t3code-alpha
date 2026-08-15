---
id: alpha-distribution-identity
status: active
risk: red
introduced_by: alpha-distribution-identity
last_reconciled_with: 804cba4305b15f929937833c93e85db0835d8903
upstream_issue: null
upstream_pr: null
surfaces:
  - desktop
  - server
  - packaging
tests:
  - vp test run apps/desktop/src/app/DesktopEnvironment.test.ts apps/desktop/src/app/DesktopEarlyElectronStartup.test.ts apps/desktop/src/app/DesktopAppIdentity.test.ts apps/desktop/src/app/DesktopClerk.test.ts apps/desktop/src/app/DesktopLinuxUrlHandler.test.ts apps/desktop/src/electron/ElectronProtocol.test.ts apps/desktop/scripts/electron-launcher.test.mjs
  - vp test run scripts/build-desktop-artifact.test.ts -t "product names|platform-specific packaging|passkey signing|Alpha renderer protocol"
  - vp test run apps/server/src/server.test.ts -t "allows credentialed preflights"
---

# Intent

Allow T3 Code Alpha and the official T3 Code desktop application to be installed and run on the
same machine without sharing mutable state, OS registrations, single-instance locks, or packaging
identity.

# Behavioral invariants

- Packaged Alpha state defaults to `~/.t3-alpha`; an explicit `T3CODE_HOME` still wins.
- Electron user data and its single-instance lock use `t3code-alpha`, never an official product
  name or `t3code` path.
- Packaged Alpha uses the application ID `com.theblankclub.t3code.alpha` and renderer protocol
  `t3code-alpha://app`.
- Linux uses Alpha-specific executable, desktop entry, window class, and URL-handler identities.
- Alpha artifacts use the `T3-Code-Alpha-*` prefix.
- Development keeps the upstream `t3code-dev` identity and worktree-safe state behavior.
- The server accepts the Alpha renderer origin without dropping the upstream desktop origins.

# Current delta

- `packages/shared/src/alphaDistribution.ts` is the canonical registry for installed Alpha
  identity values shared by runtime and packaging code.
- Desktop environment and pre-ready startup select Alpha defaults only outside development.
- Electron, Clerk, Linux URL handling, and desktop packaging consume the centralized identity.
- The server recognizes `t3code-alpha://app` as a desktop renderer origin.

# Retirement conditions

- Retire only when upstream provides a configurable distribution identity covering application
  IDs, protocols, state roots, Electron user data, OS registrations, and artifact names, and Alpha
  can express every invariant through that upstream model without bespoke runtime code.

# Reconciliation notes

- 2026-08-15, upstream `9885a845c97325b1099b095011da8385485616f5`: created the isolated
  Alpha distribution identity on top of upstream's `DesktopEnvironment` and build configuration.
- 2026-08-15, upstream `74f7b434865c2d758c7b1cd5f52f4c96b76d03fb`: `unaffected`; incoming
  changes do not touch desktop identity, protocols, state paths, server origins, or artifact names.
- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: `mechanical-overlap`;
  adopted remote editor discovery and desktop IPC while retaining Alpha app origins and identity.
