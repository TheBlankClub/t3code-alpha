// @effect-diagnostics nodeBuiltinImport:off
import * as NodeChildProcess from "node:child_process";
import * as NodeFSP from "node:fs/promises";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import { expect, it } from "vite-plus/test";

const collect = (stream: NodeJS.ReadableStream) =>
  new Promise<string>((resolve, reject) => {
    let output = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      output += chunk;
    });
    stream.on("end", () => resolve(output));
    stream.on("error", reject);
  });

// oxlint-disable-next-line t3code/no-global-process-runtime -- Native subprocess fixture runs only on POSIX.
it.skipIf(process.platform === "win32")(
  "publishes platform tarballs before the launcher and preserves npm stdin",
  async () => {
    const root = await NodeFSP.mkdtemp(NodePath.join(NodeOS.tmpdir(), "t3-alpha-publish-"));
    const packagesDir = NodePath.join(root, "packages");
    const binDir = NodePath.join(root, "bin");
    const callsPath = NodePath.join(root, "npm-calls.jsonl");
    await NodeFSP.mkdir(packagesDir, { recursive: true });
    await NodeFSP.mkdir(binDir, { recursive: true });
    for (const name of [
      "t3code-alpha-linux-x64.tgz",
      "t3code-alpha-darwin-arm64.tgz",
      "t3code-alpha.tgz",
    ]) {
      await NodeFSP.writeFile(NodePath.join(packagesDir, name), "fixture\n");
    }
    const fakeNpm = NodePath.join(binDir, "npm");
    await NodeFSP.writeFile(
      fakeNpm,
      `#!${process.execPath}
const fs = require("node:fs");
const input = fs.readFileSync(0, "utf8");
fs.appendFileSync(process.env.T3_ALPHA_NPM_CALLS, JSON.stringify({ args: process.argv.slice(2), input }) + "\\n");
`,
    );
    await NodeFSP.chmod(fakeNpm, 0o755);

    const child = NodeChildProcess.spawn(
      process.execPath,
      ["apps/server/scripts/cli.ts", "publish", "--prebuilt-dir", packagesDir, "--dry-run"],
      {
        cwd: NodePath.resolve(import.meta.dirname, "../../.."),
        env: {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH ?? ""}`,
          T3_ALPHA_NPM_CALLS: callsPath,
        },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    child.stdin.end("interactive npm token\n");
    const [stdout, stderr, exitCode] = await Promise.all([
      collect(child.stdout),
      collect(child.stderr),
      new Promise<number | null>((resolve) => child.on("exit", resolve)),
    ]);
    expect(exitCode, `${stdout}${stderr}`).toBe(0);

    const calls = (await NodeFSP.readFile(callsPath, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { args: string[]; input: string });
    expect(calls.map((call) => NodePath.basename(call.args.at(-1)!))).toEqual([
      "t3code-alpha-darwin-arm64.tgz",
      "t3code-alpha-linux-x64.tgz",
      "t3code-alpha.tgz",
    ]);
    expect(calls[0]?.args.slice(0, -1)).toEqual([
      "publish",
      "--access",
      "public",
      "--tag",
      "latest",
      "--dry-run",
    ]);
    expect(calls[0]?.input).toBe("interactive npm token\n");
    await NodeFSP.rm(root, { recursive: true, force: true });
  },
);
