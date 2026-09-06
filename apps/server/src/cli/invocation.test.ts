import { assert, it } from "@effect/vitest";

import { formatCliCommand } from "./invocation.ts";

it("formats package runner commands from their cache entry paths", () => {
  for (const [entryPath, expected] of [
    [
      "/home/theo/.npm/_npx/abc123/node_modules/t3code-alpha/dist/bin.mjs",
      "npx t3code-alpha@latest serve",
    ],
    [
      "C:\\Users\\theo\\AppData\\Local\\npm-cache\\_npx\\abc\\node_modules\\t3\\dist\\bin.mjs",
      "npx t3code-alpha@latest serve",
    ],
    [
      "/home/theo/.cache/pnpm/dlx/abc/node_modules/t3code-alpha/dist/bin.mjs",
      "pnpm dlx t3code-alpha@latest serve",
    ],
    [
      "/home/theo/.local/share/pnpm/.pnpm/dlx/abc/node_modules/t3code-alpha/dist/bin.mjs",
      "pnpm dlx t3code-alpha@latest serve",
    ],
    [
      "C:\\Users\\theo\\AppData\\Local\\pnpm-cache\\dlx\\abc\\node_modules\\t3\\dist\\bin.mjs",
      "pnpm dlx t3code-alpha@latest serve",
    ],
    [
      "/home/theo/.bun/install/cache/t3code-alpha@0.0.31/dist/bin.mjs",
      "bunx t3code-alpha@latest serve",
    ],
    [
      "/tmp/bunx-1000-t3code-alpha@latest/node_modules/t3code-alpha/dist/bin.mjs",
      "bunx t3code-alpha@latest serve",
    ],
    [
      "C:\\Users\\theo\\AppData\\Local\\Temp\\bunx-0-t3code-alpha@latest\\node_modules\\t3\\dist\\bin.mjs",
      "bunx t3code-alpha@latest serve",
    ],
  ] as const) {
    assert.equal(formatCliCommand({ subcommand: "serve", entryPath, version: "0.0.31" }), expected);
  }
});

it("treats stable installs as direct invocations", () => {
  for (const entryPath of [
    "/usr/local/lib/node_modules/t3code-alpha/dist/bin.mjs",
    "/home/theo/Code/work/t3code/apps/server/dist/bin.mjs",
    "/home/theo/.t3-alpha/runtime/0.0.31/node_modules/t3code-alpha/dist/bin.mjs",
    "",
  ]) {
    assert.equal(
      formatCliCommand({ subcommand: "serve", entryPath, version: "0.0.31" }),
      "t3-alpha serve",
    );
  }
});

it("re-suggests the Alpha channel for package-runner invocations", () => {
  for (const [version, expected] of [
    ["0.0.31-alpha.20260729", "npx t3code-alpha@latest serve"],
    ["0.0.31", "npx t3code-alpha@latest serve"],
  ] as const) {
    assert.equal(
      formatCliCommand({
        subcommand: "serve",
        entryPath: "/home/theo/.npm/_npx/abc123/node_modules/t3code-alpha/dist/bin.mjs",
        version,
      }),
      expected,
    );
  }
});

it("formats serve suggestions to match the launching command", () => {
  assert.equal(
    formatCliCommand({
      subcommand: "serve",
      entryPath: "/home/theo/.npm/_npx/abc/node_modules/t3code-alpha/dist/bin.mjs",
      version: "0.0.31-alpha.20260729",
    }),
    "npx t3code-alpha@latest serve",
  );
  assert.equal(
    formatCliCommand({
      subcommand: "serve",
      entryPath: "/tmp/bunx-1000-t3code-alpha@latest/node_modules/t3code-alpha/dist/bin.mjs",
      version: "0.0.31",
    }),
    "bunx t3code-alpha@latest serve",
  );
  assert.equal(
    formatCliCommand({
      subcommand: "serve",
      entryPath: "/usr/local/lib/node_modules/t3code-alpha/dist/bin.mjs",
      version: "0.0.31-alpha.20260729",
    }),
    "t3-alpha serve",
  );
});
