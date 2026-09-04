---
id: restore-reverted-message-to-composer
status: active
risk: amber
introduced_by: a47276a40
last_reconciled_with: caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6
upstream_issue: pingdotgg/t3code#5685
upstream_pr: pingdotgg/t3code#6044
surfaces:
  - web
  - client-runtime
tests:
  - apps/web/src/components/ChatView.logic.test.ts
  - packages/client-runtime/src/state/threadReducer.test.ts
---

# Intent

Let users edit and resend a reverted prompt instead of recreating its text and image attachments.

# Behavioral invariants

- Reverting to a user message restores its editable text and available image attachments to the
  composer.
- An existing composer draft is stashed before the reverted message replaces it.
- Sent-only context blocks and preview-annotation screenshots are not restored as editable content.
- The live timeline removes the reverted user message after the server confirms the rewind.
- Attachment failures and limits remain soft failures and never block the checkpoint revert.

# Current delta

- The implementation is carried from `pingdotgg/t3code#6044` without behavioral changes while that
  pull request remains open upstream.

# Retirement conditions

- Retire after the upstream pull request merges and an Alpha reconciliation proves the upstream
  implementation and focused coverage satisfy every invariant above.

# Reconciliation notes

- 2026-08-16, upstream `2f486ab80c748b4d8e3d3b17e49b5a327cb93335`: added the current upstream
  PR implementation as a temporary Alpha carry patch; no existing Alpha feature overlaps its
  composer or thread-reducer behavior.
- 2026-08-17, upstream `a4cc1367b03ee0c1dc2b50fceac81ef5e63212e2`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-18, upstream `cebac353defde6211c9e8c3d8ecd140c92042930`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-20, upstream `f708f63fa9bcd7e51f1f62531f6f9ed966b71807`: `mechanical-overlap`;
  adopted upstream's composer drawers, workspace navigation, and activity presentation while
  retaining reverted prompt and attachment restoration with its existing focused coverage.
- 2026-08-20, upstream `beab6886f45bf42906d0bd01aefe5dfe9e66a867`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-22, upstream `b381fdb12cb7cb241e2b8aca84941375f3fb43f4`: `mechanical-conflict`; upstream
  added draft-hero submission resolvers to the same insertion point in `ChatView.logic.ts`. Both
  sides were additive, so the Alpha reverted-message helpers were kept alongside upstream's new
  functions with no behavioral change. Focused coverage still passes.
- 2026-08-22, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `mechanical-conflict`;
  combined Alpha's revert-restoration send lock with upstream's feedback-upload lock and disabled
  reason. Reverted prompts and attachments still restore only after the checkpoint rewind settles.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `mechanical-conflict`;
  adopted upstream's explicit thread settlement, provider compaction, durable attachment uploads,
  and composer changes while retaining draft stashing and reverted prompt and attachment restoration
  after the checkpoint rewind settles.
- 2026-08-27, upstream `ead4ce52a1624d9c55461f61524580978fc8b719`: `unaffected`; incoming Grok,
  Codex event, usage, package, and preview changes do not touch composer draft stashing or reverted
  prompt and attachment restoration.
- 2026-08-29, upstream `0e2905eb783fd2385f358a95f0b25bbf07ff7122`: `mechanical-conflict`;
  adopted upstream's general file attachments and project-default model drafts while narrowing
  revert restoration to image attachments. Prompt stashing, image restoration, send locking, and
  soft failure behavior remain unchanged.
- 2026-08-28, upstream `22c311ddecfbab2e541a374a46f2df87d4fc6305`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-29, upstream `053affbed2659f90cd1b1efaaa7a75865c4131c7`: `mechanical-conflict`;
  adopted upstream's general file attachments, persistent draft files, and updated stash behavior
  while retaining reverted prompt stashing, image-only restoration, send locking, and soft failure.
- 2026-08-30, upstream `c0e09f323ac9f6bf4b9119cbad841db3379588d6`: `mechanical-conflict`;
  adopted upstream's composer shoulder-tab measurement and spacing changes alongside Alpha's
  reverted prompt stashing, image-only restoration, send locking, and soft failure behavior.
- 2026-08-30, upstream `2daff8c25adf701fddd062ae93b94cc57d420ec2`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-31, upstream `352710d497cc640553e3e18e23fb5a5f3f890466`: `mechanical-conflict`;
  adopted upstream's artifact-template insertion and video attachment preview flow while retaining
  reverted prompt stashing, image-only restoration, send locking, cleanup, and soft failures.
- 2026-09-02, upstream `2d156a83b96ebf2e4a9c6017251baad357ae6ab1`: `upstream-redesign`;
  adopted upstream's composer surface, banner, update-status, and activity presentation redesign,
  removed its obsolete shoulder-layout helper, and retained reverted prompt and image restoration.
- 2026-09-02, upstream `60cef47ec983637ddc68faed7b1488b6f3c3a175`: `mechanical-overlap`;
  adopted upstream's project-switch draft and pull-request refresh fixes while retaining reverted
  prompt stashing, image restoration, send locking, cleanup, and soft failure behavior.
- 2026-09-02, upstream `70cd258d8aac43ea57494527b00bf36de3efa6c0`: `mechanical-conflict`;
  adopted upstream's worktree-setup draft preservation and composer changes while retaining
  reverted prompt stashing, image restoration, send locking, cleanup, and soft failure behavior.
- 2026-09-03, upstream `1aa44a071f66bdfd9430356ab824b5a6985fb459`: `mechanical-conflict`;
  kept the reverted-message helpers and cross-thread draft release beside upstream's new
  browser-close confirmation and proactive-panel helpers, and dropped only the video-preview
  request tracking that upstream's unified media previews removed.
- 2026-09-03, upstream `5b8445b7a777ab1070aa97b062b1618971073a96`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-04, upstream `caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6`: `mechanical-conflict`;
  composed reverted-message restoration and draft stashing with upstream context compaction,
  paste-to-focus, composer selection holding, and menu-state changes.
