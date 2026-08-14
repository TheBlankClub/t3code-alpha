---
id: alpha-update-channel
status: active
risk: red
introduced_by: alpha-update-channel
last_reconciled_with: 9885a845c97325b1099b095011da8385485616f5
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

Give T3 Code Alpha a dedicated prerelease upgrade channel with the same check, download, restart,
and install flow as Nightly, while keeping publication and branding under TheBlankClub's control.

# Behavioral invariants

- Versions use `X.Y.Z-alpha.YYYYMMDD.RUN` and resolve to the `alpha` updater channel.
- Alpha enables prerelease discovery, downgrade-compatible channel transitions, and full changelog
  release notes just like Nightly.
- Version/channel mismatch checks prevent Stable or Nightly versions from being accepted as Alpha
  updates.
- Electron Builder publishes Alpha as a GitHub prerelease with an explicit `alpha` channel.
- Desktop Settings presents Alpha as a fixed track and does not direct users to official feeds.
- Bundled web and desktop icons resolve to the Alpha artwork family for Alpha versions.
- Hosted Alpha web remains out of scope until separate hosting infrastructure exists.

# Current delta

- Contracts, desktop settings, updater runtime, version recognition, web branding, and build
  configuration recognize `alpha`.
- `assets/alpha/app-icon.icon` provides a dark graphite and ember blueprint source that preserves
  the upstream T3 geometry while remaining distinct from Dev, Nightly, and production.
- iOS, Linux, Windows, web, and macOS Alpha renditions are generated. The macOS icon uses a
  deterministic renderer because Icon Composer 2 emits a full-bleed pre-Tahoe export on macOS 27;
  it reuses the checked-in native Development icon's legacy body and neutral shadow alpha.
- The icon exporter retries without `--design-generation` when the installed Icon Composer 2 CLI
  reports that argument as unsupported.

# Retirement conditions

- Retire channel plumbing if upstream gains a configurable third-party distribution channel that
  can publish explicit Alpha manifests without exposing official feeds.
- Retire the artwork delta only if upstream supplies a configurable fork brand with equivalent
  cross-platform source and export support.

# Reconciliation notes

- 2026-08-15, upstream `9885a845c97325b1099b095011da8385485616f5`: added the Alpha
  channel and deterministic cross-platform artwork, including the macOS 27 legacy-render fallback.
