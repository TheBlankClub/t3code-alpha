/**
 * The install-time and first-run code of the `t3code-alpha` npm package.
 *
 * The package ships no executable. It downloads the release archive for the
 * host from the GitHub release the same workflow published, verifies it
 * against that release's `SHA256SUMS`, and extracts it beside the package.
 * One npm package therefore serves every supported platform without carrying
 * every platform's bytes, and the bytes a user runs are the release's own.
 *
 * Emitted verbatim into the package as `install.js`, so it must stay plain
 * Node with no imports beyond `node:`: a postinstall script runs before
 * anything this repo publishes is resolvable.
 */

import { CLI_ARCHIVE_PLATFORM_KEYS } from "./cliRelease.ts";
import { ALPHA_DISTRIBUTION } from "./alphaDistribution.ts";

/**
 * Where the extracted release lands inside the installed package. Kept out of
 * `files` in the manifest: npm packs the directory as absent and the install
 * creates it, so a repacked tarball never carries one platform's binary.
 */
export const NPM_CLI_RUNTIME_DIR = "runtime";

/** Written after extraction succeeds; its content is the version installed. */
const NPM_CLI_STAMP_FILE = ".installed";

export function npmCliInstallerScript(): string {
  const binaryName = ALPHA_DISTRIBUTION.serverBinaryName;
  const repository = ALPHA_DISTRIBUTION.serverReleaseRepository;
  const artifactPrefix = ALPHA_DISTRIBUTION.serverReleaseArtifactPrefix;
  return `// Generated from packages/shared/src/npmCliInstaller.ts. Do not edit.
const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } = require("node:fs");
const { join, dirname } = require("node:path");
const { tmpdir } = require("node:os");

const PLATFORM_KEYS = ${JSON.stringify([...CLI_ARCHIVE_PLATFORM_KEYS])};
const RUNTIME_DIR = ${JSON.stringify(NPM_CLI_RUNTIME_DIR)};
const STAMP_FILE = ${JSON.stringify(NPM_CLI_STAMP_FILE)};
const BINARY_NAME = ${JSON.stringify(binaryName)};
const REPOSITORY = ${JSON.stringify(repository)};
const ARTIFACT_PREFIX = ${JSON.stringify(artifactPrefix)};
const CHECKSUMS_FILE = "SHA256SUMS";
const DEFAULT_BASE_URL = "https://github.com/" + REPOSITORY + "/releases/download";

const packageRoot = __dirname;
const version = require(join(packageRoot, "package.json")).version;

function platformKey() {
  const key = process.platform + "-" + process.arch;
  return PLATFORM_KEYS.includes(key) ? key : undefined;
}

function runtimeRoot() {
  return join(packageRoot, RUNTIME_DIR);
}

function executablePath() {
  return join(runtimeRoot(), BINARY_NAME);
}

/** True when a previous install of this exact version already landed. */
function isInstalled() {
  const stamp = join(runtimeRoot(), STAMP_FILE);
  if (!existsSync(stamp) || !existsSync(executablePath())) return false;
  try {
    return readFileSync(stamp, "utf8").trim() === version;
  } catch {
    return false;
  }
}

async function fetchAsset(url, what) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(what + " failed: " + response.status + " " + response.statusText + " (" + url + ")");
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Lines are "<sha256>  <file>"; a leading "*" marks binary mode. */
function parseChecksums(text) {
  const checksums = new Map();
  for (const line of text.split(/\\r?\\n/)) {
    const match = /^([0-9a-fA-F]{64})\\s+\\*?(\\S.*)$/.exec(line.trim());
    if (match) checksums.set(match[2], match[1].toLowerCase());
  }
  return checksums;
}

async function install() {
  const key = platformKey();
  if (key === undefined) {
    throw new Error(
      "No " + BINARY_NAME + " build for " + process.platform + "-" + process.arch + ". " +
        "T3 Code Alpha supports " + PLATFORM_KEYS.join(", ") + "."
    );
  }
  const base = (process.env.T3CODE_RELEASE_BASE_URL || "").trim() || DEFAULT_BASE_URL;
  const baseUrl = base.replace(/\\/+$/, "") + "/v" + version;
  const fileName = ARTIFACT_PREFIX + "-" + version + "-" + key + ".tar.gz";

  const checksums = parseChecksums(
    (await fetchAsset(baseUrl + "/" + CHECKSUMS_FILE, "Downloading checksums")).toString("utf8")
  );
  const expected = checksums.get(fileName);
  if (expected === undefined) {
    throw new Error(fileName + " is not listed in " + CHECKSUMS_FILE + " for v" + version + ".");
  }

  const archive = await fetchAsset(baseUrl + "/" + fileName, "Downloading " + fileName);
  const actual = createHash("sha256").update(archive).digest("hex");
  if (actual !== expected) {
    throw new Error("Checksum mismatch for " + fileName + ": expected " + expected + ", got " + actual + ".");
  }

  // Extract into a scratch directory, then swap it in, so an interrupted
  // install never leaves a half-written runtime that looks usable.
  const staging = mkdtempSync(join(tmpdir(), "t3code-alpha-install-"));
  try {
    const archivePath = join(staging, fileName);
    writeFileSync(archivePath, archive);
    const extracted = join(staging, "runtime");
    mkdirSync(extracted, { recursive: true });
    // The archive wraps everything in one directory named after its stem.
    const tar = spawnSync("tar", ["-xf", archivePath, "-C", extracted, "--strip-components=1"], {
      stdio: "inherit",
    });
    if (tar.error) throw tar.error;
    if (tar.status !== 0) throw new Error("tar exited with code " + tar.status + ".");
    writeFileSync(join(extracted, STAMP_FILE), version + "\\n");
    rmSync(runtimeRoot(), { recursive: true, force: true });
    mkdirSync(dirname(runtimeRoot()), { recursive: true });
    spawnSync("mv", [extracted, runtimeRoot()], { stdio: "inherit" });
    if (!existsSync(executablePath())) {
      throw new Error("Install finished but " + executablePath() + " is missing.");
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

module.exports = { install, isInstalled, executablePath, platformKey };

if (require.main === module) {
  // A failed postinstall must not fail the whole \`npm install\`: the launcher
  // retries on first run, which also covers --ignore-scripts installs.
  const settled = isInstalled() ? Promise.resolve() : install();
  settled.catch((error) => {
    process.stderr.write(
      "\\n" + BINARY_NAME + ": could not download the executable during install.\\n" +
        "  " + (error && error.message ? error.message : String(error)) + "\\n" +
        "  It will be retried the first time you run " + BINARY_NAME + ".\\n\\n"
    );
  });
}
`;
}

