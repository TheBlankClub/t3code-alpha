---
id: remember-thread-scroll-position
status: active
risk: green
introduced_by: 31e67d13ce42c0989a4698f9140c3bea4aba9731
last_reconciled_with: efccda9ac9230db22b36990cffabdad218fa41b0
upstream_issue: null
upstream_pr: null
surfaces:
  - web
tests:
  - apps/web/src/components/chat/timelineScrollMemory.test.ts
  - apps/web/src/components/chat/MessagesTimeline.test.tsx
---

# Intent

Return users to the place where they stopped reading when they switch away from a thread and back.

# Behavioral invariants

- A thread left away from the live edge reopens at the same row and offset during the session.
- A thread left at the live edge reopens at the live edge.
- Streaming growth while live-follow is active never creates a false remembered position.
- Reopening below new rows shows the New messages action immediately.
- Missing remembered rows fall back to the live edge.

# Current delta

- A session-scoped map stores the top row, offset, and former last row for each thread.
- The persistent upstream timeline list repositions when its displayed thread identity changes.
- ChatView keeps live-follow disabled after a remembered position is restored.

# Retirement conditions

- Retire when upstream restores per-thread reading positions across thread switches with the same
  live-follow, new-content, and missing-row behavior.

# Reconciliation notes

- 2026-09-12, upstream `efccda9ac9230db22b36990cffabdad218fa41b0`: `upstream-redesign`.
  Reworked the feature around upstream's held timeline paint and stable LegendList instance so the
  new performance path stays mounted while each displayed thread restores its own reading position.
