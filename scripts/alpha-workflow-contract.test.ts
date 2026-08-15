// @effect-diagnostics nodeBuiltinImport:off - Workflow contract tests read repository fixtures directly.
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { parse } from "yaml";

const repoRoot = NodePath.resolve(import.meta.dirname, "..");

function readWorkflow(name: string): Record<string, unknown> {
  return parse(
    NodeFS.readFileSync(NodePath.join(repoRoot, ".github", "workflows", name), "utf8"),
  ) as Record<string, unknown>;
}

function serializedWorkflow(name: string): string {
  return JSON.stringify(readWorkflow(name));
}

describe("Alpha workflow contracts", () => {
  it("checks upstream every six hours and keeps unsafe candidates review-only", () => {
    const workflow = readWorkflow("sync-upstream.yml") as {
      readonly on: { readonly schedule: ReadonlyArray<{ readonly cron: string }> };
    };
    const serialized = JSON.stringify(workflow);

    assert.deepStrictEqual(workflow.on.schedule, [{ cron: "37 2,8,14,20 * * *" }]);
    assert.include(serialized, "classify-alpha-sync.ts");
    assert.include(serialized, "alpha-review-required");
    assert.notInclude(serialized, "gh pr merge");
  });

  it("journals a tested safe candidate before enabling its merge", () => {
    const serialized = serializedWorkflow("finalize-upstream-sync.yml");

    assert.include(serialized, "record-alpha-safe-sync.ts journal");
    assert.include(serialized, "github.event.workflow_run.conclusion == 'success'");
    assert.include(serialized, "--match-head-commit");
    assert.include(serialized, "--auto");
  });

  it("releases only a current, successful, and previously untagged Alpha CI head", () => {
    const workflow = readWorkflow("release-alpha.yml") as {
      readonly on: {
        readonly schedule: ReadonlyArray<{ readonly cron: string }>;
        readonly workflow_run: {
          readonly workflows: ReadonlyArray<string>;
          readonly types: ReadonlyArray<string>;
          readonly branches: ReadonlyArray<string>;
        };
      };
    };
    const serialized = JSON.stringify(workflow);

    assert.deepStrictEqual(workflow.on.schedule, [{ cron: "47 3 * * *" }]);
    assert.deepStrictEqual(workflow.on.workflow_run, {
      workflows: ["CI"],
      types: ["completed"],
      branches: ["alpha"],
    });
    assert.include(serialized, "WORKFLOW_EVENT");
    assert.include(serialized, "WORKFLOW_CONCLUSION");
    assert.include(serialized, "WORKFLOW_HEAD_SHA");
    assert.include(serialized, "git tag --points-at");
    assert.include(serialized, "Publish Homebrew cask");
    assert.include(serialized, "Alpha release is blocked");
  });
});
