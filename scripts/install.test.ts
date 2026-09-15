// @effect-diagnostics nodeBuiltinImport:off
import * as NodeChildProcess from "node:child_process";
import * as NodeCrypto from "node:crypto";
import * as NodeFSP from "node:fs/promises";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import { expect, it } from "vite-plus/test";

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
