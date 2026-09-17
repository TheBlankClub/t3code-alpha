// @effect-diagnostics nodeBuiltinImport:off - Drives the real shell installer through a PTY and a gated HTTP fixture.
import { HostProcessArchitecture, HostProcessPlatform } from "@t3tools/shared/hostProcess";
import * as NodeChildProcess from "node:child_process";
import * as NodeCrypto from "node:crypto";
import * as NodeFSP from "node:fs/promises";
import * as NodeHttp from "node:http";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import { describe, expect, it } from "vite-plus/test";

const run = (command: string, args: string[], options: NodeChildProcess.SpawnOptions) =>
  new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
    const child = NodeChildProcess.spawn(command, args, options);
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));
    child.on("exit", (code) => resolve({ stdout, stderr, code }));
  });

it("installs the latest Alpha release under the Alpha home with a fake release endpoint", async () => {
  const root = await NodeFSP.mkdtemp(NodePath.join(NodeOS.tmpdir(), "t3-alpha-install-"));
  const home = NodePath.join(root, "home");
  const fixtureDir = NodePath.join(root, "fixtures");
  const binDir = NodePath.join(root, "bin");
  const version = "1.2.3-alpha.20260915.1";
  const archive = `t3-alpha-${version}-linux-x64.tar.gz`;
  const archiveRoot = NodePath.join(root, "archive", archive.replace(/\.tar\.gz$/, ""));
  await NodeFSP.mkdir(archiveRoot, { recursive: true });
  await NodeFSP.mkdir(fixtureDir, { recursive: true });
  await NodeFSP.mkdir(binDir, { recursive: true });
  const executable = NodePath.join(archiveRoot, "t3-alpha");
  await NodeFSP.writeFile(executable, `#!/bin/sh\necho ${version}\n`);
  await NodeFSP.chmod(executable, 0o755);
  const archivePath = NodePath.join(fixtureDir, archive);
  const tar = await run(
    "tar",
    ["-czf", archivePath, "-C", NodePath.dirname(archiveRoot), NodePath.basename(archiveRoot)],
    {},
  );
  expect(tar.code, tar.stderr).toBe(0);
  const checksum = NodeCrypto.createHash("sha256")
    .update(await NodeFSP.readFile(archivePath))
    .digest("hex");
  await NodeFSP.writeFile(
    NodePath.join(fixtureDir, "index.json"),
    `{ "tag_name": "v${version}" }\n`,
  );
  await NodeFSP.writeFile(NodePath.join(fixtureDir, "SHA256SUMS"), `${checksum}  ${archive}\n`);
  await NodeFSP.writeFile(
    NodePath.join(binDir, "uname"),
    '#!/bin/sh\ncase "$1" in -s) echo Linux ;; -m) echo x86_64 ;; esac\n',
  );
  await NodeFSP.writeFile(
    NodePath.join(binDir, "curl"),
    `#!/bin/sh\nwhile [ "$#" -gt 0 ]; do case "$1" in -o) output="$2"; shift 2 ;; *) url="$1"; shift ;; esac; done\ncase "$url" in *api.github.com*) cp "$T3_ALPHA_FIXTURES/index.json" "$output" ;; *SHA256SUMS) cp "$T3_ALPHA_FIXTURES/SHA256SUMS" "$output" ;; *${archive}) cp "$T3_ALPHA_FIXTURES/${archive}" "$output" ;; *) exit 1 ;; esac\nprintf 200\n`,
  );
  await Promise.all([
    NodeFSP.chmod(NodePath.join(binDir, "uname"), 0o755),
    NodeFSP.chmod(NodePath.join(binDir, "curl"), 0o755),
  ]);
  const result = await run("sh", ["scripts/install.sh"], {
    cwd: NodePath.resolve(import.meta.dirname, ".."),
    env: {
      ...process.env,
      HOME: home,
      PATH: `${binDir}:${process.env.PATH}`,
      T3_ALPHA_FIXTURES: fixtureDir,
    },
  });
  expect(result.code, `${result.stdout}${result.stderr}`).toBe(0);
  const installed = NodePath.join(home, ".t3-alpha/runtime/versions", version, "t3-alpha");
  expect(await NodeFSP.readFile(installed, "utf8")).toContain(version);
  expect(await NodeFSP.readlink(NodePath.join(home, ".local/bin/t3-alpha"))).toBe(installed);
  await expect(NodeFSP.access(NodePath.join(home, ".t3"))).rejects.toThrow();
  await NodeFSP.rm(root, { recursive: true, force: true });
});

