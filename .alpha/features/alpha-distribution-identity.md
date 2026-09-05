---
id: alpha-distribution-identity
status: active
risk: red
introduced_by: alpha-distribution-identity
last_reconciled_with: 07d2497db89014ccd71aa077fc809aff47e4af91
upstream_issue: null
upstream_pr: null
surfaces:
  - desktop
  - server
  - packaging
tests:
  - vp test run apps/desktop/src/app/DesktopEnvironment.test.ts apps/desktop/src/app/DesktopEarlyElectronStartup.test.ts apps/desktop/src/app/DesktopEarlyUserData.test.ts apps/desktop/src/app/DesktopAppIdentity.test.ts apps/desktop/src/app/DesktopClerk.test.ts apps/desktop/src/app/DesktopLinuxUrlHandler.test.ts apps/desktop/src/electron/ElectronProtocol.test.ts apps/desktop/scripts/electron-launcher.test.mjs
  - vp test run apps/server/scripts/migrate-nightly-data-to-alpha.test.ts
  - vp test run scripts/build-desktop-artifact.test.ts -t "product names|Safe Storage|platform-specific packaging|passkey signing|Alpha renderer protocol"
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
- Electron selects the Alpha user-data directory synchronously before its first GPU, network, or
  renderer helper can launch.
- Packaged Alpha uses the application ID `com.theblankclub.t3code.alpha` and renderer protocol
  `t3code-alpha://app`.
- Packaged Alpha uses the npm-style application name `t3code-alpha`, so Electron Safe Storage uses
  `t3code-alpha Safe Storage` instead of the official and Nightly `t3code Safe Storage` item.
- Linux uses Alpha-specific executable, desktop entry, window class, and URL-handler identities.
- Alpha artifacts use the `T3-Code-Alpha-*` prefix.
- Development keeps the upstream `t3code-dev` identity and worktree-safe state behavior.
- The server accepts the Alpha renderer origin without dropping the upstream desktop origins.

# Current delta

- `packages/shared/src/alphaDistribution.ts` is the canonical registry for installed Alpha
  identity values shared by runtime and packaging code.
- Desktop environment and pre-ready startup select Alpha defaults only outside development.
- The desktop main process synchronously selects the Alpha Electron profile before constructing the
  asynchronous runtime layer graph.
- Electron, Clerk, Linux URL handling, and desktop packaging consume the centralized identity.
- The staged desktop manifest derives its package name from the release channel, keeping upstream
  Stable and Nightly behavior unchanged while isolating Alpha's macOS Keychain service.
- Upstream's source-asset desktop launcher model resolves its non-development icon from Alpha's
  canonical artwork while retaining Alpha's bundle identifier and URL protocol.
- The server recognizes `t3code-alpha://app` as a desktop renderer origin.
- `migrate:nightly-to-alpha` provides a backup-first, SQLite-consistent migration with explicit
  switch and clone identity policies; origin-scoped Chromium profiles remain isolated.

# Retirement conditions

- Retire only when upstream provides a configurable distribution identity covering application
  IDs, protocols, state roots, Electron user data, OS registrations, and artifact names, and Alpha
  can express every invariant through that upstream model without bespoke runtime code.

# Reconciliation notes

- 2026-09-05, upstream `07d2497db89014ccd71aa077fc809aff47e4af91`: `unaffected`; provider
  settings field-reader cleanup does not alter Alpha distribution identity.

- 2026-09-05, upstream `e5a87e8b9ca9db21e0291ddbd54438c5fe56b277`: `unaffected`; pull request
  filter deduplication does not alter Alpha distribution identity.

- 2026-09-05, upstream `2fa5ef4c7bf3aafabe98392d25be7eb86847ce8f`: `upstream-redesign`;
  adopted host-portable launcher paths, background-service diagnostics, managed SSH execution, and
  Windows packaging fixes while retaining Alpha app, profile, protocol, package, service, and
  artifact identities.

- 2026-08-15, upstream `9885a845c97325b1099b095011da8385485616f5`: created the isolated
  Alpha distribution identity on top of upstream's `DesktopEnvironment` and build configuration.
- 2026-08-15, upstream `74f7b434865c2d758c7b1cd5f52f4c96b76d03fb`: `unaffected`; incoming
  changes do not touch desktop identity, protocols, state paths, server origins, or artifact names.
- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: `mechanical-overlap`;
  adopted remote editor discovery and desktop IPC while retaining Alpha app origins and identity.
- 2026-08-15, upstream `ec141c125726ae70f31f392e780afa8de446fdc4`: `mechanical-conflict`;
  adopted upstream's OS-locale desktop timestamp contract while retaining Alpha's isolated app,
  protocol, state, and packaging identity.
- 2026-08-15, upstream `20a70420a85aecab0bde1a58921197f423e401cc`: `unaffected`; adopted
  upstream's same-locale date and time formatting without changing Alpha distribution identity.
- 2026-08-16, upstream `ad117235b544e23545fe39143812db2ddd41af1f`: `mechanical-conflict`;
  adopted upstream's generated launcher-icon model and removal of checked-in desktop resource
  icons while retaining Alpha's app ID, protocol, product name, and canonical Alpha icon source.
