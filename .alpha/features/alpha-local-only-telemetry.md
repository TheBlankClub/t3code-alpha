---
id: alpha-local-only-telemetry
status: active
risk: red
introduced_by: alpha-local-only-telemetry
last_reconciled_with: 2fa5ef4c7bf3aafabe98392d25be7eb86847ce8f
upstream_issue: null
upstream_pr: null
surfaces:
  - server
  - desktop
  - web
  - mobile
  - relay
tests:
  - vp test run apps/server/src/telemetry/AnalyticsService.test.ts apps/server/src/cli/config.test.ts apps/server/src/server.test.ts
  - vp test run packages/shared/src/relayTracing.test.ts infra/relay/src/observability.test.ts apps/desktop/src/app/DesktopObservability.test.ts apps/mobile/src/features/observability/tracing.test.ts
---

# Intent

Keep T3 Code Alpha private by default and prevent the distribution from sending product analytics,
traces, or metrics to third-party telemetry services.

# Behavioral invariants

- Alpha never sends PostHog analytics.
- Alpha ignores configured OTLP trace and metric endpoints.
- Alpha relay clients and the Alpha relay Worker do not export traces to Axiom.
- Local logs, local trace files, browser trace collection, and resource diagnostics remain available.
- Environment variables, persisted settings, build-time public configuration, and ingest tokens
  cannot enable outbound telemetry while the Alpha policy is disabled.

# Current delta

- `packages/shared/src/alphaDistribution.ts` owns the outbound telemetry policy.
- PostHog identity creation and batching stop before reading provider account identifiers.
- Server, desktop, relay-client, and relay-worker egress points enforce the policy independently.
- Server configuration reports remote OTLP export as disabled even when an endpoint was persisted.

# Retirement conditions

- Retire only if Alpha intentionally adopts outbound telemetry with explicit user consent and an
  accurate public privacy disclosure.

# Reconciliation notes

- 2026-09-05, upstream `2fa5ef4c7bf3aafabe98392d25be7eb86847ce8f`: `mechanical-conflict`;
  adopted upstream server and configuration test changes while retaining disabled outbound
  analytics, trace, and metric export across Alpha surfaces.

- 2026-08-23, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: added the Alpha-only
  local telemetry invariant after auditing PostHog and Axiom/OTLP tracking paths.
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `mechanical-overlap`;
  adopted upstream's Codex feedback and provider lifecycle changes without adding product analytics
  or remote trace export. Every Alpha outbound-telemetry guard remains in place.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `unaffected`; incoming
  provider discovery, attachments, pull requests, and client changes do not alter the Alpha
  PostHog, OTLP, Axiom, or relay telemetry guards.
- 2026-08-27, upstream `ead4ce52a1624d9c55461f61524580978fc8b719`: `unaffected`; Grok usage
  reads provider-local transcripts and does not add product analytics, OTLP export, Axiom export,
  or relay telemetry. Every Alpha outbound-telemetry guard remains in place.
- 2026-08-29, upstream `0e2905eb783fd2385f358a95f0b25bbf07ff7122`: `mechanical-overlap`;
  adopted upstream's connected-client and server-platform analytics properties behind Alpha's
  disabled analytics layer. PostHog, OTLP, Axiom, and relay egress guards remain active.
- 2026-08-28, upstream `22c311ddecfbab2e541a374a46f2df87d4fc6305`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-29, upstream `053affbed2659f90cd1b1efaaa7a75865c4131c7`: `mechanical-overlap`;
  adopted upstream's environment-theme server tests and Expo 57 client changes without enabling
  PostHog, OTLP, Axiom, or relay telemetry egress.
- 2026-08-30, upstream `c0e09f323ac9f6bf4b9119cbad841db3379588d6`: `unaffected`; incoming
  markdown, preview, composer, pull-request, and title-retry changes add no product analytics,
  OTLP, Axiom, or relay telemetry egress.
- 2026-08-30, upstream `2daff8c25adf701fddd062ae93b94cc57d420ec2`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-31, upstream `352710d497cc640553e3e18e23fb5a5f3f890466`: `mechanical-overlap`;
  adopted upstream's video asset HTTP changes without changing the guarded OTLP export path.
  PostHog, OTLP, Axiom, and relay telemetry egress remain disabled.
- 2026-09-02, upstream `2d156a83b96ebf2e4a9c6017251baad357ae6ab1`: `mechanical-overlap`;
  adopted upstream's resource diagnostics and server HTTP performance changes while retaining the
  disabled PostHog, OTLP, Axiom, and relay telemetry egress guards.
- 2026-09-02, upstream `60cef47ec983637ddc68faed7b1488b6f3c3a175`: `unaffected`; incoming
  preview, provider-model, chat, settings, mobile, and package changes add no PostHog, OTLP,
  Axiom, or relay telemetry egress.
- 2026-09-02, upstream `70cd258d8aac43ea57494527b00bf36de3efa6c0`: `mechanical-overlap`;
  adopted upstream's desktop telemetry control channel and observability cleanup while retaining
  the independent PostHog, OTLP, Axiom, and relay egress guards.
- 2026-09-03, upstream `5b8445b7a777ab1070aa97b062b1618971073a96`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-09-04, upstream `caab2fdbac041ac2e851ad4fa3ac4a40a1d4a8f6`: `unaffected`;
  incoming provider, usage-limit, desktop, and client changes do not enable PostHog, OTLP, Axiom,
  or other T3 telemetry egress.
- 2026-09-04, upstream `c3b8825bf476cbce5e061c0f99570cf1f6723b89`: `unaffected`;
  incoming usage settings, provider prompts, task-state, and tool-rendering changes do not enable
  PostHog, OTLP, Axiom, or other T3 telemetry egress.
