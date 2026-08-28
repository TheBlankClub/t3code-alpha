---
id: codex-service-tier-labels
status: active
risk: green
introduced_by: ca4c713e01b8216d57f3ff5b0612f17d41baeb65
last_reconciled_with: 0e2905eb783fd2385f358a95f0b25bbf07ff7122
upstream_issue: null
upstream_pr: pingdotgg/t3code#4503
surfaces:
  - web
tests:
  - vp test run apps/web/src/components/chat/TraitsPicker.test.ts
---

# Intent

Keep Codex service-tier controls readable without losing the compact fast-mode treatment for the
Standard and Fast tiers.

# Behavioral invariants

- Standard and Fast render as the compact fast-mode state when another trait supplies the label.
- A sole Standard or Fast service-tier control keeps a readable text label.
- Other service tiers, including Flex, remain visible in the trait label.
- Boolean fast mode and prompt-controlled ultrathink behavior remain unchanged.

# Current delta

- The web traits picker treats only Codex Standard and Fast as fast-mode states and keeps every
  other service tier in the visible label.
- The focused picker tests cover combined, sole-trait, non-fast-tier, boolean, and ultrathink cases.

# Retirement conditions

- Retire after upstream provides equivalent Codex service-tier labels and focused coverage for sole
  and non-fast service tiers.

# Reconciliation notes

- 2026-08-23, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: added the focused Alpha
  carry from `pingdotgg/t3code#4503` while that behavior remained absent upstream.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `unaffected`; incoming
  composer, provider, and model changes do not replace the Codex service-tier label behavior or its
  focused coverage.
- 2026-08-27, upstream `ead4ce52a1624d9c55461f61524580978fc8b719`: `unaffected`; Codex 0.150
  multi-agent event support does not change the web service-tier labels or their focused coverage.
- 2026-08-29, upstream `0e2905eb783fd2385f358a95f0b25bbf07ff7122`: `unaffected`; incoming Codex
  account-plan and sub-agent model metadata changes do not alter service-tier labels or fast-mode
  behavior.
