# Alpha Release Setup

> For maintainers of `TheBlankClub/t3code-alpha`. The official stable/nightly process remains in
> [Release Checklist](release.md).

Alpha releases are produced only from the `alpha` branch by
`.github/workflows/release-alpha.yml`. The workflow publishes unsigned desktop installers to this
repository, publishes the exact matching server version to the public `t3code-alpha` npm package,
creates a GitHub prerelease, and updates the `t3code-alpha` cask in
`TheBlankClub/homebrew-tap`. The tap owns the final step: it checks the public prerelease feed every
30 minutes and publishes only after both macOS DMGs are complete.

This release model does not require Apple, Azure, Clerk, or T3 Connect configuration. It deliberately
does not publish Electron updater manifests: automatic desktop updates are disabled in packaged
Alpha builds while the artifacts are unsigned.

## 1. npm trusted publishing

The package must have this one trusted publisher:

- Provider: GitHub Actions
- Organization or user: `TheBlankClub`
- Repository: `t3code-alpha`
- Workflow filename: `release-alpha.yml`
- Environment: none
- Allowed action: `npm publish`

The publish job runs on a GitHub-hosted runner, grants `id-token: write`, and does not use an npm
token. The temporary publish manifest keeps its repository URL pointed at
`https://github.com/TheBlankClub/t3code-alpha`.

The package and trusted publisher are already reserved and configured. They can be verified with
npm 11.17 or newer:

```sh
npm trust list t3code-alpha
npm view t3code-alpha dist-tags repository bin
```

After the first automated Alpha release moves `latest` to the real release, remove the temporary
reservation tag:

```sh
npm dist-tag rm t3code-alpha bootstrap
```

`latest` is deliberate: `t3code-alpha` is a separate package identity.

## 2. Alpha automation GitHub App

Create one private GitHub App dedicated to Alpha automation. Install it on
`TheBlankClub/t3code-alpha`.

Grant these repository permissions:

- Contents: read and write
- Issues: read and write
- Pull requests: read and write
- Workflows: read and write

Add its credentials only to `TheBlankClub/t3code-alpha` as repository Actions secrets:

- `ALPHA_AUTOMATION_APP_ID`
- `ALPHA_AUTOMATION_APP_PRIVATE_KEY`

The six-hour upstream sync uses the installation token to update its merge branch, manage its pull
request, journal policy-safe candidates, auto-merge them after required CI, and report blockers. The
release workflow preflight verifies that the App can mint a token scoped to `t3code-alpha` before
building or publishing anything. `homebrew-tap` needs no cross-repository token: its own scheduled
workflow reads the public Alpha prerelease feed and commits the audited cask with its repository
`GITHUB_TOKEN`.

No repository Actions variables and no other Actions secrets are required for Alpha releases.

## 3. Branch protection and CI

Protect `alpha` with pull requests and require the four jobs from `.github/workflows/ci.yml`:

- `Check`
- `Test`
- `Mobile Native Static Analysis`
- `Release Smoke`

Do not require linear history: upstream reconciliation intentionally retains merge commits. Keep the
default `GITHUB_TOKEN` permission read-only; individual workflows declare their narrower write
permissions.

The `homebrew-tap` repository runs `.github/workflows/update-t3code-alpha.yml` every 30 minutes and
on manual dispatch. That workflow selects the newest complete Alpha prerelease, downloads both
macOS architectures, calculates their checksums, audits the rendered cask on macOS, and commits it.
Its separate `Test` workflow audits every cask change again.

Before merging an upstream reconciliation PR, confirm that its exact head contains the intended
upstream SHA, every active `.alpha/features/*.md` record is reconciled, and all four jobs pass.

Policy-safe automated syncs perform this in two CI passes: the first validates the reconciled
candidate, the finalizer appends the evidence-backed journal entry, and the second validates the
journaled head before auto-merge. Any Alpha-delta overlap or protected path remains review-only.

Every successful CI run for a push to the current `alpha` head starts a release when that exact SHA
does not already have an Alpha tag. A daily scheduled run retries an unreleased head after transient
registry or artifact failures. Stale CI runs and already tagged commits are skipped. After a
prerelease is complete, the tap's next scheduled run publishes its cask independently.

## 4. macOS installation and upgrades

The recommended macOS path is Homebrew:

```sh
brew install --cask --no-quarantine theblankclub/tap/t3code-alpha
```

Upgrade with:

```sh
brew update
brew upgrade --cask --no-quarantine t3code-alpha
```

`--no-quarantine` is explicit because the app is unsigned. Use it only for release artifacts you
trust. The cask itself does not silently alter quarantine attributes.

A manual upgrade also works: download the DMG for the Mac's architecture, quit T3 Code Alpha,
replace `T3 Code Alpha.app` in Applications, and reopen it. macOS may require the user to right-click
the app and choose Open. Both methods preserve application state under `~/.t3-alpha`.

Windows and Linux remain manual-install targets. Windows may show a SmartScreen warning for the
unsigned installer; Linux users replace the AppImage.

## 5. First release proof

The first successful `alpha` CI run starts the initial release after the GitHub App is installed. A
manual `Alpha Release` dispatch is also available, but duplicate-tag protection prevents publishing
the same SHA twice. On the exact released SHA:

1. Confirm preflight, every platform build, npm publish, and GitHub release jobs pass; then confirm
   the matching `Update T3 Code Alpha` and `Test` runs pass in `homebrew-tap`.
2. Confirm the GitHub release is a prerelease, is not the repository's latest release, and contains
   two DMGs, one AppImage, and one Windows installer. It must not contain updater YAML, blockmaps, or
   macOS ZIP payloads.
3. Confirm `npm view t3code-alpha@<version> version description license repository bin` matches the
   release and `npm view t3code-alpha dist-tags` points `latest` at it.
4. Install with `npx t3code-alpha@latest` and confirm the reported CLI version matches the package.
5. Install the Homebrew cask on both Apple Silicon and Intel where available, then verify
   `brew upgrade --cask --no-quarantine t3code-alpha` replaces an older Alpha app.
6. Confirm the desktop identity, protocol, and state remain isolated from official T3 Code and that
   Settings reports automatic updates as unavailable for unsigned Alpha builds.

Only after this proof should the temporary npm `bootstrap` tag be removed and the scheduled release
be treated as operational.
