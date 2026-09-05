---
id: alpha-server-package
status: active
risk: red
introduced_by: alpha-server-package
last_reconciled_with: 07d2497db89014ccd71aa077fc809aff47e4af91
upstream_issue: null
upstream_pr: null
surfaces:
  - server
  - desktop
  - web
  - packaging
tests:
  - vp test run apps/server/scripts/cli.test.ts
  - vp test run packages/ssh/src/command.test.ts packages/ssh/src/tunnel.test.ts
  - vp test run apps/server/src/cloud/pinnedRuntime.test.ts apps/server/src/cloud/selfUpdate.test.ts apps/server/src/serviceLauncher.test.ts apps/server/src/cloud/bootService.test.ts apps/server/src/cli/invocation.test.ts apps/server/src/cli/service.test.ts apps/server/src/bin.test.ts apps/server/src/cloud/http.test.ts
  - vp test run apps/server/src/cloud/cliAuthHtml.test.ts apps/server/src/os-jank.test.ts scripts/dev-runner.test.ts
  - vp test run apps/web/src/versionSkew.test.ts apps/web/src/components/ServerUpdateAction.test.tsx
  - vp test run packages/client-runtime/src/state/server.test.ts
  - vp run --filter @t3tools/shared --filter @t3tools/ssh --filter @t3tools/client-runtime --filter t3 --filter @t3tools/web typecheck
  - vp run --filter t3 build
  - node apps/server/scripts/cli.ts publish --dry-run --tag latest --app-version 0.0.33-alpha.20260815.1 --verbose
---

# Intent

Keep the Alpha CLI, server runtime, remote hosts, and Linux background service installable beside
official T3 Code without publishing to or executing the upstream `t3` package.

# Behavioral invariants

- npm publication uses the canonical `latest` tag on the separately named `t3code-alpha` package;
  it never publishes as `t3`.
- Local bootstrap publication inherits terminal input so npm write authentication can complete.
- The globally installed command is `t3-alpha`, so it does not replace an official `t3` binary.
- Direct Alpha CLI launches default to `~/.t3-alpha`; an explicit `T3CODE_HOME` or `--base-dir`
  still wins.
- Desktop SSH installs exact Alpha versions from `t3code-alpha`, falls back to
  `t3code-alpha@latest`, and stores managed remote state below `~/.t3-alpha`.
- Pinned updates install and launch `node_modules/t3code-alpha/dist/bin.mjs`.
- Linux installs `t3code-alpha.service`, leaving an official `t3code.service` untouched.
- macOS installs `com.theblankclub.t3code.alpha.service.plist`, leaving the official LaunchAgent
  label and plist untouched.
- User-visible update and recovery commands point only to the Alpha package and binary.
- Alpha CLI builds identify their channel in the T3 Connect loopback completion page.

# Current delta

- `packages/shared/src/alphaDistribution.ts` owns the package, binary, dist-tag, home-directory,
  and systemd-unit identities.
- CLI entrypoint fallback canonicalizes both the module and executable paths so npm links work
  through symlinked parent directories such as macOS `/var`.
- The publisher rewrites the packed manifest to the Alpha npm identity while the source workspace
  keeps upstream's internal `t3` package name for deterministic Effect service keys. The published
  manifest retains its description and license, and the publisher preserves interactive stdin for
  npm write authentication.
- CLI suggestions, remote SSH bootstrap, pinned self-update, and the systemd and launchd service
  managers resolve the Alpha package and service identities consistently.
- Web and shared client-runtime update messages identify the package users actually install.

# Retirement conditions

- Retire only when upstream exposes a configurable server distribution identity covering npm
  package and binary names, default state roots, SSH bootstrap, pinned runtime layout, user-facing
  commands, and background-service registration.

# Reconciliation notes

- 2026-09-05, upstream `07d2497db89014ccd71aa077fc809aff47e4af91`: `unaffected`; provider
  settings field-reader cleanup does not alter Alpha server package or service identity.

- 2026-09-05, upstream `e5a87e8b9ca9db21e0291ddbd54438c5fe56b277`: `unaffected`; pull request
  filter deduplication does not alter Alpha package, binary, service, or remote runtime identity.

- 2026-09-05, upstream `2fa5ef4c7bf3aafabe98392d25be7eb86847ce8f`: `upstream-redesign`;
  adopted exact-version repair diagnostics, service prerequisite checks, installer ownership, and
  direct managed SSH execution while retaining `t3code-alpha`, `t3-alpha`, `.t3-alpha`, and the
  Alpha systemd and launchd identities in commands, tests, and runtime paths.

- 2026-08-15, upstream `74f7b434865c2d758c7b1cd5f52f4c96b76d03fb`: created the isolated
  Alpha CLI/server package foundation. The package name was unclaimed in a current npm registry
  lookup; publishing ownership remains a release credential gate.
- 2026-08-15: reserved `t3code-alpha` on npm and made its canonical `latest` tag the Alpha upgrade
  target. The package name already provides channel isolation; desktop updater releases continue to
  use the `alpha` channel.
- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: `mechanical-overlap`;
  adopted upstream remote listener probing while retaining the Alpha SSH package, binary, and home.
