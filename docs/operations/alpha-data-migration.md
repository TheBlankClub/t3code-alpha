# Migrate Nightly data to Alpha

Use the repository migration command to copy the durable local T3 Code Nightly state from `~/.t3`
into Alpha's isolated `~/.t3-alpha` home. The source is never modified, and an existing Alpha
`userdata` directory is moved to a timestamped backup before the migrated data is installed.

## Choose the identity policy

`switch` is the default and is appropriate when Alpha replaces Nightly. It carries the Nightly
environment ID, signing keys, and local authorization sessions forward so existing clients continue
to see the migrated server as the same environment. Do not run Nightly and Alpha concurrently after
using this mode: the two homes would contain the same logical environment identity and then diverge.

`clone` keeps Alpha independent. It retains Alpha's existing environment ID and signing keys, clears
the copied authorization sessions and pairing links, re-scopes local project-grouping preferences
to Alpha's environment ID, and copies the provider credentials needed by the migrated projects.
Pair remote clients with Alpha again after the migration.

## Run it

First inspect the plan without changing either home:

```bash
vp run migrate:nightly-to-alpha
```

Quit both desktop applications completely, then apply one mode:

```bash
# Alpha replaces Nightly
vp run migrate:nightly-to-alpha --apply --mode switch

# Nightly and Alpha remain independent
vp run migrate:nightly-to-alpha --apply --mode clone
```

The command refuses to apply while either desktop-managed server is still running. It snapshots the
source database through SQLite's backup API, runs all current Alpha migrations on the snapshot,
performs `PRAGMA quick_check`, and only then swaps the staged directory into place.

## What moves

- projects, threads, turns, messages, checkpoints, and event history;
- attachments and browser artifacts;
- server, client, desktop, and keybinding settings;
- provider configuration and provider environment secrets;
- environment and signing identity in `switch` mode only.

The Nightly update-channel preference is removed from the copied desktop settings so the installed
Alpha version selects its own `alpha` channel.

## What stays separate

The command intentionally excludes runtime descriptors, logs, usage caches, Clerk tokens, and the
encrypted saved-environment catalog. It also does not copy Electron's Chromium profile from
`~/Library/Application Support/t3code`. That directory contains origin-scoped Local Storage,
IndexedDB, preview browser cookies, partitions, and large disposable caches; copying it wholesale
would violate Alpha's `t3code-alpha://app` origin and profile isolation.

Core chat history and shared settings do not depend on that Chromium profile. Prompt drafts, custom
themes, transient UI layout state, preview-site logins, and saved remote connections may need to be
recreated in Alpha.

## Roll back

The success output prints the exact backup path, normally:

```text
~/.t3-alpha-backups/<UTC timestamp>/userdata
```

To roll back, quit Alpha, move the migrated `~/.t3-alpha/userdata` aside, and move that backup back
to `~/.t3-alpha/userdata`. The original `~/.t3` source remains untouched throughout.
