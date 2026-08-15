---
id: alpha-server-package
status: active
risk: red
introduced_by: alpha-server-package
last_reconciled_with: 74f7b434865c2d758c7b1cd5f52f4c96b76d03fb
upstream_issue: null
upstream_pr: null
surfaces:
  - server
  - desktop
  - web
  - packaging
tests:
  - vp test run packages/ssh/src/command.test.ts packages/ssh/src/tunnel.test.ts
  - vp test run apps/server/src/cloud/pinnedRuntime.test.ts apps/server/src/cloud/selfUpdate.test.ts apps/server/src/serviceLauncher.test.ts apps/server/src/cloud/bootService.test.ts apps/server/src/cli/invocation.test.ts apps/server/src/cli/service.test.ts apps/server/src/bin.test.ts apps/server/src/cloud/http.test.ts
  - vp test run apps/server/src/cloud/cliAuthHtml.test.ts apps/server/src/os-jank.test.ts scripts/dev-runner.test.ts
  - vp test run apps/web/src/versionSkew.test.ts apps/web/src/components/ServerUpdateAction.test.tsx
  - vp test run packages/client-runtime/src/state/server.test.ts
  - vp run --filter @t3tools/shared --filter @t3tools/ssh --filter @t3tools/client-runtime --filter t3 --filter @t3tools/web typecheck
  - vp run --filter t3 build
  - node apps/server/scripts/cli.ts publish --dry-run --tag alpha --app-version 0.0.33-alpha.20260815.1 --verbose
---

# Intent

Keep the Alpha CLI, server runtime, remote hosts, and Linux background service installable beside
official T3 Code without publishing to or executing the upstream `t3` package.

# Behavioral invariants

- npm publication uses `t3code-alpha` with the `alpha` dist-tag; it never publishes as `t3`.
- The globally installed command is `t3-alpha`, so it does not replace an official `t3` binary.
- Direct Alpha CLI launches default to `~/.t3-alpha`; an explicit `T3CODE_HOME` or `--base-dir`
  still wins.
- Desktop SSH installs exact Alpha versions from `t3code-alpha`, falls back to
  `t3code-alpha@alpha`, and stores managed remote state below `~/.t3-alpha`.
- Pinned updates install and launch `node_modules/t3code-alpha/dist/bin.mjs`.
- Linux installs `t3code-alpha.service`, leaving an official `t3code.service` untouched.
- User-visible update and recovery commands point only to the Alpha package and binary.
- Alpha CLI builds identify their channel in the T3 Connect loopback completion page.

# Current delta

- `packages/shared/src/alphaDistribution.ts` owns the package, binary, dist-tag, home-directory,
  and systemd-unit identities.
- The publisher rewrites the packed manifest to the Alpha npm identity while the source workspace
  keeps upstream's internal `t3` package name for deterministic Effect service keys.
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
