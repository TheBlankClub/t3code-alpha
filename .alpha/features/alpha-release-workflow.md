---
id: alpha-release-workflow
status: active
risk: red
introduced_by: alpha-release-workflow
last_reconciled_with: 74f7b434865c2d758c7b1cd5f52f4c96b76d03fb
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
- Scheduled runs skip when the Alpha branch still points to the most recent Alpha tag.
- Versions use `X.Y.Z-alpha.YYYYMMDD.RUN`; GitHub releases are prereleases and never become latest.
- macOS arm64/x64, Linux x64, and Windows x64 artifacts use upstream's desktop builder and Alpha
  artifact/updater identities.
- macOS signing/notarization and Windows Trusted Signing are mandatory release gates; missing
  inputs fail their platform builds rather than publishing unsigned installers.
- npm publication uses provenance, the `alpha` dist-tag, and the temporary `t3code-alpha`
  manifest.
- The workflow does not deploy the official hosted web app, publish official AUR packages, mutate
  source package versions, or announce through upstream channels.

# Current delta

- `.github/workflows/release-alpha.yml` adapts the upstream release build graph to standard GitHub
  hosted runners and fork-owned release destinations.
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