- 2026-08-16, upstream `2f486ab80c748b4d8e3d3b17e49b5a327cb93335`: `unaffected`; adopted
  upstream's restored dark palette and simplified theme controls without changing Alpha's app,
  protocol, state, server-origin, or packaging identity.
- 2026-08-17, upstream `a4cc1367b03ee0c1dc2b50fceac81ef5e63212e2`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-18, upstream `cebac353defde6211c9e8c3d8ecd140c92042930`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-20, upstream `f708f63fa9bcd7e51f1f62531f6f9ed966b71807`: `mechanical-overlap`;
  adopted upstream's macOS LaunchAgent service model while deriving its label from Alpha's isolated
  application ID. Incoming desktop lifecycle and passkey changes do not alter Alpha state,
  protocol, packaging, or renderer identity.
- 2026-08-20, upstream `beab6886f45bf42906d0bd01aefe5dfe9e66a867`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-22, upstream `b381fdb12cb7cb241e2b8aca84941375f3fb43f4`: `unaffected`; incoming web
  composer, terminal, preview, and CI-parallelization changes do not touch this feature's
  surfaces.
- 2026-08-22, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `mechanical-overlap`;
  adopted upstream's desktop packaging optimizations and Tailscale endpoint fix while retaining
  Alpha's app, protocol, state, package, service, and artifact identities.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `mechanical-conflict`;
  adopted upstream's macOS preview, signing optimization, and service PATH changes while retaining
  Alpha's app, protocol, state, package, service, Safe Storage, and artifact identities. The fork
  preview uses a GitHub-hosted runner and an Alpha prerelease version.
- 2026-08-27, upstream `ead4ce52a1624d9c55461f61524580978fc8b719`: `mechanical-overlap`;
  adopted upstream's `0.0.35` package baseline and anonymous preview downloads while retaining the
  Alpha app, package, repository, binary, artifact, runner, and prerelease identities.
- 2026-08-29, upstream `0e2905eb783fd2385f358a95f0b25bbf07ff7122`: `mechanical-conflict`;
  adopted upstream's packaged WSL runtime and preload verification while combining its WSL bundle
  flag with Alpha's macOS signing identity. App, protocol, state, Safe Storage, and artifact
  identities remain Alpha-specific.
- 2026-08-28, upstream `22c311ddecfbab2e541a374a46f2df87d4fc6305`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-29, upstream `053affbed2659f90cd1b1efaaa7a75865c4131c7`: `mechanical-overlap`;
  adopted upstream's `0.0.36` desktop package baseline and Expo 57 mobile stack while retaining
  Alpha's app, protocol, state, Safe Storage, service, and artifact identities.
- 2026-08-30, upstream `c0e09f323ac9f6bf4b9119cbad841db3379588d6`: `unaffected`; incoming
  markdown, preview, composer, pull-request, and title-retry changes do not alter Alpha app,
  protocol, state, Safe Storage, service, package, or artifact identities.
- 2026-08-30, upstream `2daff8c25adf701fddd062ae93b94cc57d420ec2`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-31, upstream `352710d497cc640553e3e18e23fb5a5f3f890466`: `mechanical-overlap`;
  adopted upstream's video attachment CSP and asset serving changes while retaining Alpha's app,
  protocol, state, Safe Storage, service, package, and artifact identities.
- 2026-09-02, upstream `2d156a83b96ebf2e4a9c6017251baad357ae6ab1`: `mechanical-conflict`;
  adopted upstream's `0.0.37` package baseline and Electron 43.4.1 while retaining Alpha's app,
  protocol, state, Safe Storage, package, service, repository, and artifact identities.
- 2026-09-02, upstream `60cef47ec983637ddc68faed7b1488b6f3c3a175`: `mechanical-conflict`;
  adopted upstream's `0.0.38` package baseline and preview runtime fixes while retaining Alpha's
  app, protocol, state, Safe Storage, package, service, repository, and artifact identities.
- 2026-09-02, upstream `70cd258d8aac43ea57494527b00bf36de3efa6c0`: `upstream-redesign`;
  adopted upstream's desktop activation broker, remote desktop updates, and service downgrade
  controls while retaining Alpha's app, protocol, state, package, service, and artifact identities.
- 2026-09-03, upstream `1aa44a071f66bdfd9430356ab824b5a6985fb459`: `mechanical-conflict`;
  repointed the nightly-to-alpha migration script at `@t3tools/shared/nodeSqliteClient` after
  upstream moved the node:sqlite Effect SQL client into shared, and adapted the new `t3 app`
  CLI tests to search the fork's `.t3-alpha` default home. Both were semantic overlaps the
  Git merge did not flag; the previous sync had left the `t3 app` tests failing on `alpha`.
- 2026-09-03, upstream `5b8445b7a777ab1070aa97b062b1618971073a96`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-04, upstream `caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6`: `mechanical-conflict`;
  adopted upstream browser-import dependencies, desktop runtime wiring, and Linux build libraries
  while retaining Alpha app, profile, protocol, package, service, and artifact identities.
- 2026-09-04, upstream `c3b8825bf476cbce5e061c0f99570cf1f6723b89`: `unaffected`;
  incoming settings, task-state, and tool-rendering changes do not alter Alpha's app, profile,
  protocol, package, service, or artifact identities.
