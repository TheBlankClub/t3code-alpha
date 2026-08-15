---
id: alpha-server-package
status: active
risk: red
introduced_by: alpha-server-package
last_reconciled_with: ec141c125726ae70f31f392e780afa8de446fdc4
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
- User-visible update and recovery commands point only to the Alpha package and binary.
- Alpha CLI builds identify their channel in the T3 Connect loopback completion page.

# Current delta

- `packages/shared/src/alphaDistribution.ts` owns the package, binary, dist-tag, home-directory,
  and systemd-unit identities.
- The publisher rewrites the packed manifest to the Alpha npm identity while the source workspace
  keeps upstream's internal `t3` package name for deterministic Effect service keys. The published
  manifest retains its description and license, and the publisher preserves interactive stdin for
  npm write authentication.
- CLI suggestions, remote SSH bootstrap, pinned self-update, and the standalone service launcher
  resolve the Alpha package consistently.
- Web and shared client-runtime update messages identify the package users actually install.

# Retirement conditions

- Retire only when upstream exposes a configurable server distribution identity covering npm
  package and binary names, default state roots, SSH bootstrap, pinned runtime layout, user-facing
  commands, and background-service registration.

# Reconciliation notes

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
