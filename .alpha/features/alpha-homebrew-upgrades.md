---
id: alpha-homebrew-upgrades
status: active
risk: red
introduced_by: alpha-homebrew-upgrades
last_reconciled_with: ec141c125726ae70f31f392e780afa8de446fdc4
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

Provide a repeatable macOS install and upgrade path for unsigned Alpha builds without requiring an
Apple Developer account or a separate package-hosting service.

# Behavioral invariants

- `TheBlankClub/homebrew-tap` is the canonical tap and `t3code-alpha` is the cask token.
- The cask points only to macOS DMGs attached to a completed Alpha GitHub prerelease.
- The cask version equals the released desktop and `t3code-alpha` npm package version.
- arm64 and x64 SHA-256 values are calculated from the artifacts produced by the same workflow run.
- The cask is audited before the automation GitHub App commits it to the tap.
- Installation and upgrades use Homebrew's explicit `--no-quarantine` option while Alpha remains
  unsigned; the cask does not silently remove quarantine attributes.
- Replacing the app bundle does not delete Alpha state under `~/.t3-alpha`.

# Current delta

- `scripts/render-alpha-homebrew-cask.ts` generates the architecture-aware cask.
- `.github/workflows/release-alpha.yml` downloads the completed macOS artifacts, audits the rendered
  cask on macOS, and commits it to the tap with the Alpha automation GitHub App.
- The tap repository has its own macOS cask audit workflow.

# Retirement conditions

- Retire only if upstream provides a configurable, fork-owned Homebrew publication path with the
  same package identity and repository boundaries.

# Reconciliation notes

- 2026-08-15, upstream `804cba4305b15f929937833c93e85db0835d8903`: added the fork-owned
  Homebrew cask path for unsigned Alpha macOS upgrades.
- 2026-08-15, upstream `ec141c125726ae70f31f392e780afa8de446fdc4`: `unaffected`; no incoming
  change replaces the fork-owned cask renderer, tap publication, or unsigned upgrade policy.
