---
id: codex-service-tier-labels
status: active
risk: green
introduced_by: ca4c713e01b8216d57f3ff5b0612f17d41baeb65
last_reconciled_with: e5a87e8b9ca9db21e0291ddbd54438c5fe56b277
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

- 2026-09-05, upstream `e5a87e8b9ca9db21e0291ddbd54438c5fe56b277`: `unaffected`; pull request
  filter deduplication does not alter Codex service-tier labels.

- 2026-09-05, upstream `2fa5ef4c7bf3aafabe98392d25be7eb86847ce8f`: `unaffected`; incoming web
  file editing, prompt history, focus, pull request, and composer changes do not alter Codex service
  tier labels.

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
- 2026-08-28, upstream `22c311ddecfbab2e541a374a46f2df87d4fc6305`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-29, upstream `053affbed2659f90cd1b1efaaa7a75865c4131c7`: `unaffected`; incoming
  Codex buffering, composer attachment, and settings changes do not alter service-tier labels or
  fast-mode behavior.
- 2026-08-30, upstream `c0e09f323ac9f6bf4b9119cbad841db3379588d6`: `unaffected`; incoming
  markdown, preview, composer spacing, pull-request, and title-retry changes do not alter Codex
  service-tier labels or fast-mode behavior.
- 2026-08-30, upstream `2daff8c25adf701fddd062ae93b94cc57d420ec2`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-31, upstream `352710d497cc640553e3e18e23fb5a5f3f890466`: `unaffected`; incoming
  Codex citation, artifact-template, chat, and attachment changes do not alter service-tier labels
  or fast-mode behavior.
- 2026-09-02, upstream `2d156a83b96ebf2e4a9c6017251baad357ae6ab1`: `unaffected`; incoming chat,
  provider, settings, and command-menu changes do not alter Codex service-tier labels or fast-mode
  behavior.
- 2026-09-02, upstream `60cef47ec983637ddc68faed7b1488b6f3c3a175`: `unaffected`; incoming Claude
  model discovery, chat activity, settings, and provider changes do not alter Codex service-tier
  labels or fast-mode behavior.
- 2026-09-02, upstream `70cd258d8aac43ea57494527b00bf36de3efa6c0`: `unaffected`; incoming model,
  composer, provider, and settings changes do not alter Codex service-tier labels or fast-mode
  behavior.
- 2026-09-03, upstream `5b8445b7a777ab1070aa97b062b1618971073a96`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-04, upstream `caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6`: `unaffected`; incoming
  composer, model-picker, and Codex changes do not replace the fork's readable service-tier labels.
- 2026-09-04, upstream `c3b8825bf476cbce5e061c0f99570cf1f6723b89`: `unaffected`; incoming
  provider runtime instructions do not replace the fork's readable Codex service-tier labels.
