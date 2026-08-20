---
id: restore-reverted-message-to-composer
status: active
risk: amber
introduced_by: a47276a40
last_reconciled_with: beab6886f45bf42906d0bd01aefe5dfe9e66a867
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
