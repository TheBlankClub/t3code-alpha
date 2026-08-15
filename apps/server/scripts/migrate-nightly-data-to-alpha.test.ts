// @effect-diagnostics nodeBuiltinImport:off globalDate:off - Tests exercise the host-level migration utility with disposable paths.
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import * as NodeSqlite from "node:sqlite";

import { assert, describe, it } from "@effect/vitest";

import {
  readRunningServerPid,
  resolveAlphaDataMigrationPlan,
  runAlphaDataMigration,
} from "./migrate-nightly-data-to-alpha.ts";

function write(path: string, value: string): void {
  NodeFS.mkdirSync(NodePath.dirname(path), { recursive: true });
  NodeFS.writeFileSync(path, value);
}

function makeStateDatabase(path: string): void {
  NodeFS.mkdirSync(NodePath.dirname(path), { recursive: true });
  const database = new NodeSqlite.DatabaseSync(path);
  database.exec(`
    CREATE TABLE effect_sql_migrations (
      migration_id INTEGER PRIMARY KEY,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      name VARCHAR(255) NOT NULL
    );
  `);
  database.close();
}

function makeFixture(): {
  readonly root: string;
  readonly sourceBase: string;
  readonly targetBase: string;
} {
  const root = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "t3-alpha-migration-"));
  const sourceBase = NodePath.join(root, ".t3");
  const targetBase = NodePath.join(root, ".t3-alpha");
  makeStateDatabase(NodePath.join(sourceBase, "userdata", "state.sqlite"));
  write(NodePath.join(sourceBase, "userdata", "environment-id"), "nightly-env\n");
  write(
    NodePath.join(sourceBase, "userdata", "client-settings.json"),
    JSON.stringify({
      sidebarProjectGroupingMode: "repository",
      sidebarProjectGroupingOverrides: {
        "nightly-env:/projects/t3code": "separate",
        "remote-env:/projects/remote": "repository-relative",
      },
    }),
  );
  write(
    NodePath.join(sourceBase, "userdata", "desktop-settings.json"),
    JSON.stringify({
      updateChannel: "nightly",
      updateChannelConfiguredByUser: true,
      mainWindowMaximized: true,
    }),
  );
  write(NodePath.join(sourceBase, "userdata", "attachments", "proof.txt"), "attachment");
  write(NodePath.join(sourceBase, "userdata", "logs", "server.log"), "transient");
  write(NodePath.join(sourceBase, "userdata", "server-runtime.json"), '{"pid":9876}');
  write(
    NodePath.join(sourceBase, "userdata", "secrets", "provider-env-token.bin"),
    "provider-token",
  );
  for (const fileName of [
    "asset-access-signing-key.bin",
    "cloud-link-ed25519-key-pair.bin",
    "server-signing-key.bin",
  ]) {
    write(NodePath.join(sourceBase, "userdata", "secrets", fileName), `nightly-${fileName}`);
    write(NodePath.join(targetBase, "userdata", "secrets", fileName), `alpha-${fileName}`);
  }
  write(NodePath.join(targetBase, "userdata", "environment-id"), "alpha-env\n");
  write(NodePath.join(targetBase, "userdata", "alpha-only.txt"), "old alpha data");
  return { root, sourceBase, targetBase };
}

