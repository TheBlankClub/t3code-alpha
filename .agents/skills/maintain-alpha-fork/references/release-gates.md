# Alpha release gates

## Identity must be explicit

Before the first Alpha release, decide whether it coexists with or replaces official T3 Code.
Coexistence requires a unique desktop app ID, product name, executable/desktop entry identity,
single-instance identity, URL protocol, user-data path, artifact names, and updater feed. Renaming the
window or package version is not isolation.

Use one centralized Alpha brand/channel model rather than scattering string replacements. Cover the
desktop shell, embedded web client, hosted web if shipped, About/settings surfaces, icons, and release
artifacts.

## Updater invariants

- Publish from the Alpha repository or another public-read feed owned by TheBlankClub.
- Use monotonically increasing SemVer versions and one deliberate Alpha channel.
- When automatic Electron updates are enabled, publish every expected ZIP, updater YAML manifest,
  and blockmap, sign and notarize macOS, and configure Windows signing before shipping Windows.
- While Alpha artifacts remain unsigned, disable automatic Electron updates, publish manual
  installers only, use the fork-owned Homebrew cask for macOS upgrades, and document quarantine and
  rollback behavior explicitly.
- Verify the active upgrade path from a previous Alpha release before calling it operational.
- Never embed a GitHub token in the distributed client.

The existing `T3CODE_DESKTOP_UPDATE_REPOSITORY` hook can point packaged builds at the Alpha release
repository, but channel parsing, version naming, branding, and identity still need an explicit Alpha
implementation.

## Desktop and server versions must agree

T3 clients request exact server versions, and current remote update paths install the upstream `t3`
npm package. A fork-specific desktop version therefore needs one of these deliberate policies:

1. Publish a distinct public Alpha CLI package and teach update/install paths to use it.
2. Ship desktop-only Alpha releases and disable or clearly block remote self-update until the server
   package design exists.
3. Restrict Alpha deltas to client-only behavior and pin to an existing upstream server version.

Do not publish the fork under the upstream `t3` package name. Do not claim remote-ready release parity
until the chosen policy is implemented and exercised.

## Workflow isolation

Do not copy the upstream release workflow unchanged. It currently includes upstream-owned npm,
relay, hosted-web, Discord, signing, and version-finalization responsibilities, including assumptions
about the `main` branch. Create an Alpha workflow that invokes shared build scripts but owns only the
fork's destinations and credentials.

Require, in order:

1. completed upstream reconciliation;
2. focused validation and package checks;
3. version and channel resolution;
4. artifact builds matching the recorded signed or unsigned distribution policy;
5. Alpha CLI publication when applicable;
6. GitHub prerelease publication and the artifacts required by the active upgrade policy;
7. install/update smoke verification;
8. release journal entry tied to the exact tag and SHA.
