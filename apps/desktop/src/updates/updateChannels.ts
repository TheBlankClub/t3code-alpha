import type { DesktopUpdateChannel } from "@t3tools/contracts";

const NIGHTLY_VERSION_PATTERN = /-nightly\.\d{8}\.\d+$/;
const ALPHA_VERSION_PATTERN = /-alpha\.\d{8}\.\d+$/;

export function isNightlyDesktopVersion(version: string): boolean {
  return NIGHTLY_VERSION_PATTERN.test(version);
}

export function isAlphaDesktopVersion(version: string): boolean {
  return ALPHA_VERSION_PATTERN.test(version);
}

export function resolveDefaultDesktopUpdateChannel(appVersion: string): DesktopUpdateChannel {
  if (isAlphaDesktopVersion(appVersion)) return "alpha";
  return isNightlyDesktopVersion(appVersion) ? "nightly" : "latest";
}
