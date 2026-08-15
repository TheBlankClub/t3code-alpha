---
id: alpha-release-workflow
status: active
risk: red
introduced_by: alpha-release-workflow
last_reconciled_with: 2f486ab80c748b4d8e3d3b17e49b5a327cb93335
upstream_issue: null
upstream_pr: null
surfaces:
  - ci
  - packaging
  - desktop
  - server
tests:
  - actionlint .github/workflows/release-alpha.yml
  - vp test run scripts/resolve-alpha-release.test.ts scripts/resolve-nightly-release.test.ts scripts/classify-alpha-sync.test.ts scripts/record-alpha-safe-sync.test.ts
  - node scripts/resolve-alpha-release.ts --date 20260815 --run-number 27 --sha abcdef1234567890
---

# Intent

Build an unsigned, manual-install Alpha prerelease from the integration branch without invoking
upstream's official release, hosted-web, AUR, or npm publication paths.

# Behavioral invariants

- The workflow always checks out and releases the `alpha` branch, even when manually dispatched.
- The upstream release workflow is repository-gated and cannot react to Alpha tags or schedules in
  the fork.
- A successful CI run for a push to `alpha` starts publication only when its exact SHA is still the
  branch head and does not already have an Alpha release tag.
- A daily scheduled run retries an unreleased Alpha head after transient publication failures.
- Manual and scheduled runs also skip an already tagged source SHA, preventing duplicate releases.
- Versions use `X.Y.Z-alpha.YYYYMMDD.RUN`; GitHub releases are prereleases and never become latest.
- macOS arm64/x64, Linux x64, and Windows x64 artifacts use upstream's desktop builder and Alpha
  artifact identities.
- Desktop artifacts are intentionally not signed with platform developer credentials. macOS builds
  receive a complete ad-hoc seal, while GitHub releases contain manual installers only, not updater
  manifests, blockmaps, or macOS ZIP update payloads.
- Release CI mounts each produced macOS DMG and requires its embedded app to pass strict deep
  signature verification with the Alpha bundle identifier and an ad-hoc signature.
- Apple signing/notarization, Azure Trusted Signing, Clerk, and T3 Connect configuration are not
  release dependencies. Cloud linking is not part of this fork distribution.
- npm publication uses provenance, the canonical `latest` tag, and the temporary `t3code-alpha`
  manifest. GitHub releases retain Alpha versioning and prerelease status.
- npm publishes use GitHub OIDC trusted publishing and no long-lived npm token. The package was
  reserved interactively before enabling the automated release workflow.
- After a successful GitHub prerelease, the tap-owned updater independently validates and publishes
  the matching macOS cask without a cross-repository credential.
- The workflow does not deploy the official hosted web app, publish official AUR packages, mutate
  source package versions, or announce through upstream channels.

# Current delta

- `.github/workflows/release-alpha.yml` adapts the upstream release build graph to standard GitHub
  hosted runners and fork-owned release destinations, with CI-success, stale-SHA, duplicate-tag,
  and failure-escalation gates.
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
- 2026-08-15, upstream `ec141c125726ae70f31f392e780afa8de446fdc4`: `unaffected`; retained the
  Alpha-only release graph while adopting the incoming product changes through merge ancestry.
- 2026-08-15, upstream `20a70420a85aecab0bde1a58921197f423e401cc`: `unaffected`; the incoming
  timestamp formatting fix does not touch the Alpha release graph.
- 2026-08-16, upstream `ad117235b544e23545fe39143812db2ddd41af1f`: `mechanical-overlap`;
  adopted upstream's DMG background pipeline and retained the Alpha-only release graph, adding an
  Alpha background plus strict verification of the ad-hoc application seal before publication.
- 2026-08-16, upstream `2f486ab80c748b4d8e3d3b17e49b5a327cb93335`: `unaffected`; adopted the
  incoming web theme behavior through merge ancestry without changing Alpha CI, packaging, npm,
  GitHub prerelease, or Homebrew publication responsibilities.
