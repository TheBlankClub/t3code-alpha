#!/usr/bin/env node

import * as NodeCrypto from "node:crypto";

import { ALPHA_DISTRIBUTION } from "@t3tools/shared/alphaDistribution";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import { Command, Flag } from "effect/unstable/cli";

const AlphaVersion = Schema.String.check(Schema.isPattern(/^\d+\.\d+\.\d+-alpha\.\d{8}\.\d+$/));

export interface AlphaHomebrewCaskInput {
  readonly version: string;
  readonly arm64Sha256: string;
  readonly x64Sha256: string;
}

function sha256(contents: Uint8Array): string {
  return NodeCrypto.createHash("sha256").update(contents).digest("hex");
}

export function renderAlphaHomebrewCask(input: AlphaHomebrewCaskInput): string {
  return `# typed: strict
# frozen_string_literal: true

cask "t3code-alpha" do
  arch arm: "arm64", intel: "x64"

  version "${input.version}"
  sha256 arm:   "${input.arm64Sha256}",
         intel: "${input.x64Sha256}"

  url "https://github.com/TheBlankClub/t3code-alpha/releases/download/v#{version}/T3-Code-Alpha-#{version}-#{arch}.dmg",
      verified: "github.com/TheBlankClub/t3code-alpha/"
  name "T3 Code Alpha"
  desc "TheBlankClub's frequently updated T3 Code distribution"
  homepage "https://github.com/TheBlankClub/t3code-alpha"

  depends_on :macos

  app "T3 Code Alpha.app"

  postflight do
    target = "#{appdir}/T3 Code Alpha.app"
    requirement = "=identifier \\"${ALPHA_DISTRIBUTION.desktopAppId}\\" and certificate leaf = H\\"${ALPHA_DISTRIBUTION.macReleaseSigningCertificateSha1}\\""

    system_command "/usr/bin/codesign",
                   args: ["--verify", "--deep", "--strict", target],
                   sudo: false
    system_command "/usr/bin/codesign",
                   args: ["--verify", "--deep", "--strict", "--test-requirement", requirement, target],
                   sudo: false
    system_command "/usr/bin/xattr",
                   args: ["-dr", "com.apple.quarantine", target],
                   sudo: false
  end

  caveats <<~EOS
    T3 Code Alpha is signed with TheBlankClub's persistent self-signed release
    identity, not an Apple Developer ID. This cask verifies that pinned identity
    and removes quarantine after every install or upgrade.
    Install it only if you trust TheBlankClub's release artifacts:

      brew install --cask theblankclub/tap/t3code-alpha
      brew upgrade --cask t3code-alpha
  EOS
end
`;
}

export const renderAlphaHomebrewCaskFile = Effect.fn("renderAlphaHomebrewCaskFile")(function* (
  version: string,
  arm64PathArg: string,
  x64PathArg: string,
  outputPathArg: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const arm64Path = path.resolve(arm64PathArg);
  const x64Path = path.resolve(x64PathArg);
  const outputPath = path.resolve(outputPathArg);

  const [arm64Contents, x64Contents] = yield* Effect.all([
    fs.readFile(arm64Path),
    fs.readFile(x64Path),
  ]);
  const cask = renderAlphaHomebrewCask({
    version,
    arm64Sha256: sha256(arm64Contents),
    x64Sha256: sha256(x64Contents),
  });

  yield* fs.writeFileString(outputPath, cask);
});

const command = Command.make(
  "render-alpha-homebrew-cask",
  {
    version: Flag.string("version").pipe(
      Flag.withSchema(AlphaVersion),
      Flag.withDescription("Released Alpha version."),
    ),
    arm64Path: Flag.string("arm64-path").pipe(Flag.withDescription("Path to the macOS arm64 DMG.")),
    x64Path: Flag.string("x64-path").pipe(Flag.withDescription("Path to the macOS x64 DMG.")),
    outputPath: Flag.string("output").pipe(Flag.withDescription("Destination Cask file.")),
  },
  ({ version, arm64Path, x64Path, outputPath }) =>
    renderAlphaHomebrewCaskFile(version, arm64Path, x64Path, outputPath),
).pipe(Command.withDescription("Render the Homebrew Cask for an Alpha desktop release."));

if (import.meta.main) {
  Command.run(command, { version: "0.0.0" }).pipe(
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain,
  );
}
