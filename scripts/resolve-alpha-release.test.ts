import { assert, it } from "@effect/vitest";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";

import { resolveAlphaReleaseMetadata, writeAlphaReleaseOutput } from "./resolve-alpha-release.ts";

it("derives Alpha metadata from the next upstream patch version", () => {
  assert.deepStrictEqual(
    resolveAlphaReleaseMetadata("0.0.34", "20260815", 27, "abcdef1234567890"),
    {
      baseVersion: "0.0.34",
      version: "0.0.34-alpha.20260815.27",
      tag: "v0.0.34-alpha.20260815.27",
      name: "T3 Code Alpha 0.0.34-alpha.20260815.27 (abcdef123456)",
      shortSha: "abcdef123456",
    },
  );
});

it.effect("writes release metadata to the GitHub output file", () =>
  Effect.gen(function* () {
    let output = "";
    const metadata = resolveAlphaReleaseMetadata("0.0.34", "20260815", 27, "abcdef1234567890");

    yield* writeAlphaReleaseOutput(metadata, true).pipe(
      Effect.provideService(
        FileSystem.FileSystem,
        FileSystem.makeNoop({
          writeFileString: (_path, contents) =>
            Effect.sync(() => {
              output += contents;
            }),
        }),
      ),
      Effect.provideService(
        ConfigProvider.ConfigProvider,
        ConfigProvider.fromEnv({ env: { GITHUB_OUTPUT: "/tmp/alpha-output" } }),
      ),
    );

    assert.include(output, "version=0.0.34-alpha.20260815.27\n");
    assert.include(output, "tag=v0.0.34-alpha.20260815.27\n");
  }),
);
