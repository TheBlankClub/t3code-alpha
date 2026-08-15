---
id: alpha-update-channel
status: active
risk: red
introduced_by: alpha-update-channel
last_reconciled_with: 2f486ab80c748b4d8e3d3b17e49b5a327cb93335
upstream_issue: null
upstream_pr: null
surfaces:
  - contracts
  - desktop
  - web
  - packaging
tests:
  - vp run icons:alpha-macos
  - vp test run apps/desktop/src/updates/updateChannels.test.ts apps/desktop/src/settings/DesktopAppSettings.test.ts apps/desktop/src/updates/DesktopUpdates.test.ts apps/web/src/branding.test.ts scripts/lib/brand-assets.test.ts
  - vp test run scripts/build-desktop-artifact.test.ts -t "updater channels|packaging icons|favicon branding|GitHub desktop publish config"
  - vp run --filter @t3tools/contracts --filter @t3tools/desktop --filter @t3tools/web --filter @t3tools/scripts typecheck
---

# Intent

Give T3 Code Alpha a dedicated prerelease identity while keeping publication and branding under
TheBlankClub's control. Until Alpha releases use Apple Developer ID signing and updater metadata,
upgrades are performed through Homebrew or a manually downloaded installer rather than Electron's
automatic updater.

# Behavioral invariants

- Versions use `X.Y.Z-alpha.YYYYMMDD.RUN` and resolve to the `alpha` updater channel.
- The `alpha` channel remains part of version recognition, settings, packaging identity, and future
  signed-updater compatibility.
- Version/channel mismatch checks prevent Stable or Nightly versions from being accepted as Alpha
  updates.
- Packaged Alpha versions disable automatic update checks and explain that the latest installer is
  available from TheBlankClub's releases.
- GitHub releases omit updater metadata and publish only manual installer artifacts.
- Homebrew upgrades replace the app bundle while preserving Alpha state in `~/.t3-alpha`.
- Desktop Settings presents Alpha as a fixed track and never directs users to official feeds.
- Bundled web and desktop icons resolve to the Alpha artwork family for Alpha versions.
- Hosted Alpha web remains out of scope until separate hosting infrastructure exists.

# Current delta

- Contracts, desktop settings, updater runtime, version recognition, web branding, and build
  configuration recognize `alpha`.
- The updater runtime detects Alpha versions and remains disabled while the distribution lacks
  Apple Developer ID signing, notarization, and updater manifests.
- `assets/alpha/app-icon.icon` provides a dark graphite and ember blueprint source that preserves
  the upstream T3 geometry while remaining distinct from Dev, Nightly, and production.
- iOS, Linux, Windows, web, and macOS Alpha renditions are generated. The macOS icon uses a
  deterministic renderer because Icon Composer 2 emits a full-bleed pre-Tahoe export on macOS 27;
  it reuses the checked-in native Development icon's legacy body and neutral shadow alpha.
- The icon exporter retries without `--design-generation` when the installed Icon Composer 2 CLI
  reports that argument as unsupported.
- Desktop launcher and unpackaged non-development asset resolution use the canonical Alpha icon
  family, and Alpha DMGs use a dedicated dark graphite and ember installer background.

# Retirement conditions

- Retire channel plumbing if upstream gains a configurable third-party distribution channel that
  can publish explicit Alpha manifests without exposing official feeds.
- Retire the artwork delta only if upstream supplies a configurable fork brand with equivalent
  cross-platform source and export support.

# Reconciliation notes

- 2026-08-15, upstream `9885a845c97325b1099b095011da8385485616f5`: added the Alpha
  channel and deterministic cross-platform artwork, including the macOS 27 legacy-render fallback.
- 2026-08-15, upstream `74f7b434865c2d758c7b1cd5f52f4c96b76d03fb`: `unaffected`; retained
  Alpha updater and branding behavior. Upstream's AUR publication remains official-channel-only.
- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: `mechanical-overlap`;
  adopted upstream's optional remote-editor IPC contract while retaining the `alpha` updater channel.
- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: retained the channel as an
  identity boundary but disabled automatic installation for the current unsigned release policy.
- 2026-08-15, upstream `ec141c125726ae70f31f392e780afa8de446fdc4`: `mechanical-conflict`;
  adopted upstream's hold-to-quit setting and desktop IPC additions while retaining the fixed
  `alpha` channel, fork-owned release feed, branding, and Homebrew upgrade path.
- 2026-08-15, upstream `20a70420a85aecab0bde1a58921197f423e401cc`: `unaffected`; adopted the
  upstream timestamp fix without changing Alpha's channel, feed, branding, or upgrade path.
- 2026-08-16, upstream `ad117235b544e23545fe39143812db2ddd41af1f`: `mechanical-conflict`;
  adopted upstream's canonical source-asset launcher and themed DMG pipeline, replacing production
  fallbacks with Alpha artwork and adding an Alpha-specific installer background.
- 2026-08-16, upstream `2f486ab80c748b4d8e3d3b17e49b5a327cb93335`: `unaffected`; adopted
  upstream's restored dark palette and simplified advanced theme families while retaining Alpha's
  updater channel, release feed, fixed Settings track, and artwork branding.
