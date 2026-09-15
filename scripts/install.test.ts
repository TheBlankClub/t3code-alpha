// @effect-diagnostics nodeBuiltinImport:off
import * as ChildProcess from "node:child_process";
import { createHash } from "node:crypto";
import * as Fs from "node:fs/promises";
import * as Os from "node:os";
import * as Path from "node:path";
import { expect, it } from "vite-plus/test";

const run = (command: string, args: string[], options: ChildProcess.SpawnOptions) =>
  new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
    const child = ChildProcess.spawn(command, args, options);
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));
    child.on("exit", (code) => resolve({ stdout, stderr, code }));
  });

it("installs the latest Alpha release under the Alpha home with a fake release endpoint", async () => {
  const root = await Fs.mkdtemp(Path.join(Os.tmpdir(), "t3-alpha-install-"));
  const home = Path.join(root, "home");
  const fixtureDir = Path.join(root, "fixtures");
  const binDir = Path.join(root, "bin");
  const version = "1.2.3-alpha.20260915.1";
  const archive = `t3-alpha-${version}-linux-x64.tar.gz`;
  const archiveRoot = Path.join(root, "archive", archive.replace(/\.tar\.gz$/, ""));
  await Fs.mkdir(archiveRoot, { recursive: true });
  await Fs.mkdir(fixtureDir, { recursive: true });
  await Fs.mkdir(binDir, { recursive: true });
  const executable = Path.join(archiveRoot, "t3-alpha");
  await Fs.writeFile(executable, `#!/bin/sh\necho ${version}\n`);
  await Fs.chmod(executable, 0o755);
  const archivePath = Path.join(fixtureDir, archive);
  const tar = await run(
    "tar",
    ["-czf", archivePath, "-C", Path.dirname(archiveRoot), Path.basename(archiveRoot)],
    {},
  );
  expect(tar.code, tar.stderr).toBe(0);
  const checksum = createHash("sha256")
    .update(await Fs.readFile(archivePath))
    .digest("hex");
  await Fs.writeFile(Path.join(fixtureDir, "index.json"), `{ "tag_name": "v${version}" }\n`);
  await Fs.writeFile(Path.join(fixtureDir, "SHA256SUMS"), `${checksum}  ${archive}\n`);
  await Fs.writeFile(
    Path.join(binDir, "uname"),
    '#!/bin/sh\ncase "$1" in -s) echo Linux ;; -m) echo x86_64 ;; esac\n',
  );
  await Fs.writeFile(
    Path.join(binDir, "curl"),
    `#!/bin/sh\nwhile [ \"$#\" -gt 0 ]; do case \"$1\" in -o) output=\"$2\"; shift 2 ;; *) url=\"$1\"; shift ;; esac; done\ncase \"$url\" in *api.github.com*) cp \"$T3_ALPHA_FIXTURES/index.json\" \"$output\" ;; *SHA256SUMS) cp \"$T3_ALPHA_FIXTURES/SHA256SUMS\" \"$output\" ;; *${archive}) cp \"$T3_ALPHA_FIXTURES/${archive}\" \"$output\" ;; *) exit 1 ;; esac\nprintf 200\n`,
  );
  await Promise.all([
    Fs.chmod(Path.join(binDir, "uname"), 0o755),
    Fs.chmod(Path.join(binDir, "curl"), 0o755),
  ]);

  const result = await run("sh", ["scripts/install.sh"], {
    cwd: Path.resolve(import.meta.dirname, ".."),
    env: {
      ...process.env,
      HOME: home,
      PATH: `${binDir}:${process.env.PATH}`,
      T3_ALPHA_FIXTURES: fixtureDir,
    },
  });
  expect(result.code, `${result.stdout}${result.stderr}`).toBe(0);
  const installed = Path.join(home, ".t3-alpha/runtime/versions", version, "t3-alpha");
  expect(await Fs.readFile(installed, "utf8")).toContain(version);
  expect(await Fs.readlink(Path.join(home, ".local/bin/t3-alpha"))).toBe(installed);
  await expect(Fs.access(Path.join(home, ".t3"))).rejects.toThrow();
  await Fs.rm(root, { recursive: true, force: true });
});
