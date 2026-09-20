#!/usr/bin/env node
/**
 * Builds the single `t3code-alpha` npm package.
 *
 * The package carries no executable. Its postinstall downloads the release
 * archive for the host from the GitHub release this same workflow publishes,
 * verifies it against that release's SHA256SUMS, and extracts it into the
 * package. One npm package therefore serves every supported platform at a few
 * kilobytes, instead of one package per platform plus a launcher: those
 * per-platform packages each had to exist on npm before CI could publish
 * them, which is what kept the Alpha release failing.
 *
 * Output layout under `--output-dir`:
 *
 *   t3code-alpha/       package.json, bin/t3-alpha.js, install.js, README.md
 *   t3code-alpha.tgz    the same tree as an npm tarball
 */
import { ALPHA_DISTRIBUTION } from "@t3tools/shared/alphaDistribution";
import { legacyCliLauncherScript } from "@t3tools/shared/legacyCliLauncher";
import {
  NPM_CLI_RUNTIME_DIR,
  npmCliInstallerScript,
  npmCliLauncherScript,
} from "@t3tools/shared/npmCliInstaller";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import { Command, Flag } from "effect/unstable/cli";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

import { fromJsonStringPretty } from "@t3tools/shared/schemaJson";
import { isCommandAvailable } from "@t3tools/shared/shell";
import serverPackageJson from "../apps/server/package.json" with { type: "json" };

export const NPM_PACKAGE_NAME = ALPHA_DISTRIBUTION.serverPackageName;
export const NPM_BINARY_NAME = ALPHA_DISTRIBUTION.serverBinaryName;

const encodePackageJson = Schema.encodeEffect(fromJsonStringPretty(Schema.Unknown));

export class NpmPackageCommandFailedError extends Schema.TaggedError<NpmPackageCommandFailedError>()(
  "NpmPackageCommandFailedError",
  { command: Schema.String, exitCode: Schema.Int },
) {
  override get message(): string {
    return `${this.command} exited with code ${this.exitCode}.`;
  }
}

export class NpmPackageToolMissingError extends Schema.TaggedError<NpmPackageToolMissingError>()(
  "NpmPackageToolMissingError",
  { tool: Schema.String, purpose: Schema.String },
) {
  override get message(): string {
    return `\`${this.tool}\` is not on PATH; it is needed to ${this.purpose}.`;
  }
}

/**
 * `runtime/` is deliberately absent from `files`: the install creates it, so a
 * published tarball never carries one platform's binary. `postinstall` is best
 * effort; the bin script installs on first run when scripts were skipped.
 */
export function npmCliPackageManifest(version: string) {
  return {
    name: NPM_PACKAGE_NAME,
    version,
    description: "T3 Code Alpha CLI. Installs the self-contained executable for this platform.",
    license: serverPackageJson.license,
    repository: serverPackageJson.repository,
    bin: { [NPM_BINARY_NAME]: `./bin/${NPM_BINARY_NAME}.js` },
    files: ["bin", "dist", "install.js"],
    scripts: { postinstall: "node install.js" },
    os: ["darwin", "linux"],
  };
}

const runCommand = Effect.fn("runCommand")(function* (
  command: ChildProcess.StandardCommand,
  label: string,
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const child = yield* spawner.spawn(
    ChildProcess.make(command.command, command.args, {
      ...command.options,
      stdout: "inherit",
      stderr: "inherit",
    }),
  );
  const exitCode = Number(yield* child.exitCode);
  if (exitCode !== 0) {
    return yield* new NpmPackageCommandFailedError({ command: label, exitCode });
  }
});

const hostTar = Effect.gen(function* () {
  if (!(yield* isCommandAvailable("tar"))) {
    return yield* new NpmPackageToolMissingError({ tool: "tar", purpose: "pack the npm tarball" });
  }
  return "tar";
});

