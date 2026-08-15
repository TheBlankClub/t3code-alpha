# Alpha fork policy

## Branch model

- `upstream/main` is the canonical product baseline.
- `alpha` is the release integration branch owned by TheBlankClub.
- Feature branches contain one Alpha concern and merge into `alpha`.
- Upstream reconciliation runs every six hours on one automation branch and merges into `alpha`
  only after policy classification, an evidence-backed journal entry, and required CI.
- Automatic reconciliation is limited to incoming paths that neither overlap the current Alpha
  delta nor match protected identity, persistence, contract, packaging, updater, SSH, or release
  surfaces. Every other candidate remains review-only.
- Do not rebase or force-push released `alpha` history. Merge ancestry makes provenance and release
  tags auditable.

The desired state is the smallest understandable delta from upstream that still satisfies every
active Alpha invariant.

## Feature records

Create one Markdown file per intentional fork feature under `.alpha/features/<id>.md`. A feature is
a behavior or product invariant, not a commit. Keep the file when its implementation moves.

Use this structure:

```markdown
---
id: concise-kebab-case-id
status: active
risk: green
introduced_by: <commit>
last_reconciled_with: <upstream commit>
upstream_issue: null
upstream_pr: null
surfaces:
  - web
tests:
  - path/to/focused.test.ts
---

# Intent

Why Alpha needs this behavior.

# Behavioral invariants

- Observable behavior that must remain true.

# Current delta

- The smallest current code difference from upstream and why it exists.

# Retirement conditions

- Evidence that would allow the Alpha delta to be removed.

# Reconciliation notes

- YYYY-MM-DD, upstream SHA: classification, decision, and evidence.
```

Allowed status values are `active`, `partial`, and `retired`. Allowed risk values are:

- `green`: local UI or implementation behavior with focused coverage and no persistence impact.
- `amber`: contracts, providers, multi-surface behavior, remote operation, or meaningful rewrites.
- `red`: persisted events/projections, database migrations, auth/secrets, updater identity, signing,
  release publication, or downgrade compatibility.

Retired records stay in the ledger. Change `status` to `retired`, state the replacing upstream SHA,
and remove the fork code. This prevents a later agent from reintroducing obsolete behavior.

## Reconciliation journal

Append one compact JSON object per completed reconciliation to `.alpha/reconciliation.jsonl`:

```json
{
  "timestamp": "2026-08-15T00:00:00Z",
  "previousAlpha": "<sha>",
  "upstream": "<sha>",
  "candidate": "<sha>",
  "features": { "retained": [], "rewritten": [], "retired": [] },
  "validation": ["vp test run path/to/test.ts"],
  "outcome": "ready-for-review"
}
```

Do not append speculative entries. Record the actual candidate SHA and actual checks after they
exist. Keep the journal append-only; correct mistakes with a later entry.

## Conflict rules

1. Read the incoming commit and tests to understand upstream intent.
2. Read the relevant feature record to understand Alpha intent.
3. Use upstream data flow, APIs, types, naming, and component boundaries as the baseline.
4. Reapply only missing Alpha invariants.
5. Add coverage that proves both upstream behavior and the retained Alpha behavior.
6. Mark `ambiguous` instead of guessing when the two intents are incompatible or undocumented.

Never preserve an Alpha implementation merely because it arrived first. Never delete Alpha behavior
merely because a merge completed without textual conflicts.

## Persistence and compatibility

For event schemas, projections, SQLite migrations, credentials, update identity, or protocol routing:

- use disposable historical snapshots;
- verify migration, replay, and idempotence;
- retain compatibility readers when released state requires them;
- verify backup and recovery behavior;
- state the downgrade policy;
- require human approval before merging or releasing.
