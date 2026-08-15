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

Build an unsigned, manual-install Alpha prerelease from the integration branch without invoking
upstream's official release, hosted-web, AUR, or npm publication paths.

# Behavioral invariants

- The workflow always checks out and releases the `alpha` branch, even when manually dispatched.
- The upstream release workflow is repository-gated and cannot react to Alpha tags or schedules in
  the fork.
- Scheduled runs skip when the Alpha branch still points to the most recent Alpha tag.
- Versions use `X.Y.Z-alpha.YYYYMMDD.RUN`; GitHub releases are prereleases and never become latest.
- macOS arm64/x64, Linux x64, and Windows x64 artifacts use upstream's desktop builder and Alpha
  artifact identities.
- Desktop artifacts are intentionally unsigned. GitHub releases contain manual installers only,
  not updater manifests, blockmaps, or macOS ZIP update payloads.
- Apple signing/notarization, Azure Trusted Signing, Clerk, and T3 Connect configuration are not
  release dependencies. Cloud linking is not part of this fork distribution.
- npm publication uses provenance, the canonical `latest` tag, and the temporary `t3code-alpha`
  manifest. GitHub releases retain Alpha versioning and prerelease status.
- npm publishes use GitHub OIDC trusted publishing and no long-lived npm token. The package was
  reserved interactively before enabling the automated release workflow.
- After a successful GitHub prerelease, the workflow validates and publishes the matching macOS
  cask to `TheBlankClub/homebrew-tap` with the Alpha automation GitHub App.
- The workflow does not deploy the official hosted web app, publish official AUR packages, mutate
  source package versions, or announce through upstream channels.

# Current delta

- `.github/workflows/release-alpha.yml` adapts the upstream release build graph to standard GitHub
  hosted runners and fork-owned release destinations.
- `docs/operations/alpha-release.md` records the one-time npm, GitHub App, Homebrew,
  branch-protection, and first-release gates.
- `scripts/resolve-alpha-release.ts` reuses upstream's next-patch version calculation and adds the
  Alpha prerelease metadata contract.
- `scripts/render-alpha-homebrew-cask.ts` binds the cask version and architecture checksums to the
  exact macOS artifacts produced by the release.

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
- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: changed the fork release
  policy to unsigned manual installers and Homebrew-managed macOS upgrades, removing Apple,
  Azure, Clerk, and T3 Connect release gates.