/** Packs the staged tree into a tarball npm publishes byte for byte. */
const packAndPlace = Effect.fn("packAndPlace")(function* (input: {
  readonly stageDir: string;
  readonly packageDir: string;
  readonly tarball: string;
}) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const packageDir = path.join(input.stageDir, "package");
  const files: Array<string> = [];
  for (const entry of yield* fs.readDirectory(packageDir, { recursive: true })) {
    if ((yield* fs.stat(path.join(packageDir, entry))).type !== "Directory") {
      files.push(entry);
    }
  }
  const tarFileList = path.join(input.stageDir, ".npm-tar-files");
  yield* fs.writeFileString(
    tarFileList,
    files
      .sort()
      .map((file) => `package/${file.replaceAll("\\", "/")}`)
      .join("\n"),
  );
  yield* fs.remove(input.tarball, { force: true });
  yield* runCommand(
    ChildProcess.make(
      yield* hostTar,
      ["-czf", input.tarball, "--no-recursion", "-C", input.stageDir, "-T", tarFileList],
      { env: { ...process.env, COPYFILE_DISABLE: "1" } },
    ),
    `tar (${input.tarball})`,
  );
  yield* fs.remove(tarFileList, { force: true });
  yield* fs.remove(input.packageDir, { recursive: true, force: true });
  yield* fs.rename(packageDir, input.packageDir);
});

export interface NpmPackageOutput {
  readonly name: string;
  readonly packageDir: string;
  readonly tarball: string;
}

export const buildNpmCliPackage = Effect.fn("buildNpmCliPackage")(function* (input: {
  readonly version: string;
  readonly outputDir: string;
}) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  yield* fs.makeDirectory(input.outputDir, { recursive: true });
  const scratch = yield* fs.makeTempDirectoryScoped({
    directory: input.outputDir,
    prefix: ".package-",
  });
  const stageDir = path.join(scratch, "package");
  yield* fs.makeDirectory(path.join(stageDir, "bin"), { recursive: true });
  yield* fs.writeFileString(
    path.join(stageDir, "package.json"),
    `${yield* encodePackageJson(npmCliPackageManifest(input.version))}\n`,
  );

  yield* fs.writeFileString(path.join(stageDir, "install.js"), npmCliInstallerScript());
  const launcherScript = path.join(stageDir, `bin/${NPM_BINARY_NAME}.js`);
  yield* fs.writeFileString(launcherScript, npmCliLauncherScript());
  yield* fs.chmod(launcherScript, 0o755);

  // Older service updaters run this exact path with Node to start a new
  // version they just installed. Keep it until no supported release predates
  // the executable.
  yield* fs.makeDirectory(path.join(stageDir, "dist"));
  yield* fs.writeFileString(path.join(stageDir, "dist/bin.mjs"), legacyCliLauncherScript());

  const readme = yield* path.fromFileUrl(new URL("../apps/server/README.md", import.meta.url));
  if (yield* fs.exists(readme)) {
    yield* fs.copyFile(readme, path.join(stageDir, "README.md"));
  }

  const output: NpmPackageOutput = {
    name: NPM_PACKAGE_NAME,
    packageDir: path.join(input.outputDir, NPM_PACKAGE_NAME),
    tarball: path.join(input.outputDir, `${NPM_PACKAGE_NAME}.tgz`),
  };
  yield* packAndPlace({ stageDir: scratch, ...output });
  yield* Effect.log(`[npm-package] Wrote ${output.packageDir} and ${output.tarball}`);
  yield* Effect.log(
    `[npm-package] ${NPM_PACKAGE_NAME} installs its executable into ${NPM_CLI_RUNTIME_DIR}/ at install time.`,
  );
  return output;
}, Effect.scoped);

const command = Command.make(
  "build-npm-cli-package",
  {
    version: Flag.String("version").pipe(
      Flag.withDescription("Exact release version; versions the package and its download URLs."),
    ),
    outputDir: Flag.String("output-dir").pipe(Flag.withDefault("npm-packages")),
  },
  buildNpmCliPackage,
).pipe(Command.withDescription("Build the t3code-alpha npm package."));

if (import.meta.main) {
  Command.run(command, { version: "0.0.0" }).pipe(
    Effect.provide(Layer.mergeAll(Logger.layer([Logger.consolePretty()]), NodeServices.layer)),
    NodeRuntime.runMain,
  );
}
