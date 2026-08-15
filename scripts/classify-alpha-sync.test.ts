import { assert, describe, it } from "@effect/vitest";

import {
  classifyAlphaSync,
  renderAlphaSyncClassification,
  type AlphaSyncPolicy,
} from "./classify-alpha-sync.ts";

const policy: AlphaSyncPolicy = {
  schemaVersion: 1,
  reviewRequiredPatterns: [
    { pattern: ".github/workflows/**", reason: "workflow automation" },
    { pattern: "packages/contracts/**", reason: "wire contracts" },
  ],
};

describe("classifyAlphaSync", () => {
  it("allows an unrelated upstream-only change", () => {
    assert.deepStrictEqual(
      classifyAlphaSync(
        ["apps/desktop/src/updates/DesktopUpdates.ts"],
        ["apps/web/src/components/Sidebar.tsx"],
        policy,
      ),
      { safe: true, overlappingPaths: [], reviewPaths: [] },
    );
  });

  it("requires review when upstream changes an Alpha delta path", () => {
    const result = classifyAlphaSync(
      ["apps/web/src/components/Sidebar.tsx"],
      ["apps/web/src/components/Sidebar.tsx"],
      policy,
    );

    assert.isFalse(result.safe);
    assert.deepStrictEqual(result.overlappingPaths, ["apps/web/src/components/Sidebar.tsx"]);
    assert.deepStrictEqual(result.reviewPaths, [
      {
        path: "apps/web/src/components/Sidebar.tsx",
        reasons: ["overlaps the current Alpha delta"],
      },
    ]);
  });

  it("requires review for protected behavior without an exact overlap", () => {
    const result = classifyAlphaSync(
      ["apps/web/src/branding.logic.ts"],
      ["packages/contracts/src/settings.ts", ".github/workflows/ci.yml"],
      policy,
    );

    assert.isFalse(result.safe);
    assert.deepStrictEqual(result.reviewPaths, [
      { path: ".github/workflows/ci.yml", reasons: ["workflow automation"] },
      { path: "packages/contracts/src/settings.ts", reasons: ["wire contracts"] },
    ]);
    assert.include(renderAlphaSyncClassification(result), "human reconciliation required");
  });
});
