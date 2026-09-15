import { describe, expect, it } from "vite-plus/test";

import {
  isAlphaDesktopVersion,
  isNightlyDesktopVersion,
  resolveDefaultDesktopUpdateChannel,
} from "./updateChannels.ts";

describe("desktop update channels", () => {
  it("recognizes dated Alpha versions", () => {
    expect(isAlphaDesktopVersion("0.0.34-alpha.20260815.1")).toBe(true);
    expect(isAlphaDesktopVersion("0.0.34-alpha.20260815")).toBe(false);
    expect(isAlphaDesktopVersion("0.0.34-alpha.1")).toBe(false);
  });

  it("keeps Nightly recognition separate", () => {
    expect(isNightlyDesktopVersion("0.0.34-nightly.20260815.1")).toBe(true);
    expect(isNightlyDesktopVersion("0.0.34-alpha.20260815.1")).toBe(false);
  });

  it("maps release versions to their updater channels", () => {
    expect(resolveDefaultDesktopUpdateChannel("0.0.34-alpha.20260815.1")).toBe("alpha");
    expect(resolveDefaultDesktopUpdateChannel("0.0.34-nightly.20260815.1")).toBe("nightly");
    expect(resolveDefaultDesktopUpdateChannel("0.0.34")).toBe("latest");
  });
});

describe("updateChannels", () => {
  it("keeps preview builds branded as nightly but on the latest update channel", () => {
    expect(isNightlyDesktopVersion("0.0.41-preview.20260911.7")).toBe(true);
    expect(resolveDefaultDesktopUpdateChannel("0.0.41-preview.20260911.7")).toBe("latest");
    expect(resolveDefaultDesktopUpdateChannel("0.0.41-nightly.20260911.7")).toBe("nightly");
  });

  it("only matches the first prerelease identifier", () => {
    expect(isNightlyDesktopVersion("1.2.3-foo-preview.20260911.1")).toBe(false);
    expect(isNightlyDesktopVersion("1.2.3")).toBe(false);
  });
});
