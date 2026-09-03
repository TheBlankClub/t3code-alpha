#!/usr/bin/env node

// @effect-diagnostics nodeBuiltinImport:off globalDate:off - This is a host-level local filesystem migration utility.
import * as NodeFS from "node:fs";
import * as NodeFSP from "node:fs/promises";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import * as NodeSqlite from "node:sqlite";

import * as Effect from "effect/Effect";
import * as SqlClient from "effect/unstable/sql/SqlClient";

import { runMigrations } from "../src/persistence/Migrations.ts";
import * as NodeSqliteClient from "@t3tools/shared/nodeSqliteClient";

export type AlphaDataMigrationMode = "clone" | "switch";

export interface AlphaDataMigrationPlan {
  readonly backupRoot: string;
  readonly mode: AlphaDataMigrationMode;
  readonly sourceBase: string;
  readonly sourceDatabase: string;
  readonly sourceUserData: string;
  readonly targetBase: string;
  readonly targetDatabase: string;
  readonly targetUserData: string;
}

export interface AlphaDataMigrationResult {
  readonly backupPath: string | null;
  readonly databaseCounts: Readonly<Record<string, number>>;
  readonly mode: AlphaDataMigrationMode;
  readonly targetUserData: string;
}

export interface RunAlphaDataMigrationOptions {
  readonly homeDirectory?: string;
  readonly isPidRunning?: (pid: number) => boolean;
  readonly mode?: AlphaDataMigrationMode;
  readonly now?: Date;
  readonly sourceBase?: string;
  readonly targetBase?: string;
}

const IDENTITY_SECRET_FILES = [
  "asset-access-signing-key.bin",
  "cloud-link-ed25519-key-pair.bin",
  "server-signing-key.bin",
] as const;

const SKIPPED_USERDATA_ENTRIES = new Set([
  "clerk-tokens.json",
  "logs",
  "saved-environments.json",
  "server-runtime.json",
  "state.sqlite",
  "state.sqlite-shm",
  "state.sqlite-wal",
  "usage-model-rates.json",
  "usage-scan-cache.json",
]);

const DATABASE_COUNT_TABLES = [
  ["projects", "projection_projects"],
  ["threads", "projection_threads"],
  ["turns", "projection_turns"],
  ["messages", "projection_thread_messages"],
  ["events", "orchestration_events"],
] as const;

const timestamp = (date: Date): string =>
  date
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");

export function resolveAlphaDataMigrationPlan(
  options: RunAlphaDataMigrationOptions = {},
): AlphaDataMigrationPlan {
  const homeDirectory = NodePath.resolve(options.homeDirectory ?? NodeOS.homedir());
  const sourceBase = NodePath.resolve(options.sourceBase ?? NodePath.join(homeDirectory, ".t3"));
  const targetBase = NodePath.resolve(
    options.targetBase ?? NodePath.join(homeDirectory, ".t3-alpha"),
  );
  const sourceUserData = NodePath.join(sourceBase, "userdata");
  const targetUserData = NodePath.join(targetBase, "userdata");

  if (sourceBase === targetBase || sourceUserData === targetUserData) {
    throw new Error("Nightly source and Alpha destination must be different directories.");
  }

  return {
    backupRoot: `${targetBase}-backups`,
    mode: options.mode ?? "switch",
    sourceBase,
    sourceDatabase: NodePath.join(sourceUserData, "state.sqlite"),
    sourceUserData,
    targetBase,
    targetDatabase: NodePath.join(targetUserData, "state.sqlite"),
    targetUserData,
  };
}

function processIsRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function readRunningServerPid(
  userDataPath: string,
  isPidRunning: (pid: number) => boolean = processIsRunning,
): number | null {
  const runtimePath = NodePath.join(userDataPath, "server-runtime.json");
  if (!NodeFS.existsSync(runtimePath)) return null;

  try {
    const runtime = JSON.parse(NodeFS.readFileSync(runtimePath, "utf8")) as {
      readonly pid?: unknown;
    };
    return typeof runtime.pid === "number" &&
      Number.isInteger(runtime.pid) &&
      isPidRunning(runtime.pid)
      ? runtime.pid
      : null;
  } catch {
    return null;
  }
}

