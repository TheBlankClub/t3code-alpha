---
id: restore-reverted-message-to-composer
status: active
risk: amber
introduced_by: a47276a40
last_reconciled_with: 2f486ab80c748b4d8e3d3b17e49b5a327cb93335
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
