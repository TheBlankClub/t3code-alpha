#!/usr/bin/env node
// @effect-diagnostics nodeBuiltinImport:off - This standalone GitHub runner ledger utility must run before workspace dependencies are installed.

import * as NodeFS from "node:fs";
import * as NodePath from "node:path";

const SHA_PATTERN = /^[0-9a-f]{40}$/;

function assertSha(value: string, name: string): void {
  if (!SHA_PATTERN.test(value)) throw new Error(`${name} must be a full lowercase Git SHA.`);
}

function readFlag(args: ReadonlyArray<string>, name: string): string {
  const index = args.indexOf(name);
  const value = index === -1 ? undefined : args[index + 1];
  if (!value) throw new Error(`Missing required ${name} value.`);
  return value;
}

export function reconcileFeatureRecord(
  contents: string,
  upstreamSha: string,
  date: string,
): string {
  assertSha(upstreamSha, "upstreamSha");
  if (!/^status: (active|partial)$/m.test(contents)) return contents;
  const reconciled = contents.replace(
    /^last_reconciled_with: .+$/m,
    `last_reconciled_with: ${upstreamSha}`,
  );
  const marker = `upstream \`${upstreamSha}\``;
  if (reconciled.includes(marker)) return reconciled;
  const suffix = reconciled.endsWith("\n") ? "" : "\n";
  return `${reconciled}${suffix}- ${date}, upstream \`${upstreamSha}\`: \`unaffected\`; automated safe-sync classification\n  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.\n`;
}

export interface AlphaReconciliationJournalEntry {
  readonly timestamp: string;
  readonly previousAlpha: string;
  readonly upstream: string;
  readonly candidate: string;
  readonly features: {
    readonly retained: ReadonlyArray<string>;
    readonly rewritten: ReadonlyArray<string>;
    readonly retired: ReadonlyArray<string>;
  };
  readonly validation: ReadonlyArray<string>;
  readonly outcome: string;
}

export function createSafeSyncJournalEntry(options: {
  readonly timestamp: string;
  readonly previousAlpha: string;
  readonly upstream: string;
  readonly candidate: string;
  readonly featureIds: ReadonlyArray<string>;
  readonly validationUrl: string;
}): AlphaReconciliationJournalEntry {
  assertSha(options.previousAlpha, "previousAlpha");
  assertSha(options.upstream, "upstream");
  assertSha(options.candidate, "candidate");
  return {
    timestamp: options.timestamp,
    previousAlpha: options.previousAlpha,
    upstream: options.upstream,
    candidate: options.candidate,
    features: {
      retained: [...options.featureIds].sort(),
      rewritten: [],
      retired: [],
    },
    validation: [
      `required GitHub CI passed on the automated sync candidate: ${options.validationUrl}`,
      "incoming paths did not overlap the current Alpha delta or protected auto-sync surfaces",
    ],
    outcome: "ready-for-auto-merge",
  };
}

function featureFiles(root: string): ReadonlyArray<string> {
  const directory = NodePath.join(root, ".alpha", "features");
  return NodeFS.readdirSync(directory)
    .filter((entry) => entry.endsWith(".md"))
    .sort()
    .map((entry) => NodePath.join(directory, entry));
}

function featureId(contents: string): string {
  const match = /^id: (.+)$/m.exec(contents);
  if (!match?.[1]) throw new Error("Feature record is missing an id.");
  return match[1].trim();
}

function prepare(args: ReadonlyArray<string>): void {
  const root = readFlag(args, "--root");
  const upstreamSha = readFlag(args, "--upstream-sha");
  const date = readFlag(args, "--date");
  for (const path of featureFiles(root)) {
    const contents = NodeFS.readFileSync(path, "utf8");
    NodeFS.writeFileSync(path, reconcileFeatureRecord(contents, upstreamSha, date));
  }
}

function journal(args: ReadonlyArray<string>): void {
  const root = readFlag(args, "--root");
  const timestamp = readFlag(args, "--timestamp");
  const previousAlpha = readFlag(args, "--previous-alpha");
  const upstream = readFlag(args, "--upstream-sha");
  const candidate = readFlag(args, "--candidate");
  const validationUrl = readFlag(args, "--validation-url");
  const featureIds = featureFiles(root).flatMap((path) => {
    const contents = NodeFS.readFileSync(path, "utf8");
    return /^status: (active|partial)$/m.test(contents) ? [featureId(contents)] : [];
  });
  const entry = createSafeSyncJournalEntry({
    timestamp,
    previousAlpha,
    upstream,
    candidate,
    featureIds,
    validationUrl,
  });
  NodeFS.appendFileSync(
    NodePath.join(root, ".alpha", "reconciliation.jsonl"),
    `${JSON.stringify(entry)}\n`,
  );
}

function main(): void {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === "prepare") return prepare(args);
  if (mode === "journal") return journal(args);
  throw new Error("Expected mode to be prepare or journal.");
}

if (import.meta.main) main();
