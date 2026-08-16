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

function rawWorkflow(name: string): string {
  return NodeFS.readFileSync(NodePath.join(repoRoot, ".github", "workflows", name), "utf8");
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
    assert.include(serialized, 'repositories":"t3code-alpha');
    assert.notInclude(serialized, "homebrew-tap");
    assert.include(serialized, "Alpha release is blocked");
  });

  it("signs macOS releases with the persistent Alpha identity", () => {
    const parsedWorkflow = readWorkflow("release-alpha.yml") as {
      readonly jobs: {
        readonly build: {
          readonly steps: ReadonlyArray<{
            readonly name?: string;
            readonly "timeout-minutes"?: number;
            readonly run?: string;
          }>;
        };
      };
    };
    const workflow = rawWorkflow("release-alpha.yml");
    const signingStep = parsedWorkflow.jobs.build.steps.find(
      (step) => step.name === "Install persistent Alpha macOS signing identity",
    );

    assert.isDefined(signingStep);
    assert.strictEqual(signingStep["timeout-minutes"], 5);
    assert.notInclude(signingStep.run, "security add-trusted-cert");
    assert.include(signingStep.run, "security find-certificate");
    assert.include(signingStep.run, "t3code-alpha-signing-probe");
    assert.include(signingStep.run, "codesign --force");
    assert.include(signingStep.run, '--test-requirement "$probe_requirement"');

    assert.include(workflow, "ALPHA_MAC_SIGNING_P12_BASE64");
    assert.include(workflow, "ALPHA_MAC_SIGNING_P12_PASSWORD");
    assert.notInclude(workflow, "security add-trusted-cert");
    assert.include(workflow, "security create-keychain");
    assert.include(workflow, "security import");
    assert.include(workflow, "--mac-signing-identity");
    assert.include(workflow, "assets/alpha/signing/t3code-alpha-release-signing.cer");
    assert.include(workflow, "--test-requirement");
    assert.include(workflow, "certificate leaf");
    assert.include(workflow, 'if grep -Fq "Signature=adhoc"');
    assert.include(workflow, "Alpha release unexpectedly has an ad-hoc signature.");
  });
});
