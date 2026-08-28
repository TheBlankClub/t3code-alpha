---
id: alpha-update-channel
status: active
risk: red
introduced_by: alpha-update-channel
last_reconciled_with: 22c311ddecfbab2e541a374a46f2df87d4fc6305
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
  - vp test run apps/web/src/components/SidebarStageBackdrop.test.tsx apps/web/src/components/chat/ComposerPrimaryActions.test.tsx
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
- Appearance identifies Alpha with its graphite-and-ember artwork by default, with pill and hidden
  alternatives matching the Dev and Nightly controls.
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
- The web client carries that same material into the sidebar, composer send action, and standalone
  authentication surfaces without replacing the user's chosen theme.

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
- 2026-08-17, upstream `a4cc1367b03ee0c1dc2b50fceac81ef5e63212e2`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-18, upstream `cebac353defde6211c9e8c3d8ecd140c92042930`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-20, upstream `f708f63fa9bcd7e51f1f62531f6f9ed966b71807`: `upstream-redesign`;
  adopted upstream's serialized updater actions and queued-installer refresh behavior while
  retaining Alpha channel recognition, prerelease filtering, disabled unsigned updates, and the
  fork-owned installer message. Workspace and Settings redesigns preserve Alpha artwork controls.
- 2026-08-20, upstream `beab6886f45bf42906d0bd01aefe5dfe9e66a867`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-22, upstream `b381fdb12cb7cb241e2b8aca84941375f3fb43f4`: `unaffected`; incoming web
  composer, terminal, preview, and CI-parallelization changes do not touch this feature's
  surfaces.
- 2026-08-22, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `mechanical-overlap`;
  adopted upstream's appearance contrast controls and desktop packaging improvements while
  retaining Alpha channel recognition, disabled unsigned updates, and Alpha artwork.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `mechanical-overlap`;
  adopted upstream's preview packaging, macOS file exclusions, and signing helper while retaining
  Alpha channel recognition, disabled automatic updates, fork-owned artifacts, and Alpha artwork.
  Fork preview builds now use an Alpha prerelease version instead of a Stable-shaped PR version.
- 2026-08-27, upstream `ead4ce52a1624d9c55461f61524580978fc8b719`: `mechanical-overlap`;
  adopted upstream's anonymous preview publishing and `0.0.35` base version while retaining Alpha
  prerelease versions, public runners, fork-owned artifacts, and disabled automatic updates. A
  trusted build step appends a PR marker to each preview DMG for safe replacement and cleanup.
- 2026-08-29, upstream `0e2905eb783fd2385f358a95f0b25bbf07ff7122`: `mechanical-conflict`;
  combined upstream's WSL runtime bundle flag with Alpha's macOS signing identity in the desktop
  build configuration. Alpha channel recognition, artwork, fork-owned artifacts, and disabled
  automatic updates remain unchanged.
- 2026-08-28, upstream `22c311ddecfbab2e541a374a46f2df87d4fc6305`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
