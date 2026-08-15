---
id: alpha-homebrew-upgrades
status: active
risk: red
introduced_by: alpha-homebrew-upgrades
last_reconciled_with: 2f486ab80c748b4d8e3d3b17e49b5a327cb93335
upstream_issue: null
upstream_pr: null
surfaces:
  - ci
  - packaging
  - docs
tests:
  - vp test run scripts/render-alpha-homebrew-cask.test.ts
  - actionlint .github/workflows/release-alpha.yml
  - brew audit --cask --strict Casks/t3code-alpha.rb
---

# Intent

Provide a repeatable macOS install and upgrade path for Alpha builds without requiring an Apple
Developer account or a separate package-hosting service.

# Behavioral invariants

- `TheBlankClub/homebrew-tap` is the canonical tap and `t3code-alpha` is the cask token.
- The cask points only to macOS DMGs attached to a completed Alpha GitHub prerelease.
- The cask version equals the released desktop and `t3code-alpha` npm package version.
- arm64 and x64 SHA-256 values are calculated from the artifacts produced by the same workflow run.
- The tap-owned updater audits the cask before committing it with the tap's repository-scoped
  `GITHUB_TOKEN`.
- Release CI signs every macOS bundle with the same fork-owned self-signed identity.
- Every install and upgrade verifies the complete bundle strictly against the pinned public
  certificate and removes quarantine only after verification succeeds; the cask never re-signs it.
- Standard `brew install` and `brew upgrade` commands require no recurring manual signing or
  quarantine repair while Alpha remains outside Apple Developer ID signing and notarization.
- Reusing the release certificate preserves Alpha's designated requirement across upgrades, so
  macOS Keychain and privacy permissions recognize the replacement bundle as the same application.
- Replacing the app bundle does not delete Alpha state under `~/.t3-alpha`.

# Current delta

- `scripts/render-alpha-homebrew-cask.ts` generates the architecture-aware cask.
- `assets/alpha/signing/t3code-alpha-release-signing.cer` is the public certificate pinned by the
  release workflow and cask; its private key exists only in repository Actions secrets.
- `.github/workflows/release-alpha.yml` publishes the complete GitHub prerelease that acts as the
  cask's immutable artifact source.
- The tap repository has a scheduled updater and a separate macOS cask audit workflow; no
  cross-repository secret is required.

# Retirement conditions

- Retire only if upstream provides a configurable, fork-owned Homebrew publication path with the
  same package identity and repository boundaries.

# Reconciliation notes

- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: added the fork-owned
  Homebrew cask path for unsigned Alpha macOS upgrades.
- 2026-08-15, upstream `ec141c125726ae70f31f392e780afa8de446fdc4`: `unaffected`; no incoming
  change replaces the fork-owned cask renderer, tap publication, or unsigned upgrade policy.
- 2026-08-15, upstream `20a70420a85aecab0bde1a58921197f423e401cc`: `unaffected`; the incoming
  timestamp formatting fix does not touch Homebrew packaging or publication.
- 2026-08-16, upstream `ad117235b544e23545fe39143812db2ddd41af1f`: `mechanical-overlap`; the
  incoming DMG artwork support extends desktop packaging but does not replace the fork-owned cask
  repair. Homebrew ad-hoc signs and verifies every installed bundle before removing quarantine.
- 2026-08-16, upstream `2f486ab80c748b4d8e3d3b17e49b5a327cb93335`: `unaffected`; upstream's
  web theme changes do not touch the fork-owned Homebrew cask, artifact checksums, signing repair,
  or publication path.
- 2026-08-16, local Alpha delta: replaced per-upgrade ad-hoc signing with a persistent self-signed
  release identity. Homebrew now verifies the pinned identity and never changes the app seal.