/**
 * The package's `bin` entry. Execs the downloaded executable, installing it
 * first when the postinstall was skipped (`--ignore-scripts`) or failed, so a
 * scriptless install costs a slow first run rather than a broken command.
 *
 * Signals, stdio, the IPC channel boot-service launchers talk over, and the
 * exit status all forward to the child, so this wrapper stays invisible.
 */
export function npmCliLauncherScript(): string {
  const binaryName = ALPHA_DISTRIBUTION.serverBinaryName;
  return `#!/usr/bin/env node
// Generated from packages/shared/src/npmCliInstaller.ts. Do not edit.
"use strict";
const { spawn } = require("node:child_process");
const { constants } = require("node:os");
const { join } = require("node:path");
const { install, isInstalled, executablePath } = require(join(__dirname, "..", "install.js"));

const BINARY_NAME = ${JSON.stringify(binaryName)};

function exec() {
  const ipc = process.send !== undefined;
  const child = spawn(executablePath(), process.argv.slice(2), {
    stdio: ipc ? ["inherit", "inherit", "inherit", "ipc"] : "inherit",
  });
  const fail = (error) => {
    if (!error) return;
    process.stderr.write(BINARY_NAME + ": " + error.message + "\\n");
    child.kill("SIGTERM");
    process.exitCode = 1;
  };
  if (ipc) {
    process.on("message", (message) => { if (child.connected) child.send(message, fail); });
    child.on("message", (message) => { if (process.connected) process.send(message, fail); });
    process.on("disconnect", () => { if (child.connected) child.disconnect(); });
  }
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(signal, () => child.kill(signal));
  }
  child.on("error", (error) => { fail(error); process.exit(1); });
  child.on("exit", (code, signal) => process.exit(code ?? 128 + (constants.signals[signal] || 1)));
}

if (isInstalled()) {
  exec();
} else {
  process.stderr.write(BINARY_NAME + ": downloading the executable for this platform...\\n");
  install().then(exec, (error) => {
    process.stderr.write(
      BINARY_NAME + ": " + (error && error.message ? error.message : String(error)) + "\\n"
    );
    process.exit(1);
  });
}
`;
}
