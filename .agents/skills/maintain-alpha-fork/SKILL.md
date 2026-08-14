---
name: maintain-alpha-fork
description: Maintain the T3 Code Alpha integration branch against official upstream main while preserving intentional fork behavior and retiring deltas that upstream supersedes. Use when inspecting upstream divergence, performing a daily sync, resolving merge or semantic conflicts, reconciling fork features, deciding whether an Alpha-only patch is still needed, preparing an Alpha release candidate, or auditing the fork's update readiness.
---

# Maintain Alpha Fork

Treat `alpha` as an upstream-first integration branch, not a permanent patch stack. Preserve the
behavioral intent of active Alpha features while adopting upstream structure, naming, and
implementations whenever possible.

Read [references/fork-policy.md](references/fork-policy.md) before reconciling code. Read
[references/release-gates.md](references/release-gates.md) before changing identity, updater,
packaging, versions, or release automation.

## Inspect before changing anything

1. Read the repository `AGENTS.md` and preserve unrelated worktree changes.
2. Run `scripts/inspect-upstream.sh --fetch` from the repository root.
3. Confirm that `origin` is the Alpha fork and `upstream` is the official T3 Code repository.
4. Confirm the integration branch and its remote tracking branch. Do not assume the default branch.
5. Read every active record under `.alpha/features/` that overlaps incoming paths or behavior.
6. Compare incoming commits and the full `alpha...upstream/main` diff. Git conflicts are only one
   overlap signal; also inspect moved code, renamed concepts, tests, contracts, migrations, and UI
   entry points.

If fork commits exist without corresponding feature records, stop and inventory them before
reconciling. Use the template in [references/fork-policy.md](references/fork-policy.md).

## Classify incoming work

Classify each active Alpha feature against current upstream:

- `unaffected`: upstream does not touch the feature's behavior.
- `mechanical-conflict`: behavior remains compatible; adapt the Alpha delta to upstream structure.
- `upstream-equivalent`: upstream now satisfies every recorded invariant; remove the Alpha delta.
- `partially-upstreamed`: keep only the smallest missing behavior.
- `upstream-redesign`: accept upstream's model and re-express only still-required invariants.
- `obsolete`: the feature is no longer useful or reachable; remove it.
- `ambiguous`: evidence is insufficient; do not merge or release automatically.
- `persistence-sensitive`: events, projections, database state, auth, secrets, updater identity, or
  compatibility are involved; require the stronger gates in the policy reference.

Prefer upstream code when implementations compete. Preserve Alpha behavior, not Alpha syntax,
file layout, or historical implementation choices.

## Reconcile on an integration branch

1. Start from the current `alpha` head on a temporary `sync/upstream-<date>` branch or isolated
   worktree. Never force-push the shared `alpha` branch.
2. Merge `upstream/main`; preserve the upstream ancestry instead of rebasing the long-lived branch.
3. Resolve conflicts file by file. Never apply repository-wide `ours` or `theirs` resolution.
4. For each overlapping feature, first restore upstream's current design, then add the smallest code
   required for any invariant upstream still lacks.
5. Delete redundant Alpha code when upstream is equivalent. Update its feature record to `retired`
   with the upstream commit and evidence that replaced it.
6. Add or update feature records for every intentional fork delta. Record affected surfaces,
   focused tests, risk, retirement conditions, and upstream links.
7. Append one JSON object to `.alpha/reconciliation.jsonl` only after the candidate commit exists.
   Include the old Alpha SHA, upstream SHA, candidate SHA, classifications, validation, and outcome.

Fast-forward `alpha` only when it has no Alpha-only commits. Once the branch contains intentional
fork work, retain merge ancestry so upstream provenance and released SHAs remain auditable.

## Verify the candidate

1. Review the final diff against both previous `alpha` and `upstream/main`.
2. Run focused tests for incoming conflicts and every retained Alpha invariant.
3. Run targeted lint, formatting, and typechecks for changed packages. Do not run repository-wide
   checks unless the user requests them.
4. Check every applicable client, provider, contract, reverse state, connection mode, and doc
   surface listed in `AGENTS.md`.
5. For persistence-sensitive work, test migrations and replay against disposable snapshots only.
   Never start or mutate a server against shared `~/.t3/userdata`.
6. Do not push, open a PR, merge into `alpha`, tag, or release unless the user or automation request
   explicitly authorizes that action.

Leave the candidate unmerged when tests fail, behavior is ambiguous, a feature record is missing,
or signing/updater/release invariants cannot be verified.

## Prepare a release candidate

Treat synchronization and release as separate outcomes. A clean merge is not release approval.

Before releasing, follow [references/release-gates.md](references/release-gates.md). In particular,
verify that the Alpha build has its own update feed and coherent desktop/server version story.
Never publish the fork as the upstream `t3` npm package or reuse official release credentials.

## Report the result

State:

- old and new Alpha SHAs;
- upstream SHA and ahead/behind counts;
- incoming changes that overlapped Alpha features;
- features retained, rewritten, partially retired, or fully retired;
- tests and checks run, including unverified surfaces;
- whether the result is safe to merge, safe to release, or requires a human decision.