describe("migrateNightlyDataToAlpha", () => {
  it("resolves isolated default source, destination, and backup paths", () => {
    assert.deepEqual(resolveAlphaDataMigrationPlan({ homeDirectory: "/Users/alice" }), {
      backupRoot: "/Users/alice/.t3-alpha-backups",
      mode: "switch",
      sourceBase: "/Users/alice/.t3",
      sourceDatabase: "/Users/alice/.t3/userdata/state.sqlite",
      sourceUserData: "/Users/alice/.t3/userdata",
      targetBase: "/Users/alice/.t3-alpha",
      targetDatabase: "/Users/alice/.t3-alpha/userdata/state.sqlite",
      targetUserData: "/Users/alice/.t3-alpha/userdata",
    });
  });

  it("detects a live server only when the recorded pid still exists", () => {
    const root = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "t3-alpha-runtime-"));
    try {
      write(NodePath.join(root, "server-runtime.json"), '{"pid":1234}');
      assert.equal(
        readRunningServerPid(root, (pid) => pid === 1234),
        1234,
      );
      assert.isNull(readRunningServerPid(root, () => false));
    } finally {
      NodeFS.rmSync(root, { force: true, recursive: true });
    }
  });

  it("clones durable Nightly data while retaining Alpha identity", async () => {
    const fixture = makeFixture();
    try {
      const result = await runAlphaDataMigration({
        isPidRunning: () => false,
        mode: "clone",
        now: new Date("2026-08-16T00:00:00.000Z"),
        sourceBase: fixture.sourceBase,
        targetBase: fixture.targetBase,
      });
      const targetUserData = NodePath.join(fixture.targetBase, "userdata");

      assert.equal(
        NodeFS.readFileSync(NodePath.join(targetUserData, "environment-id"), "utf8"),
        "alpha-env\n",
      );
      assert.deepEqual(
        JSON.parse(
          NodeFS.readFileSync(NodePath.join(targetUserData, "client-settings.json"), "utf8"),
        ),
        {
          sidebarProjectGroupingMode: "repository",
          sidebarProjectGroupingOverrides: {
            "alpha-env:/projects/t3code": "separate",
            "remote-env:/projects/remote": "repository-relative",
          },
        },
      );
      assert.equal(
        NodeFS.readFileSync(
          NodePath.join(targetUserData, "secrets", "server-signing-key.bin"),
          "utf8",
        ),
        "alpha-server-signing-key.bin",
      );
      assert.equal(
        NodeFS.readFileSync(
          NodePath.join(targetUserData, "secrets", "provider-env-token.bin"),
          "utf8",
        ),
        "provider-token",
      );
      assert.equal(
        NodeFS.readFileSync(NodePath.join(targetUserData, "attachments", "proof.txt"), "utf8"),
        "attachment",
      );
      assert.isFalse(NodeFS.existsSync(NodePath.join(targetUserData, "logs")));
      assert.isFalse(NodeFS.existsSync(NodePath.join(targetUserData, "server-runtime.json")));
      assert.deepEqual(
        JSON.parse(
          NodeFS.readFileSync(NodePath.join(targetUserData, "desktop-settings.json"), "utf8"),
        ),
        { mainWindowMaximized: true },
      );
      assert.equal(
        NodeFS.readFileSync(NodePath.join(result.backupPath!, "alpha-only.txt"), "utf8"),
        "old alpha data",
      );
      assert.equal(
        NodeFS.readFileSync(
          NodePath.join(fixture.sourceBase, "userdata", "attachments", "proof.txt"),
          "utf8",
        ),
        "attachment",
      );
    } finally {
      NodeFS.rmSync(fixture.root, { force: true, recursive: true });
    }
  });

  it("switches to Nightly's existing environment identity", async () => {
    const fixture = makeFixture();
    try {
      await runAlphaDataMigration({
        isPidRunning: () => false,
        mode: "switch",
        now: new Date("2026-08-16T00:00:00.000Z"),
        sourceBase: fixture.sourceBase,
        targetBase: fixture.targetBase,
      });
      const targetUserData = NodePath.join(fixture.targetBase, "userdata");

      assert.equal(
        NodeFS.readFileSync(NodePath.join(targetUserData, "environment-id"), "utf8"),
        "nightly-env\n",
      );
      assert.equal(
        NodeFS.readFileSync(
          NodePath.join(targetUserData, "secrets", "server-signing-key.bin"),
          "utf8",
        ),
        "nightly-server-signing-key.bin",
      );
      assert.deepEqual(
        JSON.parse(
          NodeFS.readFileSync(NodePath.join(targetUserData, "client-settings.json"), "utf8"),
        ),
        {
          sidebarProjectGroupingMode: "repository",
          sidebarProjectGroupingOverrides: {
            "nightly-env:/projects/t3code": "separate",
            "remote-env:/projects/remote": "repository-relative",
          },
        },
      );
    } finally {
      NodeFS.rmSync(fixture.root, { force: true, recursive: true });
    }
  });
});
