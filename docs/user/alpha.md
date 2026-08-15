# Install and update T3 Code Alpha

T3 Code Alpha is TheBlankClub's frequently updated distribution of T3 Code. It installs beside the
official application and keeps its own state in `~/.t3-alpha`.

## Command-line server

Run the latest Alpha server without installing it globally:

```sh
npx t3code-alpha@latest
```

## macOS desktop app

Alpha is not signed with an Apple Developer ID. If you trust TheBlankClub's release artifacts,
install its Homebrew cask. The cask automatically applies and verifies an ad-hoc signature, then
removes quarantine after every install or upgrade:

```sh
brew install --cask theblankclub/tap/t3code-alpha
```

Upgrade it with:

```sh
brew update
brew upgrade --cask t3code-alpha
```

You can instead download the DMG for your Mac from the
[Alpha releases](https://github.com/TheBlankClub/t3code-alpha/releases), quit the app, and replace
`T3 Code Alpha.app` in Applications. Both methods preserve your Alpha settings and projects.

Automatic updates inside the desktop app are unavailable while Alpha releases remain unsigned.
