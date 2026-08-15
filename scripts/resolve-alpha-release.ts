#!/usr/bin/env node

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Config from "effect/Config";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { Command, Flag } from "effect/unstable/cli";

import { readDesktopBaseVersion } from "./resolve-nightly-release.ts";

export interface AlphaReleaseMetadata {
  readonly baseVersion: string;
  readonly version: string;
  readonly tag: string;
  readonly name: string;
  readonly shortSha: string;
}

const DateSchema = Schema.String.check(Schema.isPattern(/^\d{8}$/));
const RunNumberSchema = Schema.FiniteFromString.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(1),
);
const ShaSchema = Schema.String.check(Schema.isPattern(/^[0-9a-f]{7,40}$/i));

export class AlphaReleaseGitHubOutputConfigError extends Schema.TaggedErrorClass<AlphaReleaseGitHubOutputConfigError>()(
  "AlphaReleaseGitHubOutputConfigError",
  { cause: Schema.Defect() },
) {
  override get message(): string {
    return "Failed to resolve the GITHUB_OUTPUT path for Alpha release metadata.";
  }
}

export class AlphaReleaseGitHubOutputAppendError extends Schema.TaggedErrorClass<AlphaReleaseGitHubOutputAppendError>()(
  "AlphaReleaseGitHubOutputAppendError",
  {
    outputPath: Schema.String,
    cause: Schema.Defect(),
  },
) {
  override get message(): string {
    return `Failed to append Alpha release metadata to ${this.outputPath}.`;
  }
}

export const resolveAlphaReleaseMetadata = (
  baseVersion: string,
  date: string,
  runNumber: number,
  sha: string,
): AlphaReleaseMetadata => {
  const shortSha = sha.slice(0, 12);
  const version = `${baseVersion}-alpha.${date}.${runNumber}`;
  return {
    baseVersion,
    version,
    tag: `v${version}`,
    name: `T3 Code Alpha ${version} (${shortSha})`,
    shortSha,
  };
};

export const writeAlphaReleaseOutput = Effect.fn("writeAlphaReleaseOutput")(function* (
  metadata: AlphaReleaseMetadata,
  writeGithubOutput: boolean,
) {
  const fs = yield* FileSystem.FileSystem;
  const entries = [
    ["base_version", metadata.baseVersion],
    ["version", metadata.version],
    ["tag", metadata.tag],
    ["name", metadata.name],
    ["short_sha", metadata.shortSha],
  ] as const;

  if (!writeGithubOutput) {
    for (const [key, value] of entries) {
      yield* Console.log(`${key}=${value}`);
    }
    return;
  }

  const outputPath = yield* Config.nonEmptyString("GITHUB_OUTPUT").pipe(
    Effect.mapError((cause) => new AlphaReleaseGitHubOutputConfigError({ cause })),
  );
  const serialized = entries.map(([key, value]) => `${key}=${value}\n`).join("");
  yield* fs
    .writeFileString(outputPath, serialized, { flag: "a" })
    .pipe(
      Effect.mapError((cause) => new AlphaReleaseGitHubOutputAppendError({ outputPath, cause })),
    );
});

const command = Command.make(
  "resolve-alpha-release",
  {
    date: Flag.string("date").pipe(
      Flag.withSchema(DateSchema),
      Flag.withDescription("Alpha build date in YYYYMMDD."),
    ),
    runNumber: Flag.string("run-number").pipe(
      Flag.withSchema(RunNumberSchema),
      Flag.withDescription("GitHub Actions run number."),
    ),
    sha: Flag.string("sha").pipe(
      Flag.withSchema(ShaSchema),
      Flag.withDescription("Commit sha for the Alpha build."),
    ),
    githubOutput: Flag.boolean("github-output").pipe(
      Flag.withDescription("Write values to GITHUB_OUTPUT instead of stdout."),
      Flag.withDefault(false),
    ),
    root: Flag.string("root").pipe(
      Flag.withDescription("Workspace root used to resolve apps/desktop/package.json."),
      Flag.optional,
    ),
  },
  ({ date, runNumber, sha, githubOutput, root }) =>
    readDesktopBaseVersion(Option.getOrUndefined(root)).pipe(
      Effect.map((baseVersion) => resolveAlphaReleaseMetadata(baseVersion, date, runNumber, sha)),
      Effect.flatMap((metadata) => writeAlphaReleaseOutput(metadata, githubOutput)),
    ),
).pipe(Command.withDescription("Resolve Alpha release version metadata."));

if (import.meta.main) {
  Command.run(command, { version: "0.0.0" }).pipe(
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain,
  );
}
