// @effect-diagnostics nodeBuiltinImport:off - Cross-platform path fixtures exercise the synchronous Electron bootstrap boundary.
import * as NodePath from "node:path";

import { assert, describe, it } from "@effect/vitest";

import {
  configureEarlyDesktopUserData,
  resolveEarlyDesktopUserDataPath,
} from "./DesktopEarlyUserData.ts";

const baseInput = {
  environment: {},
  exists: () => false,
  homeDirectory: "/Users/alice",
  joinPath: NodePath.posix.join,
  platform: "darwin",
} as const;

describe("DesktopEarlyUserData", () => {
  it("points packaged Alpha helpers at the isolated profile before startup", () => {
    const calls: Array<[string, string]> = [];
    const path = configureEarlyDesktopUserData(
      {
        setPath: (name, value) => {
          calls.push([name, value]);
        },
      },
      baseInput,
    );

    assert.equal(path, "/Users/alice/Library/Application Support/t3code-alpha");
    assert.deepEqual(calls, [["userData", path]]);
  });

  it("preserves the existing development profile selection", () => {
    assert.equal(
      resolveEarlyDesktopUserDataPath({
        ...baseInput,
        environment: { VITE_DEV_SERVER_URL: "http://localhost:5173" },
        exists: (path) => path.endsWith("T3 Code (Dev)"),
      }),
      "/Users/alice/Library/Application Support/T3 Code (Dev)",
    );
  });

  it("uses the configured Windows application-data root", () => {
    assert.equal(
      resolveEarlyDesktopUserDataPath({
        ...baseInput,
        environment: { APPDATA: " C:\\Users\\alice\\AppData\\Roaming " },
        homeDirectory: "C:\\Users\\alice",
        joinPath: NodePath.win32.join,
        platform: "win32",
      }),
      "C:\\Users\\alice\\AppData\\Roaming\\t3code-alpha",
    );
  });
});
