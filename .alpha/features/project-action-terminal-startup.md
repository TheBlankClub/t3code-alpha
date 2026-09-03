---
id: project-action-terminal-startup
status: active
risk: amber
introduced_by: 438019e36
last_reconciled_with: 5b8445b7a777ab1070aa97b062b1618971073a96
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
- 2026-08-17, upstream `a4cc1367b03ee0c1dc2b50fceac81ef5e63212e2`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-18, upstream `cebac353defde6211c9e8c3d8ecd140c92042930`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-20, upstream `f708f63fa9bcd7e51f1f62531f6f9ed966b71807`: `unaffected`;
  incoming terminal-close confirmation changes do not alter initial-command handling, contracts,
  or the client fallback for older servers.
- 2026-08-20, upstream `beab6886f45bf42906d0bd01aefe5dfe9e66a867`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-22, upstream `b381fdb12cb7cb241e2b8aca84941375f3fb43f4`: `unaffected`; incoming web
  composer, terminal, preview, and CI-parallelization changes do not touch this feature's
  surfaces.
- 2026-08-22, upstream `035058a23e651ea5f407c9ab73cf5329cc40c102`: `unaffected`; automated safe-sync classification
  found no Alpha-delta overlap or protected-path changes. Required PR CI remained the merge gate.
- 2026-08-24, upstream `a9cd94eb935fed8e73b0d88e599c27048f2939c3`: `unaffected`; incoming provider,
  feedback, and composer changes do not alter terminal initial-command handling or its fallback.
- 2026-08-26, upstream `860caaa6023a3aaf616a5899816c74c195ca8de2`: `unaffected`; incoming
  terminal link styling, keybindings, provider, and server startup changes do not alter terminal
  initial-command handling, acknowledgement, or older-server fallback behavior.
- 2026-08-27, upstream `ead4ce52a1624d9c55461f61524580978fc8b719`: `unaffected`; incoming Grok,
  Codex event, usage, package, and preview changes do not alter terminal initial-command handling,
  acknowledgement, or older-server fallback behavior.
- 2026-08-29, upstream `0e2905eb783fd2385f358a95f0b25bbf07ff7122`: `mechanical-overlap`;
  adopted upstream's preview-automation status additions in the shared IPC contract while retaining
  terminal initial-command handling, acknowledgement, and older-server fallback behavior.
- 2026-08-28, upstream `22c311ddecfbab2e541a374a46f2df87d4fc6305`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-29, upstream `053affbed2659f90cd1b1efaaa7a75865c4131c7`: `mechanical-overlap`;
  adopted upstream's environment-theme and attachment wire contracts while retaining terminal
  initial-command handling, acknowledgement, and older-server fallback behavior.
- 2026-08-30, upstream `c0e09f323ac9f6bf4b9119cbad841db3379588d6`: `unaffected`; upstream's
  preview manager deduplication does not alter terminal initial-command handling,
  acknowledgement, or older-server fallback behavior.
- 2026-08-30, upstream `2daff8c25adf701fddd062ae93b94cc57d420ec2`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
- 2026-08-31, upstream `352710d497cc640553e3e18e23fb5a5f3f890466`: `unaffected`; upstream's
  generated source-control prompt and shell fixes do not alter terminal initial-command handling,
  acknowledgement, or older-server fallback behavior.
- 2026-09-02, upstream `2d156a83b96ebf2e4a9c6017251baad357ae6ab1`: `unaffected`; incoming IPC,
  keybinding, provider child-session, and shell changes do not alter terminal initial-command
  handling, acknowledgement, or older-server fallback behavior.
- 2026-09-02, upstream `60cef47ec983637ddc68faed7b1488b6f3c3a175`: `mechanical-overlap`; adopted
  upstream's preview and quit-shortcut IPC changes while retaining terminal initial-command
  handling, acknowledgement, and older-server fallback behavior.
- 2026-09-02, upstream `70cd258d8aac43ea57494527b00bf36de3efa6c0`: `mechanical-overlap`; adopted
  upstream's desktop activation IPC and ChatView changes while retaining terminal initial-command
  handling, acknowledgement, and older-server fallback behavior.
- 2026-09-03, upstream `5b8445b7a777ab1070aa97b062b1618971073a96`: `auto-merged`; Git produced a conflict-free
  reconciliation candidate. Required PR CI remained the merge gate.