function assertSourceExists(plan: AlphaDataMigrationPlan): void {
  if (!NodeFS.existsSync(plan.sourceDatabase)) {
    throw new Error(`Nightly database does not exist at '${plan.sourceDatabase}'.`);
  }
  if (!NodeFS.statSync(plan.sourceDatabase).isFile()) {
    throw new Error(`Nightly database path is not a file: '${plan.sourceDatabase}'.`);
  }
}

function assertAppsStopped(
  plan: AlphaDataMigrationPlan,
  isPidRunning: (pid: number) => boolean,
): void {
  const running = [
    ["Nightly", plan.sourceUserData],
    ["Alpha", plan.targetUserData],
  ] as const;

  for (const [label, userDataPath] of running) {
    const pid = readRunningServerPid(userDataPath, isPidRunning);
    if (pid !== null) {
      throw new Error(
        `${label} is still running (server pid ${pid}). Quit both desktop apps completely before applying the migration.`,
      );
    }
  }
}

function readDatabaseCounts(databasePath: string): Readonly<Record<string, number>> {
  const database = new NodeSqlite.DatabaseSync(databasePath, { readOnly: true });
  try {
    return Object.fromEntries(
      DATABASE_COUNT_TABLES.map(([label, table]) => {
        const exists = database
          .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
          .get(table);
        if (!exists) return [label, 0];
        const row = database.prepare(`SELECT count(*) AS count FROM ${table}`).get() as {
          readonly count: number | bigint;
        };
        return [label, Number(row.count)];
      }),
    );
  } finally {
    database.close();
  }
}

async function copyDurableUserData(sourceUserData: string, stagingUserData: string): Promise<void> {
  await NodeFSP.cp(sourceUserData, stagingUserData, {
    filter: (source) => {
      const relativePath = NodePath.relative(sourceUserData, source);
      if (!relativePath) return true;
      const rootEntry = relativePath.split(NodePath.sep)[0];
      return rootEntry !== undefined && !SKIPPED_USERDATA_ENTRIES.has(rootEntry);
    },
    preserveTimestamps: true,
    recursive: true,
  });
}

async function copyIfPresent(source: string, destination: string): Promise<void> {
  if (!NodeFS.existsSync(source)) return;
  await NodeFSP.mkdir(NodePath.dirname(destination), { recursive: true });
  await NodeFSP.copyFile(source, destination);
}

