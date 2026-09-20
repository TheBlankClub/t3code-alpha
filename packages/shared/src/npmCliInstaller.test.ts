import { assert, describe, it } from "@effect/vitest";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

import { CLI_ARCHIVE_PLATFORM_KEYS } from "./cliRelease.ts";
import { npmCliInstallerScript, npmCliLauncherScript } from "./npmCliInstaller.ts";

const decodeKeys = Schema.decodeUnknownEffect(Schema.fromJsonString(Schema.Array(Schema.String)));

/**
 * Both scripts ship to users as generated text that Node runs directly, so a
 * syntax error or a stale reference only surfaces on someone's machine. Parse
 * them the way Node will.
 */
const assertParses = Effect.fn("assertParses")(function* (source: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const dir = yield* fs.makeTempDirectoryScoped({ prefix: "npm-cli-installer-test-" });
  const file = path.join(dir, "script.js");
  yield* fs.writeFileString(file, source);
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const child = yield* spawner.spawn(ChildProcess.make(process.execPath, ["--check", file]));
  assert.strictEqual(Number(yield* child.exitCode), 0);
}, Effect.scoped);

describe("npmCliInstaller", () => {
  it.layer(NodeServices.layer)("npmCliInstaller", (it) => {
    it.effect("emits an installer Node can parse", () => assertParses(npmCliInstallerScript()));

    it.effect("emits a launcher Node can parse", () => assertParses(npmCliLauncherScript()));

    it.effect("offers exactly the platforms a release builds archives for", () =>
      Effect.gen(function* () {
        const listed = /const PLATFORM_KEYS = (\[[^\]]*\]);/.exec(npmCliInstallerScript())?.[1];
        assert.isDefined(listed);
        // The installer downloads by platform key, so a key it offers without
        // a matching archive is a 404 at install time.
        assert.sameMembers(
          [...(yield* decodeKeys(listed ?? "[]"))],
          [...CLI_ARCHIVE_PLATFORM_KEYS],
        );
      }),
    );
  });

  it("verifies the download against the release checksums", () => {
    const script = npmCliInstallerScript();
    assert.include(script, "SHA256SUMS");
    assert.include(script, "createHash");
    assert.include(script, "Checksum mismatch");
  });

  it("honors a release base URL override for mirrors", () => {
    assert.include(npmCliInstallerScript(), "T3CODE_RELEASE_BASE_URL");
  });

  it("installs from the launcher when the postinstall was skipped", () => {
    const launcher = npmCliLauncherScript();
    // --ignore-scripts leaves no runtime; the launcher must install rather
    // than exec a missing executable.
    assert.include(launcher, "isInstalled()");
    assert.include(launcher, "install()");
  });
});
