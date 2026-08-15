---
id: alpha-release-workflow
status: active
risk: red
introduced_by: alpha-release-workflow
last_reconciled_with: 804cba4305b15f929937833c93e85db0835d8903
upstream_issue: null
upstream_pr: null
surfaces:
  - ci
  - packaging
  - desktop
  - server
tests:
  - actionlint .github/workflows/release-alpha.yml
  - vp test run scripts/resolve-alpha-release.test.ts scripts/resolve-nightly-release.test.ts
  - node scripts/resolve-alpha-release.ts --date 20260815 --run-number 27 --sha abcdef1234567890
---

# Intent

Build a signed, updater-compatible Alpha prerelease from the integration branch without invoking
upstream's official release, hosted-web, AUR, or npm publication paths.

# Behavioral invariants

- The workflow always checks out and releases the `alpha` branch, even when manually dispatched.
- The upstream release workflow is repository-gated and cannot react to Alpha tags or schedules in
  the fork.
- Scheduled runs skip when the Alpha branch still points to the most recent Alpha tag.
- Versions use `X.Y.Z-alpha.YYYYMMDD.RUN`; GitHub releases are prereleases and never become latest.
- macOS arm64/x64, Linux x64, and Windows x64 artifacts use upstream's desktop builder and Alpha
  artifact/updater identities.
- macOS signing/notarization and Windows Trusted Signing are mandatory release gates; missing
  inputs fail their platform builds rather than publishing unsigned installers.
- Public T3 Connect variables are mandatory so an Alpha release does not silently ship a reduced
  cloud feature set.
- npm publication uses provenance, the canonical `latest` tag, and the temporary `t3code-alpha`
  manifest. Desktop/GitHub updater releases remain on the `alpha` channel.
- npm publishes use GitHub OIDC trusted publishing and no long-lived npm token. The package was
  reserved interactively before enabling the automated release workflow.
- The workflow does not deploy the official hosted web app, publish official AUR packages, mutate
  source package versions, or announce through upstream channels.

# Current delta

- `.github/workflows/release-alpha.yml` adapts the upstream release build graph to standard GitHub
  hosted runners and fork-owned release destinations.
- `docs/operations/alpha-release.md` records the one-time npm, automation, signing, variables,
  branch-protection, and first-release gates.
- `scripts/resolve-alpha-release.ts` reuses upstream's next-patch version calculation and adds the
  Alpha prerelease metadata contract.
- Public T3 Connect build configuration is read from fork repository variables; release secrets
  remain external GitHub configuration.

# Retirement conditions

- Retire if upstream provides a parameterized fork-release workflow that can select an integration
  branch, custom prerelease identifier, repository-owned signing, npm package identity, and GitHub
  release destination without touching official distribution channels.

# Reconciliation notes

- 2026-08-15, upstream `74f7b434865c2d758c7b1cd5f52f4c96b76d03fb`: created the Alpha-only
  release workflow from upstream's current packaging, resource-monitor, WSL, signing, and updater
  assembly sequence.
- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: `unaffected`; retained the
  Alpha-only release graph and adopted upstream remote-editor support independently.
