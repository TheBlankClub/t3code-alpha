---
id: alpha-homebrew-upgrades
status: active
risk: red
introduced_by: alpha-homebrew-upgrades
last_reconciled_with: 860caaa6023a3aaf616a5899816c74c195ca8de2
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
- 2026-08-17, upstream `a4cc1367b03ee0c1dc2b50fceac81ef5e63212e2`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-18, upstream `cebac353defde6211c9e8c3d8ecd140c92042930`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-20, upstream `f708f63fa9bcd7e51f1f62531f6f9ed966b71807`: `unaffected`;
  incoming marketing download selection and desktop updater changes do not alter the Alpha cask,
  pinned certificate, artifact checksums, or Homebrew publication path.
- 2026-08-20, upstream `beab6886f45bf42906d0bd01aefe5dfe9e66a867`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-22, upstream `b381fdb12cb7cb241e2b8aca84941375f3fb43f4`: `unaffected`; incoming web
  composer, terminal, preview, and CI-parallelization changes do not touch this feature's
  surfaces.
- 2026-08-22, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `mechanical-overlap`;
  adopted the shared desktop builder's faster Windows packaging and resource-monitor reuse while
  retaining the fork-owned cask, pinned certificate, and Homebrew upgrade contract.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `mechanical-overlap`;
  adopted upstream's smaller macOS dependency set and signing helper while retaining the
  fork-owned self-signed identity, pinned certificate, cask, and Homebrew upgrade contract.
