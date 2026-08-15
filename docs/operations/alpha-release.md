# Alpha Release Setup

> For maintainers of `TheBlankClub/t3code-alpha`. The official stable/nightly process remains in
> [Release Checklist](release.md).

Alpha releases are produced only from the `alpha` branch by
`.github/workflows/release-alpha.yml`. The workflow publishes signed desktop artifacts to this
repository, publishes exact matching server versions to the public `t3code-alpha` npm package, and
creates GitHub prereleases on the Electron `alpha` updater channel.

Do not enable the scheduled workflow until every gate below is complete. A partially configured
release intentionally fails during preflight instead of publishing unsigned or reduced builds.

## 1. npm trusted publishing

The package must have this one trusted publisher:

- Provider: GitHub Actions
- Organization or user: `TheBlankClub`
- Repository: `t3code-alpha`
- Workflow filename: `release-alpha.yml`
- Environment: none
- Allowed action: `npm publish`

The publish job runs on a GitHub-hosted runner, grants `id-token: write`, uses Node 24, and does not
use an npm token. The temporary publish manifest must keep its repository URL pointed at
`https://github.com/TheBlankClub/t3code-alpha`.

With npm 11.17 or newer, an owner can configure and verify the relationship with:

```sh
npm trust github t3code-alpha \
  --file release-alpha.yml \
  --repo TheBlankClub/t3code-alpha \
  --allow-publish
npm trust list t3code-alpha
```

After the first automated Alpha release moves `latest` to the real release, remove the temporary
reservation tag:

```sh
npm dist-tag rm t3code-alpha bootstrap
```

`latest` is deliberate here: `t3code-alpha` is already a separate package identity. Desktop update
metadata and GitHub releases continue to use the `alpha` channel.

## 2. Daily upstream sync GitHub App

Create a private GitHub App dedicated to the sync workflow, install it only on
`TheBlankClub/t3code-alpha`, and grant the minimum repository permissions required by the workflow:

- Contents: read and write
- Issues: read and write
- Pull requests: read and write
- Workflows: read and write

Add its credentials as repository Actions secrets:

- `ALPHA_AUTOMATION_APP_ID`
- `ALPHA_AUTOMATION_APP_PRIVATE_KEY`

`.github/workflows/sync-upstream.yml` uses the installation token to update
`automation/upstream-main`, open or update a PR into `alpha`, and report conflicts. The App token is
required so the automation-created PR receives normal CI without a long-lived personal token.

## 3. Release repository variables

Add these repository Actions variables:

- `APPLE_TEAM_ID`
- `T3CODE_CLERK_PUBLISHABLE_KEY`
- `T3CODE_CLERK_JWT_TEMPLATE`
- `T3CODE_CLERK_CLI_OAUTH_CLIENT_ID`
- `T3CODE_RELAY_URL`
- `T3CODE_CLERK_PASSKEY_RP_DOMAINS`

Use the fork's production T3 Connect configuration. The preflight treats every value as mandatory so
Alpha cannot silently ship a reduced cloud feature set.

## 4. Signing and notarization secrets

Add these repository Actions secrets for macOS:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_API_KEY`
- `APPLE_API_KEY_ID`
- `APPLE_API_ISSUER`
- `MACOS_PROVISIONING_PROFILE`

The Developer ID certificate, provisioning profile, notarization key, and `APPLE_TEAM_ID` must all
belong to the same Apple developer team. The provisioning profile must cover Alpha's bundle ID,
`com.theblankclub.t3code.alpha`.

Add these repository Actions secrets for Windows Trusted Signing:

- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TRUSTED_SIGNING_ENDPOINT`
- `AZURE_TRUSTED_SIGNING_ACCOUNT_NAME`
- `AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE_NAME`
- `AZURE_TRUSTED_SIGNING_PUBLISHER_NAME`

Both signing platforms are mandatory. Missing configuration stops the release before any npm or
GitHub publication.

## 5. Branch protection and CI

Protect `alpha` with pull requests and require the four jobs from `.github/workflows/ci.yml`:

- `Check`
- `Test`
- `Mobile Native Static Analysis`
- `Release Smoke`

Do not require linear history: upstream reconciliation intentionally retains merge commits. Keep the
default `GITHUB_TOKEN` permission read-only; individual workflows declare their narrower write
permissions.

Before merging an upstream reconciliation PR, confirm that its exact head contains the intended
upstream SHA, every active `.alpha/features/*.md` record is reconciled, and all four jobs pass.

## 6. First release proof

Run `Alpha Release` manually once before relying on its daily schedule. On the exact released SHA:

1. Confirm all preflight, platform build, npm publish, and GitHub release jobs pass.
2. Confirm `npm view t3code-alpha@<version> version description license repository bin` matches the
   release and `npm view t3code-alpha dist-tags` points `latest` at it.
3. Install with `npx t3code-alpha@latest` and confirm the reported CLI version matches the package.
4. Install each desktop target and confirm its Alpha identity, protocol, and state remain isolated
   from official T3 Code.
5. From the previous Alpha desktop release, verify update discovery, download, restart/install, and
   connection to the exact matching `t3code-alpha@<version>` server.
6. Confirm the GitHub release is a prerelease and is not marked as the repository's latest release.

Only after this proof should the temporary npm `bootstrap` tag be removed and the scheduled release
be treated as operational.
