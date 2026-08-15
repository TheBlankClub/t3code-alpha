import type { App } from "electron";

import { ALPHA_DISTRIBUTION } from "@t3tools/shared/alphaDistribution";

export interface ResolveEarlyDesktopUserDataPathInput {
  readonly appDataDirectory?: string | undefined;
  readonly environment: Readonly<Record<string, string | undefined>>;
  readonly exists: (path: string) => boolean;
  readonly homeDirectory: string;
  readonly joinPath: (first: string, ...segments: ReadonlyArray<string>) => string;
  readonly platform: NodeJS.Platform;
}

const trimmed = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export function resolveEarlyDesktopUserDataPath(
  input: ResolveEarlyDesktopUserDataPathInput,
): string {
  const isDevelopment = trimmed(input.environment.VITE_DEV_SERVER_URL) !== undefined;
  const appDataDirectory =
    trimmed(input.appDataDirectory) ??
    (input.platform === "win32"
      ? (trimmed(input.environment.APPDATA) ??
        input.joinPath(input.homeDirectory, "AppData", "Roaming"))
      : input.platform === "darwin"
        ? input.joinPath(input.homeDirectory, "Library", "Application Support")
        : (trimmed(input.environment.XDG_CONFIG_HOME) ??
          input.joinPath(input.homeDirectory, ".config")));
  const userDataDirName = isDevelopment ? "t3code-dev" : ALPHA_DISTRIBUTION.desktopUserDataDirName;
  const legacyUserDataDirName = isDevelopment ? "T3 Code (Dev)" : userDataDirName;
  const legacyPath = input.joinPath(appDataDirectory, legacyUserDataDirName);

  return input.exists(legacyPath) ? legacyPath : input.joinPath(appDataDirectory, userDataDirName);
}

export function configureEarlyDesktopUserData(
  electronApp: Pick<App, "setPath">,
  input: ResolveEarlyDesktopUserDataPathInput,
): string {
  const userDataPath = resolveEarlyDesktopUserDataPath(input);
  electronApp.setPath("userData", userDataPath);
  return userDataPath;
}
