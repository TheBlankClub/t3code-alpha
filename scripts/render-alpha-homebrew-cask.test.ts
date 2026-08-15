import { assert, it } from "@effect/vitest";

import { renderAlphaHomebrewCask } from "./render-alpha-homebrew-cask.ts";

it("renders the architecture-specific Alpha cask and unsigned install guidance", () => {
  const cask = renderAlphaHomebrewCask({
    version: "0.0.34-alpha.20260815.27",
    arm64Sha256: "a".repeat(64),
    x64Sha256: "b".repeat(64),
  });

  assert.include(cask, 'version "0.0.34-alpha.20260815.27"');
  assert.include(cask, 'arch arm: "arm64", intel: "x64"');
  assert.include(cask, `sha256 arm:   "${"a".repeat(64)}"`);
  assert.include(cask, `intel: "${"b".repeat(64)}"`);
  assert.include(cask, "T3-Code-Alpha-#{version}-#{arch}.dmg");
  assert.include(cask, 'app "T3 Code Alpha.app"');
  assert.include(cask, "depends_on :macos");
  assert.include(cask, "brew upgrade --cask --no-quarantine t3code-alpha");
});
