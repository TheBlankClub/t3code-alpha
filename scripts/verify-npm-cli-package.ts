#!/usr/bin/env node
/**
 * Installs the built `t3code-alpha` tarball into a scratch directory and runs
 * the executable it downloads, before the release publishes it.
 *
 * The package resolves its executable at install time from the GitHub release,
 * so a publish can succeed and still leave every `npx t3code-alpha` broken:
 * a missing archive, a SHA256SUMS the release never got, a wrong version in
 * the download URL. Only a real install catches those, so CI does one against
 * the release it just published.
 */
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";
import { Command, Flag } from "effect/unstable/cli";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

import { ALPHA_DISTRIBUTION } from "@t3tools/shared/alphaDistribution";
import { fromJsonStringPretty } from "@t3tools/shared/schemaJson";

const encodePackageJson = Schema.encodeEffect(fromJsonStringPretty(Schema.Unknown));

export class NpmPackageVerifyError extends Schema.TaggedError<NpmPackageVerifyError>()(
  "NpmPackageVerifyError",
  { step: Schema.String, detail: Schema.String },
) {
  override get message(): string {
    return `${this.step}: ${this.detail}`;
  }
}

const collect = <E>(stream: Stream.Stream<Uint8Array, E>) =>
  stream.pipe(
    Stream.decodeText(),
    Stream.runFold(
      () => "",
      (acc, chunk) => acc + chunk,
    ),
  );

const run = Effect.fn("run")(function* (input: {
  readonly command: string;
  readonly args: ReadonlyArray<string>;
  readonly cwd: string;
  readonly step: string;
}) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const child = yield* spawner.spawn(
    ChildProcess.make(input.command, [...input.args], { cwd: input.cwd }),
  );
  const [stdout, stderr, exitCode] = yield* Effect.all(
    [collect(child.stdout), collect(child.stderr), child.exitCode.pipe(Effect.map(Number))],
    { concurrency: "unbounded" },
  );
  if (exitCode !== 0) {
    return yield* new NpmPackageVerifyError({
      step: input.step,
      detail: `${input.command} exited with ${exitCode}.\n${stdout}\n${stderr}`,
    });
  }
  return { stdout, stderr };
});

export const verifyNpmCliPackage = Effect.fn("verifyNpmCliPackage")(function* (input: {
  readonly prebuiltDir: string;
  readonly version: string;
}) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const packageName = ALPHA_DISTRIBUTION.serverPackageName;
  const binaryName = ALPHA_DISTRIBUTION.serverBinaryName;

  const tarball = path.resolve(path.join(input.prebuiltDir, `${packageName}.tgz`));
  if (!(yield* fs.exists(tarball))) {
    return yield* new NpmPackageVerifyError({
      step: "locating the built tarball",
      detail: `${tarball} does not exist.`,
    });
  }

  const scratch = yield* fs.makeTempDirectoryScoped({ prefix: "t3code-alpha-verify-" });
  yield* fs.writeFileString(
    path.join(scratch, "package.json"),
    `${yield* encodePackageJson({ name: "t3code-alpha-verify", private: true, version: "0.0.0" })}\n`,
  );

  yield* Effect.log(`[verify] Installing ${tarball} into ${scratch}`);
  // The postinstall downloads the executable from the release, so this
  // install exercises the same path a user's `npx t3code-alpha` takes.
  yield* run({
    command: "npm",
    args: ["install", "--no-audit", "--no-fund", tarball],
    cwd: scratch,
    step: "installing the package",
  });

  const executable = path.join(scratch, "node_modules", packageName, "runtime", binaryName);
  if (!(yield* fs.exists(executable))) {
    return yield* new NpmPackageVerifyError({
      step: "checking the installed executable",
      detail: `${executable} is missing; the postinstall did not extract the release archive.`,
    });
  }

  const { stdout } = yield* run({
    command: executable,
    args: ["--version"],
    cwd: scratch,
    step: "running the installed executable",
  });
  const reported = stdout.trim();
  if (!reported.includes(input.version)) {
    return yield* new NpmPackageVerifyError({
      step: "checking the installed version",
      detail: `expected ${input.version}, got ${reported || "(no output)"}.`,
    });
  }
  yield* Effect.log(`[verify] ${packageName} installed and reported ${reported}`);
}, Effect.scoped);

const command = Command.make(
  "verify-npm-cli-package",
  {
    prebuiltDir: Flag.String("prebuilt-dir").pipe(
      Flag.withDescription("Directory holding the built t3code-alpha.tgz."),
    ),
    version: Flag.String("version").pipe(
      Flag.withDescription("Version the installed executable must report."),
    ),
  },
  verifyNpmCliPackage,
).pipe(
  Command.withDescription("Install the built npm package and run the executable it downloads."),
);

if (import.meta.main) {
  Command.run(command, { version: "0.0.0" }).pipe(
    Effect.provide(Layer.mergeAll(Logger.layer([Logger.consolePretty()]), NodeServices.layer)),
    NodeRuntime.runMain,
  );
}
