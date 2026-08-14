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
