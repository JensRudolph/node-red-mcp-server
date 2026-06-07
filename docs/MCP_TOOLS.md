# MCP Tool Catalog

Tool availability depends on server configuration:

- `MCP_READ_ONLY=true` hides mutating tools.
- `MCP_ALLOW_FULL_FLOW_WRITES=false` hides complete `/flows` write tools.
- Backups must be enabled for mutating tools. Mutations fail before writing when the required backup cannot be created.
- Read tools truncate long string fields by default. Use `includeFullValues=true` for complete values, or tune `maxStringLength` / `MCP_MAX_STRING_LENGTH`.

## Flow Tools

| Tool | Availability | Purpose |
| --- | --- | --- |
| `get-flows` | read | Read all flows or selective/paginated subsets |
| `get-flow` | read | Read one flow by ID |
| `get-subflow` | read | Read one subflow definition and internal nodes |
| `list-subflows` | read | List subflow definitions with counts and optional usage |
| `subflow-usage` | read | Find all instances of one subflow |
| `validate-flow-payload` | read | Validate a flow payload before writing |
| `validate-subflow-payload` | read | Validate a subflow payload before writing |
| `dry-run-create-flow` | read | Preview creating a flow without writing |
| `dry-run-create-subflow` | read | Preview creating a subflow without writing |
| `dry-run-update-subflow` | read | Preview replacing a subflow without writing |
| `entity-audit` | read | Extract and categorize Home Assistant entity references |
| `diff-flow-against-source` | read | Compare source and target flows, with optional cloned ID mapping |
| `list-tabs` | read | List all flow tabs |
| `get-flows-state` | read | Read deployment state |
| `get-flows-formatted` | read | Return a compact human-readable flow summary |
| `visualize-flows` | read | Return a graph-like tab summary |
| `update-flow` | write | Update one flow through direct `PUT /flow/:id` |
| `update-subflow` | write | Replace one subflow through scoped `PUT /flow/global` |
| `create-subflow` | write | Create one subflow through scoped `PUT /flow/global` |
| `clone-subflow` | write | Clone a subflow with deterministic ID remapping; dry-run defaults to true |
| `create-flow` | write | Create a flow tab and return created ID/audit data |
| `clone-flow` | write | Clone a flow with ID remapping, replacements, entity clearing, validation, and dry-run support |
| `replace-in-flow` | write | Apply scoped string/regex replacements in one flow; dry-run defaults to true |
| `clear-entities-in-flow` | write | Neutralize matching Home Assistant entity assignments; dry-run defaults to true |
| `delete-flow` | write | Delete one flow tab after backup/confirmation checks |
| `set-flows-state` | write | Change deployment state |
| `update-flows` | full-write opt-in | Last-resort complete flow-set update with revision locking |
| `update-flow-full` | full-write opt-in | Last-resort single-flow replacement through complete `/flows` payload |

## Node Tools

| Tool | Availability | Purpose |
| --- | --- | --- |
| `get-available-nodes` | read | List installed Node-RED node types with help/module metadata |
| `get-node-detailed-info` | read | Read detailed module information |
| `get-node-set-detailed-info` | read | Read detailed module-set information |
| `find-nodes-by-type` | read | Locate nodes by exact type |
| `search-nodes` | read | Search structured field-level matches with flow/type/name/entity/property filters |
| `get-nodes` | read | Retrieve nodes with combinable filters and pagination |
| `get-node` | read | Retrieve one live node by ID or selector with projection/truncation |
| `get-function-context` | read | Return targeted line context from a live or backup function node |
| `inject` | write | Trigger an inject node |
| `install-node-module` | write | Install a Node-RED node module |
| `toggle-node-module` | write | Enable or disable a node module |
| `toggle-node-module-set` | write | Enable or disable a node module set |

## Backup Tools

| Tool | Availability | Purpose |
| --- | --- | --- |
| `backup-flows` | read/write independent | Create a named backup of current flows and return structured metadata |
| `list-backups` | read | List known backups |
| `get-backup-flows` | read | Read backup contents or selective subsets |
| `get-backup-node` | read | Retrieve one node from a named backup |
| `derive-backup` | read/write independent | Create a derived local backup by applying node-level offline edits |
| `simulate-function-node` | read | Run a backup function node in a local sandbox with supplied context fixtures |
| `get-backup-diff` | read | Read or regenerate a structured diff for a backup |
| `backup-health` | read | Check backup configuration, count, age, and corruption indicators |
| `restore-backup-flows` | write | Preview by default or restore a named backup with confirmation and safety backup |
| `undo-last-mutation` | write | Preview or restore the latest automatic mutation backup |

## Settings and Utility Tools

| Tool | Availability | Purpose |
| --- | --- | --- |
| `get-settings` | read | Read Node-RED runtime settings |
| `get-diagnostics` | read | Read Node-RED diagnostics |
| `api-help` | read | Show implemented Node-RED Admin API coverage and safety-focused MCP tools |

## Recommended Workflows

For read-only discovery:

```text
backup-flows -> get-nodes/search-nodes/get-node/get-function-context -> validate-flow-payload
```

For scoped flow edits:

```text
backup-flows -> derive-backup -> get-backup-node/get-function-context -> restore-backup-flows
```

For backup restore:

```text
restore-backup-flows -> inspect dry-run diff/confirmation -> restore-backup-flows dryRun=false
```

`backup-flows` returns JSON with the backup metadata, checksum, exact size,
backup file paths, and retention cleanup details. `restore-backup-flows`
defaults to `dryRun: true`; set `dryRun: false` only after reviewing the preview.
