---
id: remember-thread-scroll-position
status: partial
risk: green
introduced_by: 31e67d13ce42c0989a4698f9140c3bea4aba9731
last_reconciled_with: d7819c18813fa03b033cc1c9472c9acc0ffc0618
upstream_issue: null
upstream_pr: null
surfaces:
  - web
tests:
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

- Upstream's bounded session cache owns positions and disclosure state.
- Alpha records the former last row to show New messages when a thread reopens below new content.
- Missing saved rows return to the live edge.
- Live-follow records the live edge even while streaming growth briefly extends beyond the viewport.

# Retirement conditions

- Retire when upstream restores per-thread reading positions across thread switches with the same
  live-follow, new-content, and missing-row behavior.

# Reconciliation notes

- 2026-09-21, upstream `1de563c1491c7d82563e4553bf5bf689ce6adbb9`: `unaffected`. Adopted upstream resting-composer scroll changes. Retained New messages, missing-row fallback, and live-follow safeguards.

- 2026-09-20, upstream `c14f6015bfe479d313355cb234af1a5c16dbb15f`: `unaffected`. The header changes leave timeline scroll ownership and saved reading positions unchanged.

- 2026-09-20, upstream `7445aa733ada33e45289e5aa5055f79142556513`: `unaffected`. The ChatView question-answer change preserves reading positions, New messages, missing-row fallback, and live-follow safeguards.

- 2026-09-19, upstream `dfbb11bdd7c3f1a5575cb55d3e3abb12be025727`: `partially-upstreamed`. Adopted the upstream scroll and thought-preview changes. Retained New messages, missing-row fallback, and live-follow safeguards.

- 2026-09-18, upstream `03950089ffa5cecf0ce731227f58551f6437495f`: `partially-upstreamed`. Upstream f17165a76 now owns the bounded position cache, disclosure state, and measured restoration. Removed the duplicate Alpha cache and restore loop. Retained the New messages indication, missing-row fallback to the live edge, and protection against false positions during live-follow.

- 2026-09-15, upstream `5623089aea68ca62811f51321686c259fa4c810f`: `unaffected`. Upstream per-thread panel widths and timeline setup rows preserve reading-position restoration and live-follow behavior.

- 2026-09-14, upstream `1bbca0e78202c8ece73351fccd29f3c99070b82e`: `unaffected`.
  Streaming-mode selection preserves remembered reading positions and the live-follow guard.

- 2026-09-14, upstream `3b75e607eb909522a8f5562fb40e44efc72bb66c`: `mechanical-conflict`.
  Adopted smooth streaming scroll and thread-switch settling. Remembered reading positions still disable live-follow.

- 2026-09-13, upstream `20363c32c9bfdbf49c2716ef11d1f18483fcc01b`: `mechanical-conflict`.
  Retained reading-position restoration and live-follow guards alongside upstream work rows and accessibility headings.

- 2026-09-12, upstream `e816064945144957b6eb9b268912a98b0555644b`: `unaffected`. Upstream now keeps
  sidebar scroll stable while pinning threads; timeline reading-position memory stays separate.

- 2026-09-12, upstream `efccda9ac9230db22b36990cffabdad218fa41b0`: `upstream-redesign`.
  Reworked the feature around upstream's held timeline paint and stable LegendList instance so the
  new performance path stays mounted while each displayed thread restores its own reading position.
- 2026-09-13, upstream `dd6ba84dc96f83000388e14b90f6533d5f63315d`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-13, upstream `df7ccc8fd01f5d2a1d8ec21bef8f9c59398fe913`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-20, upstream `0ff87f251dafb32703d5f531e7b248ad0a581ee2`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-22, upstream `d7819c18813fa03b033cc1c9472c9acc0ffc0618`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
