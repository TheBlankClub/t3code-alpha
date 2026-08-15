// @effect-diagnostics nodeBuiltinImport:off - The release contract verifies the checked-in certificate bytes.
import * as NodeCrypto from "node:crypto";
import * as NodeFS from "node:fs";

import { ALPHA_DISTRIBUTION } from "@t3tools/shared/alphaDistribution";
import { assert, it } from "@effect/vitest";

import { renderAlphaHomebrewCask } from "./render-alpha-homebrew-cask.ts";

it("pins the cask fingerprint to the checked-in release certificate", () => {
  const certificate = new NodeCrypto.X509Certificate(
    NodeFS.readFileSync(
      new URL("../assets/alpha/signing/t3code-alpha-release-signing.cer", import.meta.url),
    ),
  );

  assert.equal(
    certificate.fingerprint.replaceAll(":", ""),
    ALPHA_DISTRIBUTION.macReleaseSigningCertificateSha1,
  );
  assert.include(certificate.subject, `CN=${ALPHA_DISTRIBUTION.macReleaseSigningIdentity}`);
});

it("renders the architecture-specific Alpha cask with pinned signature verification", () => {
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
  assert.include(cask, 'args: ["--verify", "--deep", "--strict", target]');
  assert.include(cask, '"--test-requirement"');
  assert.include(cask, 'identifier \\"com.theblankclub.t3code.alpha\\"');
  assert.include(cask, 'certificate leaf = H\\"A3FE7063335600A78DDB3634CF76D5E1EF6D9645\\"');
  assert.include(cask, 'args: ["-dr", "com.apple.quarantine", target]');
  assert.include(cask, "brew upgrade --cask t3code-alpha");
  assert.notInclude(cask, "--no-quarantine");
  assert.notInclude(cask, '"--sign"');
  assert.notInclude(cask, "Signature=adhoc");

  assert.isBelow(cask.indexOf('args: ["--verify"'), cask.indexOf('args: ["-dr"'));
});
