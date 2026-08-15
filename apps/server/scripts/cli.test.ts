import { assert, describe, it } from "@effect/vitest";

import { createPublishPackageJson, createPublishProcessOptions } from "./cli.ts";

describe("server publish CLI", () => {
  it("inherits stdin so npm can complete interactive write authentication", () => {
    const options = createPublishProcessOptions("/repo", true, false);

    assert.equal(Reflect.get(options, "stdin"), "inherit");
  });

  it("publishes the Alpha identity with complete npm metadata", () => {
    const pkg = createPublishPackageJson("1.2.3-alpha.20260815.1", {}, {});

    assert.equal(pkg.name, "t3code-alpha");
    assert.equal(pkg.description, "T3 Code Alpha server and CLI.");
    assert.equal(pkg.license, "MIT");
    assert.equal(pkg.version, "1.2.3-alpha.20260815.1");
    assert.equal(pkg.bin["t3-alpha"], "./dist/bin.mjs");
  });
});
