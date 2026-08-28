# Alpha Release Setup

> For maintainers of `TheBlankClub/t3code-alpha`. The official stable/nightly process remains in
> [Release Checklist](release.md).

Alpha releases are produced only from the `alpha` branch by
`.github/workflows/release-alpha.yml`. The workflow publishes self-signed macOS and unsigned
Windows/Linux desktop installers to this repository, publishes the exact matching server version
to the public `t3code-alpha` npm package, creates a GitHub prerelease, and updates the `t3code-alpha` cask in
`TheBlankClub/homebrew-tap`. The tap owns the final step: it checks the public prerelease feed every
30 minutes and publishes only after both macOS DMGs are complete.

This release model does not require Apple, Azure, Clerk, or T3 Connect configuration. It deliberately
does not publish Electron updater manifests: automatic desktop updates are disabled because Alpha
is not Developer ID-signed or notarized.

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
request, journal conflict-free candidates, auto-merge them after required CI, and report blockers. The
release workflow preflight verifies that the App can mint a token scoped to `t3code-alpha` before
building or publishing anything. `homebrew-tap` needs no cross-repository token: its own scheduled
workflow reads the public Alpha prerelease feed and commits the audited cask with its repository
`GITHUB_TOKEN`.

The macOS signing secrets described below are the only additional release secrets.

## 3. Persistent macOS release identity

Alpha uses one long-lived self-signed code-signing certificate to keep its macOS designated
requirement stable across upgrades. The public certificate is committed at
`assets/alpha/signing/t3code-alpha-release-signing.cer`. The private identity is stored only in
these repository Actions secrets:

- `ALPHA_MAC_SIGNING_P12_BASE64`: base64-encoded PKCS#12 identity.
- `ALPHA_MAC_SIGNING_P12_PASSWORD`: password for that PKCS#12 identity.

Release jobs import the identity into an ephemeral Keychain, prove its SHA-1 fingerprint matches
the committed public certificate, and pass its exact common name to the desktop builder. They then
mount the DMG and require both a strict deep seal and this designated requirement:

```text
identifier "com.theblankclub.t3code.alpha" and certificate leaf = H"A3FE7063335600A78DDB3634CF76D5E1EF6D9645"
```

Do not rotate this certificate merely to refresh a release. Rotation changes the application
identity macOS uses for Keychain and privacy grants and therefore requires a deliberate migration.
Keep an offline recovery copy of the private identity; GitHub Actions secrets cannot be read back.

## 4. Branch protection and CI

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

Conflict-free automated syncs perform this in two CI passes: the first validates the reconciled
candidate, the finalizer appends the evidence-backed journal entry, and the second validates the
journaled head before auto-merge. Alpha-delta and protected-path overlap remains visible in the PR
report and advisory label. A Git merge conflict or failed CI blocks the merge.

Every successful CI run for a push to the current `alpha` head starts a release when that exact SHA
does not already have an Alpha tag. A daily scheduled run retries an unreleased head after transient
registry or artifact failures. Stale CI runs and already tagged commits are skipped. After a
prerelease is complete, the tap's next scheduled run publishes its cask independently.

## 5. macOS installation and upgrades

The recommended macOS path is Homebrew:

```sh
brew install --cask theblankclub/tap/t3code-alpha
```

Upgrade with:

```sh
brew update
brew upgrade --cask t3code-alpha
```

Alpha is not signed with an Apple Developer ID. The cask verifies the bundle against the pinned
self-signed release certificate, then removes quarantine. It never re-signs the application. Use
this path only for release artifacts you trust.

The first upgrade from the former ad-hoc release may require one final macOS permission prompt.
The packaged application also changes its Electron package name from `t3code` to `t3code-alpha`,
which isolates Alpha's `t3code-alpha Safe Storage` Keychain item from Nightly. Existing Alpha remote
connection credentials encrypted under the former item may need to be entered again. Do not delete
the old `t3code Safe Storage` item because official and Nightly installations may still use it.

A manual upgrade also works: download the DMG for the Mac's architecture, quit T3 Code Alpha,
replace `T3 Code Alpha.app` in Applications, and reopen it. macOS may require the user to right-click
the app and choose Open. Both methods preserve application state under `~/.t3-alpha`.

Windows and Linux remain manual-install targets. Windows may show a SmartScreen warning for the
unsigned installer; Linux users replace the AppImage.

## 6. First release proof

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
   `brew upgrade --cask t3code-alpha` replaces an older Alpha app, produces a bundle that passes
   `codesign --verify --deep --strict`, satisfies the pinned certificate requirement, and leaves no
   `com.apple.quarantine` attribute. Upgrade once more and confirm macOS does not repeat Keychain or
   Downloads-folder prompts.
6. Confirm the desktop identity, protocol, and state remain isolated from official T3 Code and that
   Settings reports automatic updates as unavailable for non-Developer-ID Alpha builds.

Only after this proof should the temporary npm `bootstrap` tag be removed and the scheduled release
be treated as operational.