async function preserveAlphaIdentity(
  targetUserData: string,
  stagingUserData: string,
): Promise<void> {
  const requiredPaths = [
    NodePath.join(targetUserData, "environment-id"),
    ...IDENTITY_SECRET_FILES.map((fileName) => NodePath.join(targetUserData, "secrets", fileName)),
  ];
  const missing = requiredPaths.filter((path) => !NodeFS.existsSync(path));
  if (missing.length > 0) {
    throw new Error(
      `Clone mode requires an initialized Alpha identity. Missing: ${missing.join(", ")}`,
    );
  }

  await copyIfPresent(
    NodePath.join(targetUserData, "environment-id"),
    NodePath.join(stagingUserData, "environment-id"),
  );
  for (const fileName of IDENTITY_SECRET_FILES) {
    await copyIfPresent(
      NodePath.join(targetUserData, "secrets", fileName),
      NodePath.join(stagingUserData, "secrets", fileName),
    );
  }
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function rekeyAlphaClientSettings(
  sourceUserData: string,
  targetUserData: string,
  stagingUserData: string,
): Promise<void> {
  const settingsPath = NodePath.join(stagingUserData, "client-settings.json");
  if (!NodeFS.existsSync(settingsPath)) return;

  const parsed: unknown = JSON.parse(await NodeFSP.readFile(settingsPath, "utf8"));
  if (!isJsonObject(parsed) || !isJsonObject(parsed.sidebarProjectGroupingOverrides)) return;

  const sourceEnvironmentId = (
    await NodeFSP.readFile(NodePath.join(sourceUserData, "environment-id"), "utf8")
  ).trim();
  const targetEnvironmentId = (
    await NodeFSP.readFile(NodePath.join(targetUserData, "environment-id"), "utf8")
  ).trim();
  if (!sourceEnvironmentId || !targetEnvironmentId || sourceEnvironmentId === targetEnvironmentId) {
    return;
  }

  const sourcePrefix = `${sourceEnvironmentId}:`;
  const overrides = parsed.sidebarProjectGroupingOverrides;
  const nextOverrides = { ...overrides };
  let changed = false;

  for (const [key, value] of Object.entries(overrides)) {
    if (!key.startsWith(sourcePrefix)) continue;

    const targetKey = `${targetEnvironmentId}:${key.slice(sourcePrefix.length)}`;
    delete nextOverrides[key];
    if (!Object.prototype.hasOwnProperty.call(nextOverrides, targetKey)) {
      nextOverrides[targetKey] = value;
    }
    changed = true;
  }

  if (!changed) return;
  parsed.sidebarProjectGroupingOverrides = nextOverrides;
  await NodeFSP.writeFile(settingsPath, `${JSON.stringify(parsed)}\n`);
}

async function normalizeAlphaDesktopSettings(stagingUserData: string): Promise<void> {
  const settingsPath = NodePath.join(stagingUserData, "desktop-settings.json");
  if (!NodeFS.existsSync(settingsPath)) return;

  const parsed = JSON.parse(await NodeFSP.readFile(settingsPath, "utf8")) as Record<
    string,
    unknown
  >;
  delete parsed.updateChannel;
  delete parsed.updateChannelConfiguredByUser;
  await NodeFSP.writeFile(settingsPath, `${JSON.stringify(parsed, null, 2)}\n`, { mode: 0o600 });
}

async function migrateAndVerifyDatabase(
  sourceDatabase: string,
  stagingDatabase: string,
  mode: AlphaDataMigrationMode,
): Promise<Readonly<Record<string, number>>> {
  const source = new NodeSqlite.DatabaseSync(sourceDatabase, { readOnly: true });
  try {
    await NodeSqlite.backup(source, stagingDatabase);
  } finally {
    source.close();
  }

  await Effect.runPromise(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      yield* sql.unsafe("PRAGMA foreign_keys = ON").unprepared;
      yield* runMigrations();
      if (mode === "clone") {
        yield* sql`DELETE FROM auth_pairing_links`;
        yield* sql`DELETE FROM auth_sessions`;
      }
    }).pipe(Effect.provide(NodeSqliteClient.layer({ filename: stagingDatabase }))),
  );

  const database = new NodeSqlite.DatabaseSync(stagingDatabase);
  try {
    const check = database.prepare("PRAGMA quick_check").get() as { readonly quick_check: string };
    if (check.quick_check !== "ok") {
      throw new Error(`Migrated database failed SQLite quick_check: ${check.quick_check}`);
    }
    database.exec("PRAGMA journal_mode = WAL");
  } finally {
    database.close();
  }
  await NodeFSP.chmod(stagingDatabase, 0o600);
  return readDatabaseCounts(stagingDatabase);
}

async function installStagedUserData(
  plan: AlphaDataMigrationPlan,
  stagingUserData: string,
  now: Date,
): Promise<string | null> {
  const backupPath = NodePath.join(plan.backupRoot, timestamp(now), "userdata");
  let targetWasBackedUp = false;

  try {
    await NodeFSP.mkdir(plan.targetBase, { recursive: true });
    if (NodeFS.existsSync(plan.targetUserData)) {
      await NodeFSP.mkdir(NodePath.dirname(backupPath), { recursive: true });
      await NodeFSP.rename(plan.targetUserData, backupPath);
      targetWasBackedUp = true;
    }
    await NodeFSP.rename(stagingUserData, plan.targetUserData);
    return targetWasBackedUp ? backupPath : null;
  } catch (cause) {
    if (targetWasBackedUp && !NodeFS.existsSync(plan.targetUserData)) {
      await NodeFSP.rename(backupPath, plan.targetUserData).catch(() => undefined);
    }
    throw cause;
  }
}

