#!/usr/bin/env node
// @effect-diagnostics nodeBuiltinImport:off - This standalone GitHub runner classifier must run before workspace dependencies are installed.

import * as NodeFS from "node:fs";
import * as NodePath from "node:path";

export interface AlphaSyncPolicyRule {
  readonly pattern: string;
  readonly reason: string;
}

export interface AlphaSyncPolicy {
  readonly schemaVersion: 1;
  readonly reviewRequiredPatterns: ReadonlyArray<AlphaSyncPolicyRule>;
}

export interface AlphaSyncReviewPath {
  readonly path: string;
  readonly reasons: ReadonlyArray<string>;
}

export interface AlphaSyncClassification {
  readonly safe: boolean;
  readonly overlappingPaths: ReadonlyArray<string>;
  readonly reviewPaths: ReadonlyArray<AlphaSyncReviewPath>;
}

const uniqueSorted = (values: ReadonlyArray<string>): ReadonlyArray<string> =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();

export function classifyAlphaSync(
  alphaPaths: ReadonlyArray<string>,
  upstreamPaths: ReadonlyArray<string>,
  policy: AlphaSyncPolicy,
): AlphaSyncClassification {
  if (policy.schemaVersion !== 1) {
    throw new Error(`Unsupported Alpha auto-sync policy schema: ${policy.schemaVersion}`);
  }

  const normalizedAlphaPaths = new Set(uniqueSorted(alphaPaths));
  const normalizedUpstreamPaths = uniqueSorted(upstreamPaths);
  const overlappingPaths = normalizedUpstreamPaths.filter((path) => normalizedAlphaPaths.has(path));
  const overlapSet = new Set(overlappingPaths);
  const reviewPaths = normalizedUpstreamPaths.flatMap((path) => {
    const reasons = [
      ...(overlapSet.has(path) ? ["overlaps the current Alpha delta"] : []),
      ...policy.reviewRequiredPatterns
        .filter((rule) => NodePath.matchesGlob(path, rule.pattern))
        .map((rule) => rule.reason),
    ];
    return reasons.length === 0 ? [] : [{ path, reasons: uniqueSorted(reasons) }];
  });

  return {
    safe: reviewPaths.length === 0,
    overlappingPaths,
    reviewPaths,
  };
}

export function renderAlphaSyncClassification(classification: AlphaSyncClassification): string {
  const lines = [
    "## Alpha upstream sync classification",
    "",
    classification.safe
      ? "Result: **no semantic overlap detected**."
      : "Result: **semantic overlap detected**.",
    "",
  ];

  if (classification.reviewPaths.length === 0) {
    lines.push(
      "Incoming upstream paths neither overlap the current Alpha delta nor match a protected surface.",
    );
  } else {
    lines.push("Attention paths:", "");
    for (const entry of classification.reviewPaths) {
      lines.push(`- \`${entry.path}\`: ${entry.reasons.join("; ")}`);
    }
  }

  lines.push(
    "",
    "This report is advisory. A conflict-free Git merge and required CI are the automatic merge gates.",
    "",
  );
  return lines.join("\n");
}

function readLines(path: string): ReadonlyArray<string> {
  return NodeFS.readFileSync(path, "utf8").split(/\r?\n/);
}

function readFlag(args: ReadonlyArray<string>, name: string): string {
  const index = args.indexOf(name);
  const value = index === -1 ? undefined : args[index + 1];
  if (!value) throw new Error(`Missing required ${name} value.`);
  return value;
}

function appendGitHubOutput(path: string, key: string, value: string): void {
  NodeFS.appendFileSync(path, `${key}=${value}\n`);
}

function main(): void {
  const args = process.argv.slice(2);
  const alphaPathsFile = readFlag(args, "--alpha-paths-file");
  const upstreamPathsFile = readFlag(args, "--upstream-paths-file");
  const policyPath = readFlag(args, "--policy");
  const reportPath = readFlag(args, "--report");
  const githubOutputPath = readFlag(args, "--github-output");
  const policy = JSON.parse(NodeFS.readFileSync(policyPath, "utf8")) as AlphaSyncPolicy;
  const classification = classifyAlphaSync(
    readLines(alphaPathsFile),
    readLines(upstreamPathsFile),
    policy,
  );

  NodeFS.writeFileSync(reportPath, renderAlphaSyncClassification(classification));
  appendGitHubOutput(githubOutputPath, "safe", String(classification.safe));
  appendGitHubOutput(
    githubOutputPath,
    "overlap_count",
    String(classification.overlappingPaths.length),
  );
  appendGitHubOutput(githubOutputPath, "review_count", String(classification.reviewPaths.length));
  appendGitHubOutput(githubOutputPath, "report", reportPath);
}

if (import.meta.main) main();