- 2026-08-15, upstream `ec141c125726ae70f31f392e780afa8de446fdc4`: `mechanical-conflict`;
  adopted upstream's remote startup timeout, install validation, and empty-log diagnostics while
  teaching that validation to resolve Alpha's `t3-alpha` binary from `t3code-alpha@latest`.
- 2026-08-15, upstream `20a70420a85aecab0bde1a58921197f423e401cc`: `unaffected`; the incoming
  timestamp formatting fix does not touch Alpha server packaging or remote bootstrap behavior.
- 2026-08-16, upstream `2f486ab80c748b4d8e3d3b17e49b5a327cb93335`: `unaffected`; upstream's
  web theme controls do not touch the Alpha npm package, CLI binary, remote bootstrap, state root,
  or background service identity.
- 2026-08-17, upstream `a4cc1367b03ee0c1dc2b50fceac81ef5e63212e2`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-18, upstream `cebac353defde6211c9e8c3d8ecd140c92042930`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-20, upstream `f708f63fa9bcd7e51f1f62531f6f9ed966b71807`: `upstream-redesign`;
  adopted upstream's macOS launchd background-service implementation and retained Alpha's npm,
  binary, runtime, systemd, and new Alpha-specific LaunchAgent identities.
- 2026-08-20, upstream `beab6886f45bf42906d0bd01aefe5dfe9e66a867`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-22, upstream `b381fdb12cb7cb241e2b8aca84941375f3fb43f4`: `unaffected`; incoming web
  composer, terminal, preview, and CI-parallelization changes do not touch this feature's
  surfaces.
- 2026-08-22, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `partially-upstreamed`;
  upstream now contains the Alpha-carried SSH PATH and Tailscale endpoint fixes, so those duplicate
  implementations collapse through merge ancestry. Alpha's package, binary, state, and service
  identities remain required.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `upstream-redesign`;
  adopted upstream's portable CLI entrypoint detection and launchd PATH propagation while retaining
  the `t3code-alpha` package, `t3-alpha` binary, `~/.t3-alpha` state, and Alpha-specific systemd and
  launchd service identities. Canonicalizing both entrypoint paths fixes upstream's deterministic
  symlink mismatch on macOS.
- 2026-08-27, upstream `ead4ce52a1624d9c55461f61524580978fc8b719`: `mechanical-conflict`;
  adopted upstream's `0.0.35` package version while retaining the Alpha package description,
  repository, `t3-alpha` binary, state root, and service identities.
- 2026-08-29, upstream `0e2905eb783fd2385f358a95f0b25bbf07ff7122`: `mechanical-overlap`;
  adopted upstream's compressed WSL-local server runtime while retaining the `t3code-alpha`
  package, `t3-alpha` binary, `~/.t3-alpha` state, and Alpha-specific service identities.
- 2026-08-28, upstream `22c311ddecfbab2e541a374a46f2df87d4fc6305`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-29, upstream `053affbed2659f90cd1b1efaaa7a75865c4131c7`: `mechanical-conflict`;
  adopted upstream's `0.0.36` version and environment-theme CLI while retaining the
  `t3code-alpha` package, `t3-alpha` binary, Alpha repository, state root, and service identities.
- 2026-08-30, upstream `c0e09f323ac9f6bf4b9119cbad841db3379588d6`: `unaffected`; upstream's
  automatic title retry changes server orchestration only. The `t3code-alpha` package, `t3-alpha`
  binary, Alpha repository, state root, and service identities remain unchanged.
- 2026-08-30, upstream `2daff8c25adf701fddd062ae93b94cc57d420ec2`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-31, upstream `352710d497cc640553e3e18e23fb5a5f3f890466`: `unaffected`; incoming
  server usage, Git prompt, asset, and provider fixes do not alter the `t3code-alpha` package,
  `t3-alpha` binary, Alpha repository, state root, or service identities.
- 2026-09-02, upstream `2d156a83b96ebf2e4a9c6017251baad357ae6ab1`: `mechanical-conflict`;
  adopted upstream's `0.0.37` package baseline and server update, auth, session, and connection
  changes while retaining `t3code-alpha`, `t3-alpha`, `~/.t3-alpha`, and Alpha service identities.
- 2026-09-02, upstream `60cef47ec983637ddc68faed7b1488b6f3c3a175`: `mechanical-conflict`;
  adopted upstream's `0.0.38` package baseline and provider-model changes while retaining the
  `t3code-alpha` package, `t3-alpha` binary, Alpha repository, state root, and service identities.
- 2026-09-02, upstream `70cd258d8aac43ea57494527b00bf36de3efa6c0`: `upstream-redesign`;
  adopted upstream's service downgrade protection, restart-safe self-updates, and desktop-managed
  updates while retaining `t3code-alpha`, `t3-alpha`, `~/.t3-alpha`, and Alpha service identities.
- 2026-09-03, upstream `5b8445b7a777ab1070aa97b062b1618971073a96`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-04, upstream `caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6`: `mechanical-overlap`;
  adopted upstream Antigravity archive dependencies, managed-runtime work, and server changes while
  retaining the `t3code-alpha` package, `t3-alpha` binary, state root, and service identities.
- 2026-09-04, upstream `c3b8825bf476cbce5e061c0f99570cf1f6723b89`: `unaffected`;
  incoming provider prompt changes do not alter the `t3code-alpha` package, `t3-alpha` binary,
  state root, or service identities.