export async function runAlphaDataMigration(
  options: RunAlphaDataMigrationOptions = {},
): Promise<AlphaDataMigrationResult> {
  const plan = resolveAlphaDataMigrationPlan(options);
  const isPidRunning = options.isPidRunning ?? processIsRunning;
  const now = options.now ?? new Date();
  assertSourceExists(plan);
  assertAppsStopped(plan, isPidRunning);

  const stagingRoot = await NodeFSP.mkdtemp(
    NodePath.join(
      NodePath.dirname(plan.targetBase),
      `.${NodePath.basename(plan.targetBase)}-migration-`,
    ),
  );
  const stagingUserData = NodePath.join(stagingRoot, "userdata");

  try {
    await copyDurableUserData(plan.sourceUserData, stagingUserData);
    await NodeFSP.mkdir(stagingUserData, { recursive: true });
    if (plan.mode === "clone") {
      await preserveAlphaIdentity(plan.targetUserData, stagingUserData);
      await rekeyAlphaClientSettings(plan.sourceUserData, plan.targetUserData, stagingUserData);
    }
    await normalizeAlphaDesktopSettings(stagingUserData);
    const databaseCounts = await migrateAndVerifyDatabase(
      plan.sourceDatabase,
      NodePath.join(stagingUserData, "state.sqlite"),
      plan.mode,
    );
    const backupPath = await installStagedUserData(plan, stagingUserData, now);
    return { backupPath, databaseCounts, mode: plan.mode, targetUserData: plan.targetUserData };
  } finally {
    await NodeFSP.rm(stagingRoot, { force: true, recursive: true });
  }
}

function readFlag(args: ReadonlyArray<string>, name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}.`);
  return value;
}

function parseMode(value: string | undefined): AlphaDataMigrationMode {
  if (value === undefined || value === "switch") return "switch";
  if (value === "clone") return "clone";
  throw new Error(`Unsupported migration mode '${value}'. Use 'switch' or 'clone'.`);
}

function printPlan(plan: AlphaDataMigrationPlan): void {
  const counts = readDatabaseCounts(plan.sourceDatabase);
  process.stdout.write(
    [
      "Nightly to Alpha data migration (dry run)",
      `Mode: ${plan.mode}`,
      `Source: ${plan.sourceUserData}`,
      `Destination: ${plan.targetUserData}`,
      `Destination backups: ${plan.backupRoot}`,
      `Database content: ${JSON.stringify(counts)}`,
      "Copies chats, projects, settings, keybindings, attachments, and provider secrets.",
      "Skips runtime files, logs, caches, Clerk tokens, and encrypted saved environments.",
      "Electron Local Storage and browser partitions are intentionally not copied.",
      "",
      `Quit Nightly and Alpha, then rerun with --apply --mode ${plan.mode} to perform the migration.`,
      "",
    ].join("\n"),
  );
}

function printHelp(): void {
  process.stdout.write(`Usage: node apps/server/scripts/migrate-nightly-data-to-alpha.ts [options]

Options:
  --apply                 Perform the migration. Without this flag, only print a dry run.
  --mode switch|clone     switch preserves Nightly's environment identity; clone keeps Alpha's.
  --source-base <path>    Override the Nightly base directory (default: ~/.t3).
  --target-base <path>    Override the Alpha base directory (default: ~/.t3-alpha).
  --help                  Show this help.

Use switch when Alpha replaces Nightly and Nightly will no longer run.
Use clone when both applications must keep running independently; remote clients must be paired again.
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    printHelp();
    return;
  }

  const sourceBase = readFlag(args, "--source-base");
  const targetBase = readFlag(args, "--target-base");
  const options: RunAlphaDataMigrationOptions = {
    mode: parseMode(readFlag(args, "--mode")),
    ...(sourceBase === undefined ? {} : { sourceBase }),
    ...(targetBase === undefined ? {} : { targetBase }),
  };
  const plan = resolveAlphaDataMigrationPlan(options);
  assertSourceExists(plan);

  if (!args.includes("--apply")) {
    printPlan(plan);
    return;
  }

  const result = await runAlphaDataMigration(options);
  process.stdout.write(
    [
      `Migrated Nightly data to ${result.targetUserData}.`,
      `Database content: ${JSON.stringify(result.databaseCounts)}`,
      result.backupPath
        ? `Previous Alpha data is backed up at ${result.backupPath}.`
        : "Alpha had no previous userdata directory to back up.",
      result.mode === "switch"
        ? "Switch mode preserved Nightly's environment identity. Do not run Nightly and Alpha concurrently."
        : "Clone mode preserved Alpha's identity. Pair remote clients with Alpha again.",
      "",
    ].join("\n"),
  );
}

if (import.meta.main) {
  main().catch((cause: unknown) => {
    process.stderr.write(`${cause instanceof Error ? cause.message : String(cause)}\n`);
    process.exitCode = 1;
  });
}
