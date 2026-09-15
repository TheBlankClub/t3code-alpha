// @effect-diagnostics nodeBuiltinImport:off
import * as ChildProcess from "node:child_process";
import * as Fs from "node:fs/promises";
import * as Os from "node:os";
import * as Path from "node:path";
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

it.skipIf(process.platform === "win32")(
  "publishes platform tarballs before the launcher and preserves npm stdin",
  async () => {
    const root = await Fs.mkdtemp(Path.join(Os.tmpdir(), "t3-alpha-publish-"));
    const packagesDir = Path.join(root, "packages");
    const binDir = Path.join(root, "bin");
    const callsPath = Path.join(root, "npm-calls.jsonl");
    await Fs.mkdir(packagesDir, { recursive: true });
    await Fs.mkdir(binDir, { recursive: true });
    for (const name of [
      "t3code-alpha-linux-x64.tgz",
      "t3code-alpha-darwin-arm64.tgz",
      "t3code-alpha.tgz",
    ]) {
      await Fs.writeFile(Path.join(packagesDir, name), "fixture\n");
    }
    const fakeNpm = Path.join(binDir, "npm");
    await Fs.writeFile(
      fakeNpm,
      `#!${process.execPath}
const fs = require("node:fs");
const input = fs.readFileSync(0, "utf8");
fs.appendFileSync(process.env.T3_ALPHA_NPM_CALLS, JSON.stringify({ args: process.argv.slice(2), input }) + "\\n");
`,
    );
    await Fs.chmod(fakeNpm, 0o755);

    const child = ChildProcess.spawn(
      process.execPath,
      ["apps/server/scripts/cli.ts", "publish", "--prebuilt-dir", packagesDir, "--dry-run"],
      {
        cwd: Path.resolve(import.meta.dirname, "../../.."),
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

    const calls = (await Fs.readFile(callsPath, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { args: string[]; input: string });
    expect(calls.map((call) => Path.basename(call.args.at(-1)!))).toEqual([
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
    await Fs.rm(root, { recursive: true, force: true });
  },
);
