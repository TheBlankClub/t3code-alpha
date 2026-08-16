---
id: project-action-terminal-startup
status: active
risk: amber
introduced_by: 438019e36
last_reconciled_with: 2f486ab80c748b4d8e3d3b17e49b5a327cb93335
upstream_issue: pingdotgg/t3code#6337
upstream_pr: pingdotgg/t3code#6338
surfaces:
  - contracts
  - server
  - web
tests:
  - packages/contracts/src/terminal.test.ts
  - apps/server/src/terminal/Manager.test.ts
---

# Intent

Prevent project-action commands from getting stuck above the prompt while a fresh interactive shell
is still initializing.

# Behavioral invariants

- A fresh supported POSIX terminal receives the configured project action as its initial command.
- Ctrl+C stops a long-running initial command and returns to a usable interactive shell.
- The client skips the legacy terminal write only when the server acknowledges that it handled the
  initial command.
- Running terminals, Windows, unsupported shells, older servers, and fallback paths continue using
  the existing terminal-write behavior.
- A running terminal that restarts because its launch context changed can handle the action during
  the new shell startup without executing it twice.

# Current delta

- The implementation is carried from `pingdotgg/t3code#6338` without behavioral changes while that
  pull request remains open upstream.

# Retirement conditions

- Retire after the upstream pull request merges and an Alpha reconciliation proves the upstream
  contract, server, client fallback, and focused tests satisfy every invariant above.

# Reconciliation notes

- 2026-08-16, upstream `2f486ab80c748b4d8e3d3b17e49b5a327cb93335`: added the current upstream
  PR implementation as a temporary Alpha carry patch; the existing Alpha terminal-related release
  note does not overlap this runtime behavior.
