import { assert, describe, it } from "@effect/vitest";

import { createSafeSyncJournalEntry, reconcileFeatureRecord } from "./record-alpha-safe-sync.ts";

const upstreamSha = "1234567890abcdef1234567890abcdef12345678";

describe("recordAlphaSafeSync", () => {
  it("updates active feature records with an unaffected reconciliation note", () => {
    const result = reconcileFeatureRecord(
      `---\nid: alpha-feature\nstatus: active\nlast_reconciled_with: abc\n---\n\n# Reconciliation notes\n`,
      upstreamSha,
      "2026-08-15",
    );

    assert.include(result, `last_reconciled_with: ${upstreamSha}`);
    assert.include(result, `2026-08-15, upstream \`${upstreamSha}\`: \`unaffected\``);
  });

  it("does not change retired records", () => {
    const contents = `---\nid: old-feature\nstatus: retired\nlast_reconciled_with: abc\n---\n`;
    assert.strictEqual(reconcileFeatureRecord(contents, upstreamSha, "2026-08-15"), contents);
  });

  it("creates an auditable journal entry from the CI-tested candidate", () => {
    assert.deepStrictEqual(
      createSafeSyncJournalEntry({
        timestamp: "2026-08-15T00:00:00Z",
        previousAlpha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        upstream: upstreamSha,
        candidate: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        featureIds: ["zeta", "alpha"],
        validationUrl: "https://github.com/TheBlankClub/t3code-alpha/actions/runs/1",
      }),
      {
        timestamp: "2026-08-15T00:00:00Z",
        previousAlpha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        upstream: upstreamSha,
        candidate: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        features: { retained: ["alpha", "zeta"], rewritten: [], retired: [] },
        validation: [
          "required GitHub CI passed on the automated sync candidate: https://github.com/TheBlankClub/t3code-alpha/actions/runs/1",
          "incoming paths did not overlap the current Alpha delta or protected auto-sync surfaces",
        ],
        outcome: "ready-for-auto-merge",
      },
    );
  });
});