// util-linux's script gives the real installer a terminal without a browser or extra packages.
describe.skipIf(HostProcessPlatform.defaultValue() !== "linux")("installer terminal", () => {
  it.each([false, true])(
    "preserves Alpha download and install behavior (HTTP failure: %s)",
    async (fail) => {
      const root = await NodeFSP.mkdtemp(
        NodePath.join(NodeOS.tmpdir(), "t3-alpha-install-progress-"),
      );
      const version = "1.2.3-alpha.20260915.1";
      const stem = `t3-alpha-${version}-linux-${HostProcessArchitecture.defaultValue()}`;
      const archiveName = `${stem}.tar.gz`;
      let resumeDownload: (() => void) | undefined;
      let sawPartialProgress = false;
      let output = "";
      await NodeFSP.mkdir(NodePath.join(root, stem));
      await NodeFSP.writeFile(
        NodePath.join(root, stem, "t3-alpha"),
        `#!/bin/sh\necho 't3-alpha v${version}'\n`,
        { mode: 0o755 },
      );
      await NodeFSP.writeFile(
        NodePath.join(root, stem, "payload"),
        NodeCrypto.randomBytes(64 * 1024),
      );
      NodeChildProcess.execFileSync("tar", [
        "-czf",
        NodePath.join(root, archiveName),
        "-C",
        root,
        stem,
      ]);
      const archive = await NodeFSP.readFile(NodePath.join(root, archiveName));
      const checksum = NodeCrypto.createHash("sha256").update(archive).digest("hex");
      const server = NodeHttp.createServer((request, response) => {
        if (request.url?.endsWith("/SHA256SUMS")) response.end(`${checksum}  ${archiveName}\n`);
        else if (fail) response.writeHead(500).end();
        else {
          response.writeHead(200, { "Content-Length": archive.length });
          resumeDownload = () => response.end(archive.subarray(Math.floor(archive.length / 2)));
          response.write(archive.subarray(0, Math.floor(archive.length / 2)));
        }
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Expected a TCP listener");
      const installer = NodePath.resolve(import.meta.dirname, "install.sh").replaceAll(
        "'",
        "'\\''",
      );
      const child = NodeChildProcess.spawn("script", ["-qec", `sh '${installer}'`, "/dev/null"], {
        env: {
          ...process.env,
          TERM: "xterm",
          NO_COLOR: "1",
          T3CODE_VERSION: version,
          T3CODE_HOME: NodePath.join(root, "home"),
          T3CODE_INSTALL_BIN_DIR: NodePath.join(root, "bin"),
          T3CODE_RELEASE_BASE_URL: `http://127.0.0.1:${address.port}`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      const collect = (chunk: Buffer) => {
        output += chunk.toString();
        if (!sawPartialProgress && /\b[1-9]\d?%/.test(output)) {
          sawPartialProgress = true;
          resumeDownload?.();
        }
      };
      child.stdout.on("data", collect);
      child.stderr.on("data", collect);
      try {
        const code = await new Promise<number | null>((resolve, reject) => {
          child.on("error", reject);
          child.on("close", resolve);
        });
        const versions = NodePath.join(root, "home/runtime/versions");
        if (fail) {
          expect(code).not.toBe(0);
          expect(output).toContain("500");
          expect(output).not.toContain("100%");
          expect(output).not.toContain("Installed T3 Code Alpha");
          expect(await NodeFSP.readdir(versions)).toEqual([]);
        } else {
          expect(code).toBe(0);
          expect(sawPartialProgress).toBe(true);
          expect(output).toContain("100%");
          expect(output).toContain("0.1 / 0.1 MB");
          expect(output).toContain(`Installed T3 Code Alpha ${version}`);
          expect(
            await NodeFSP.readFile(NodePath.join(versions, version, ".install-complete"), "utf8"),
          ).toBe(`${version}\n`);
          expect(
            NodeChildProcess.execFileSync(NodePath.join(root, "bin/t3-alpha"), ["--version"], {
              encoding: "utf8",
            }).trim(),
          ).toBe(`t3-alpha v${version}`);
          expect(await NodeFSP.readdir(versions)).toEqual([version]);
        }
      } finally {
        if (child.exitCode === null) child.kill();
        server.closeAllConnections();
        await new Promise<void>((resolve) => server.close(() => resolve()));
        await NodeFSP.rm(root, { recursive: true, force: true });
      }
    },
  );
});
