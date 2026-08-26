---
id: alpha-local-only-telemetry
status: active
risk: red
introduced_by: alpha-local-only-telemetry
last_reconciled_with: 860caaa6023a3aaf616a5899816c74c195ca8de2
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

- 2026-08-23, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: added the Alpha-only
  local telemetry invariant after auditing PostHog and Axiom/OTLP tracking paths.
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `mechanical-overlap`;
  adopted upstream's Codex feedback and provider lifecycle changes without adding product analytics
  or remote trace export. Every Alpha outbound-telemetry guard remains in place.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `unaffected`; incoming
  provider discovery, attachments, pull requests, and client changes do not alter the Alpha
  PostHog, OTLP, Axiom, or relay telemetry guards.
