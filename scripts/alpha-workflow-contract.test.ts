// @effect-diagnostics nodeBuiltinImport:off - Workflow contract tests read repository fixtures directly.
import * as NodeChildProcess from "node:child_process";
import * as NodeOS from "node:os";
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
  it("checks upstream every six hours and prepares only conflict-free candidates", () => {
    const workflow = readWorkflow("sync-upstream.yml") as {
      readonly on: { readonly schedule: ReadonlyArray<{ readonly cron: string }> };
    };
    const serialized = JSON.stringify(workflow);

    assert.deepStrictEqual(workflow.on.schedule, [{ cron: "37 2,8,14,20 * * *" }]);
    assert.include(serialized, "classify-alpha-sync.ts");
    assert.include(serialized, "git merge --no-ff --no-edit upstream/main");
    assert.include(serialized, "git merge --abort");
    assert.include(serialized, "alpha-auto-sync");
    assert.include(serialized, "alpha-semantic-overlap");
    assert.notInclude(serialized, "Report review-required upstream overlap");
    assert.notInclude(serialized, "steps.classify.outputs.safe == 'true'");
    assert.notInclude(serialized, "gh pr merge");
  });

  it("journals a tested safe candidate before enabling its merge", () => {
    const serialized = serializedWorkflow("finalize-upstream-sync.yml");

    assert.include(serialized, "record-alpha-safe-sync.ts journal");
    assert.include(serialized, "github.event.workflow_run.conclusion == 'success'");
    assert.include(serialized, "--match-head-commit");
    assert.include(serialized, "--auto");
    assert.notInclude(serialized, "--admin");
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

  it("publishes only the arm64 DMG while retaining all four CLI resource monitors", () => {
    const workflow = readWorkflow("release-alpha.yml") as {
      readonly jobs: Record<
        "build" | "build_cli_resource_monitors" | "publish_cli" | "report_status" | "release",
        {
          readonly needs: ReadonlyArray<string>;
          readonly if: string;
          readonly strategy?: {
            readonly matrix: {
              readonly include: ReadonlyArray<{
                readonly platform?: string;
                readonly arch?: string;
                readonly resource_key: string;
              }>;
            };
          };
          readonly steps: ReadonlyArray<{
            readonly name?: string;
            readonly uses?: string;
            readonly run?: string;
            readonly with?: { readonly files?: string; readonly fail_on_unmatched_files?: boolean };
          }>;
        }
      >;
    };
    const { jobs } = workflow;
    assert.deepStrictEqual(
      jobs.build.strategy?.matrix.include.map(({ platform, arch }) => ({ platform, arch })),
      [{ platform: "mac", arch: "arm64" }],
    );
    const resourceKeys = [
      ...(jobs.build.strategy?.matrix.include ?? []),
      ...(jobs.build_cli_resource_monitors.strategy?.matrix.include ?? []),
    ].map(({ resource_key }) => resource_key);
    assert.sameMembers(resourceKeys, ["darwin-arm64", "darwin-x64", "linux-x64", "win32-x64"]);
    assert.notProperty(jobs, "build_wsl_node_pty");
    assert.includeMembers([...jobs.publish_cli.needs], ["build", "build_cli_resource_monitors"]);
    assert.include(jobs.publish_cli.if, "needs.build_cli_resource_monitors.result == 'success'");
    assert.includeMembers([...jobs.report_status.needs], ["build", "build_cli_resource_monitors"]);
    const uploads = jobs.release.steps.filter((step) =>
      step.uses?.startsWith("softprops/action-gh-release@"),
    );
    assert.lengthOf(uploads, 2);
    for (const upload of uploads) {
      assert.equal(upload.with?.files?.trim(), "release-assets/*.dmg");
      assert.isTrue(upload.with?.["fail_on_unmatched_files"]);
    }

    const bundleScript = jobs.publish_cli.steps.find(
      (step) => step.name === "Bundle resource monitors into CLI package",
    )?.run;
    assert.isDefined(bundleScript);
    const fixture = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "alpha-resource-monitors-"));
    try {
      for (const resourceKey of resourceKeys) {
        const artifactDir = NodePath.join(
          fixture,
          "resource-monitors",
          `alpha-resource-monitor-${resourceKey}`,
        );
        NodeFS.mkdirSync(artifactDir, { recursive: true });
        const binaryName =
          resourceKey === "win32-x64" ? "t3-resource-monitor.exe" : "t3-resource-monitor";
        NodeFS.writeFileSync(NodePath.join(artifactDir, binaryName), resourceKey);
      }
      const bundle = () =>
        NodeChildProcess.execFileSync("bash", ["-c", bundleScript], {
          cwd: fixture,
          env: { ...process.env, RUNNER_TEMP: fixture },
          stdio: "pipe",
        });
      bundle();
      for (const resourceKey of resourceKeys) {
        const binaryName =
          resourceKey === "win32-x64" ? "t3-resource-monitor.exe" : "t3-resource-monitor";
        assert.equal(
          NodeFS.readFileSync(
            NodePath.join(fixture, "apps/server/dist/resource-monitor", resourceKey, binaryName),
            "utf8",
          ),
          resourceKey,
        );
      }
      NodeFS.rmSync(NodePath.join(fixture, "resource-monitors/alpha-resource-monitor-linux-x64"), {
        recursive: true,
      });
      assert.throws(bundle);
    } finally {
      NodeFS.rmSync(fixture, { recursive: true, force: true });
    }
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
    // Trust must be established non-interactively: `sudo` plus the admin domain
    // avoids the authorization prompt that once hung this step, and the setting
    // must stay policy-unscoped so electron-builder's bare `find-identity -v`
    // lookup still sees the identity as valid.
    assert.include(signingStep.run, "sudo security add-trusted-cert");
    assert.include(signingStep.run, "-k /Library/Keychains/System.keychain");
    assert.notInclude(signingStep.run, "-p codeSign");
    assert.include(signingStep.run, 'security find-identity -v "$signing_keychain"');
    assert.include(signingStep.run, 'security list-keychains -d user -s "$signing_keychain"');
    assert.include(signingStep.run, "security set-key-partition-list");
    assert.include(signingStep.run, '-l "T3 Code Alpha Release Signing"');
    assert.include(signingStep.run, "continuing to the signing probe");
    assert.include(signingStep.run, "security find-certificate");
    assert.include(signingStep.run, "t3code-alpha-signing-probe");
    assert.include(signingStep.run, "codesign --force");
    assert.include(signingStep.run, '--test-requirement "$probe_requirement"');

    assert.include(workflow, "ALPHA_MAC_SIGNING_P12_BASE64");
    assert.include(workflow, "ALPHA_MAC_SIGNING_P12_PASSWORD");
    // Signing state is never cleaned up: the ephemeral runner discards it, and
    // `remove-trusted-cert` hangs on interactive authorization. Neither command
    // may come back, and post-upload cleanup must not reappear at all.
    assert.notInclude(workflow, "security remove-trusted-cert");
    assert.notInclude(workflow, "security delete-keychain");
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
