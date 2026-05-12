[![npm version](https://img.shields.io/npm/v/@supcon-international/node-red-mcp-server.svg)](https://www.npmjs.com/package/@supcon-international/node-red-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@supcon-international/node-red-mcp-server.svg)](https://www.npmjs.com/package/@supcon-international/node-red-mcp-server)
[![GitHub license](https://img.shields.io/github/license/supcon-international/node-red-mcp-server.svg)](https://github.com/supcon-international/node-red-mcp-server/blob/main/LICENSE)

# @supcon-international/node-red-mcp-server

Model Context Protocol (MCP) server for Node-RED. It lets MCP clients such as Claude Desktop, Codex, or other LLM agents inspect and manage Node-RED through the Node-RED Admin API.

> This is an enhanced version based on [karavaev-evgeniy/node-red-mcp-server](https://github.com/karavaev-evgeniy/node-red-mcp-server).

## Features

- Retrieve and update Node-RED flows through MCP
- Selective flow reads to avoid oversized responses on large installations
- Low-blast-radius single-flow updates using `PUT /flow/:id`
- Optional full-flow single-tab updates using Node-RED API v2 revision locking
- Optional full-flow updates using revision locking
- Flow payload validation and dry-run previews before writes
- Config-node reference validation using Node-RED node metadata when available
- Safe flow cloning with ID, wire, link, group, and entity remapping
- Scoped flow replacements and entity clearing with dry-run diffs
- Confirm-token protection for large mutations
- Full `/flows` write tools disabled by default and opt-in only
- Home Assistant entity audit for flow copies and reviews
- Read-only mode for safe first use
- Bearer token, full Authorization header, and Basic auth support
- Optional API path prefix for reverse proxies
- Configurable Node-RED API request timeout
- Multi-version flow backup system with checksum validation
- Required automatic flow backup before mutating tools
- Structured per-backup flow diffs for auditing changes
- Restore flows from a named backup using optimistic locking
- List installed Node-RED nodes with node names, help content, and module names
- Install, inspect, enable, or disable Node-RED node modules
- Manage tabs, search nodes, trigger inject nodes, inspect settings, and get diagnostics

## Requirements

- Node.js 18.14.1 or newer
- A running Node-RED instance with HTTP Admin API access

## Installation

### Global Installation

```bash
npm install -g @supcon-international/node-red-mcp-server
```

### Local Installation

```bash
npm install @supcon-international/node-red-mcp-server
```

## Usage

### Command Line

```bash
node-red-mcp --url http://localhost:1880 --token YOUR_TOKEN
```

### Configuration via `.env`

Create a `.env` file:

```ini
NODE_RED_URL=http://localhost:1880
NODE_RED_TOKEN=YOUR_TOKEN
NODE_RED_AUTH_HEADER=
NODE_RED_BASIC_USER=
NODE_RED_BASIC_PASSWORD=
NODE_RED_TIMEOUT_MS=30000
NODE_MCP_PREFIX=/api/v1

MCP_VERBOSE=false
MCP_READ_ONLY=true
MCP_BACKUPS_ENABLED=true
MCP_BACKUP_PATH=/custom/backup/path
MCP_MAX_BACKUPS=10
MCP_BACKUP_AUTO_CLEANUP=true
MCP_AUTO_BACKUP=true
MCP_ALLOW_FULL_FLOW_WRITES=false
MCP_MUTATION_CONFIRM_THRESHOLD=50
MCP_MAX_RESPONSE_ITEMS=100
```

Then run:

```bash
node-red-mcp
```

### Claude Desktop Configuration

```json
{
  "node-red": {
    "command": "npx",
    "args": ["@supcon-international/node-red-mcp-server", "--verbose"],
    "env": {
      "NODE_RED_URL": "http://your-node-red-url:1880",
      "NODE_RED_TOKEN": "your-token-if-needed",
      "NODE_MCP_PREFIX": "/nodered-api",
      "MCP_READ_ONLY": "true",
      "MCP_BACKUP_PATH": "/custom/backup/path",
      "MCP_MAX_BACKUPS": "10"
    }
  }
}
```

For a local checkout:

```json
{
  "node-red": {
    "command": "node",
    "args": [
      "/path/to/node-red-mcp-server/bin/node-red-mcp-server.mjs",
      "--verbose"
    ],
    "env": {
      "NODE_RED_URL": "http://your-node-red-url:1880",
      "NODE_RED_TOKEN": "your-token-if-needed",
      "NODE_MCP_PREFIX": "/nodered-api"
    }
  }
}
```

## Programmatic Usage

```javascript
import { createServer } from "node-red-mcp-server";

const server = createServer({
  nodeRedUrl: "http://localhost:1880",
  nodeRedToken: "YOUR_TOKEN",
  nodeRedTimeoutMs: 30000,
  verbose: true,
  readOnly: true,
});

await server.start();
```

## Configuration Options

### CLI Parameters

| Parameter | Short | Description |
| --- | --- | --- |
| `--url` | `-u` | Node-RED base URL |
| `--token` | `-t` | API access token |
| `--auth-header` | | Complete Authorization header value |
| `--basic-user` | | Basic auth username |
| `--basic-password` | | Basic auth password |
| `--api-prefix` | | API path prefix for reverse proxies |
| `--timeout` | | Node-RED request timeout in milliseconds |
| `--verbose` | `-v` | Enable verbose logging to stderr |
| `--read-only` | | Register only tools that do not mutate Node-RED |
| `--allow-full-flow-writes` | | Register full `/flows` write tools. Last resort only |
| `--mutation-confirm-threshold` | | Require `confirmToken` above this mutation size |
| `--max-response-items` | | Default cap for large structured response lists |
| `--no-backups` | | Disable local backup tools; mutating tools will be blocked |
| `--auto-backup` | | Create a flow backup before mutating tools (default) |
| `--backup-path` | | Custom backup directory path |
| `--max-backups` | | Maximum number of backups to keep |
| `--help` | `-h` | Show help |
| `--version` | `-V` | Show version number |

### Environment Variables

| Variable | Description |
| --- | --- |
| `NODE_RED_URL` | URL of your Node-RED instance |
| `NODE_RED_TOKEN` | API access token |
| `NODE_RED_AUTH_HEADER` | Complete Authorization header value |
| `NODE_RED_BASIC_USER` | Basic auth username |
| `NODE_RED_BASIC_PASSWORD` | Basic auth password |
| `NODE_RED_TIMEOUT_MS` | Node-RED request timeout in milliseconds |
| `NODE_MCP_PREFIX` | API path prefix for reverse proxies |
| `MCP_VERBOSE` | Enable verbose logging |
| `MCP_READ_ONLY` | Register only non-mutating Node-RED tools |
| `MCP_ALLOW_FULL_FLOW_WRITES` | Register full `/flows` write tools. Default: `false` |
| `MCP_MUTATION_CONFIRM_THRESHOLD` | Require `confirmToken` above this mutation size. Default: `50` |
| `MCP_MAX_RESPONSE_ITEMS` | Default cap for large structured response lists. Default: `100` |
| `MCP_BACKUPS_ENABLED` | Enable or disable local backup tools |
| `MCP_BACKUP_PATH` | Custom backup root directory |
| `MCP_MAX_BACKUPS` | Maximum number of backups to keep |
| `MCP_BACKUP_AUTO_CLEANUP` | Remove old backups when the limit is exceeded |
| `MCP_AUTO_BACKUP` | Create a flow backup before mutating tools (default: `true`; disabling it blocks mutating tools) |

## MCP Tools

### Flow Tools

- `get-flows` - Get all flows
- `get-flows` with filters - Get smaller selective responses by `flowId`, `flowLabel`, `types`, `limit`, and `offset`
- `update-flows` - Last-resort complete flow-set update with optimistic locking; only registered when full-flow writes are explicitly enabled
- `get-flow` - Get a specific flow by ID
- `get-subflow` - Get a specific subflow and its internal nodes
- `list-subflows` - List subflows with internal node counts and instance counts
- `subflow-usage` - Find all instances of one subflow across flow tabs
- `validate-flow-payload` - Validate IDs, wires, links, groups, `z` references, config refs, and entity fields before writing
- `validate-subflow-payload` - Validate a subflow payload, including `in`, `out`, and `status` references
- `dry-run-create-flow` - Preview flow creation without writing to Node-RED
- `dry-run-create-subflow` - Preview creating a subflow through `PUT /flow/global`
- `dry-run-update-subflow` - Preview replacing a subflow through `PUT /flow/global`
- `entity-audit` - Extract and categorize Home Assistant entities in a live flow or provided payload
- `diff-flow-against-source` - Compare a source and target flow with optional cloned ID mapping
- `update-flow` - Update a specific flow by ID using direct `PUT /flow/:id`
- `create-subflow` - Create a new subflow through scoped `PUT /flow/global`
- `update-subflow` - Replace one subflow through scoped `PUT /flow/global`
- `update-flow-full` - Last-resort single-flow replacement through the complete `/flows` payload; only registered when full-flow writes are explicitly enabled
- `list-tabs` - List all tabs
- `create-flow` - Create a new flow tab
- `clone-flow` - Clone a flow with deterministic ID remapping, replacements, entity clearing, validation, and dry-run support
- `clone-subflow` - Clone a subflow with deterministic ID remapping and scoped `PUT /flow/global` write
- `replace-in-flow` - Perform scoped string/regex replacements in one flow; dry-run is default
- `clear-entities-in-flow` - Neutralize matching Home Assistant entity assignments in one flow; dry-run is default
- `delete-flow` - Delete a flow tab
- `get-flows-state` - Get deployment state
- `set-flows-state` - Change deployment state
- `get-flows-formatted` - Get formatted flow statistics
- `visualize-flows` - Generate a graph-like flow summary

Structured arguments are preferred for mutating flow tools. For backwards compatibility, JSON string arguments such as `flowsJson`, `flowJson`, and `stateJson` are still accepted.

### Node Tools

- `inject` - Trigger an inject node
- `get-available-nodes` - List installed node names, help content, and modules
- `install-node-module` - Install a new node module
- `get-node-detailed-info` - Get detailed info about a node module
- `get-node-set-detailed-info` - Get detailed info about a node module set
- `toggle-node-module` - Enable or disable a node module
- `toggle-node-module-set` - Enable or disable a node module set
- `find-nodes-by-type` - Locate nodes by type
- `search-nodes` - Find structured field-level matches with optional flow, node type, name, entity, and property filters
- `get-nodes` - Retrieve nodes with combinable filters and pagination

### Backup Tools

- `backup-flows` - Create a named backup of current flows
- `list-backups` - List available flow backups
- `get-backup-flows` - Get flow content from a backup by name, with optional summary/filter/pagination arguments
- `get-backup-diff` - Get a stored backup diff, or generate one against current flows
- `restore-backup-flows` - Restore flows from a backup using optimistic locking; supports dry-run and large-restore confirmation
- `undo-last-mutation` - Preview or restore the latest automatic mutation backup; dry-run is default
- `backup-health` - Check backup system health

Backup names must use only letters, numbers, underscores, and hyphens. Backup files are stored under `.mcp-backups` inside the configured backup root.
Mutating tools fail closed if the MCP cannot create a required backup first.
After a successful mutating tool call, the MCP writes `<backup-name>.diff.json` next to the backup and records the diff summary in backup metadata. Use `get-backup-diff` with `format: "summary"` for a compact audit view or `format: "json"` for the full structured diff.

### Settings Tools

- `get-settings` - Get Node-RED runtime settings
- `get-diagnostics` - Fetch diagnostics info

### Utility Tools

- `api-help` - Show Node-RED API help

## Safety Notes

- Start with `MCP_READ_ONLY=true` when connecting an LLM to an important Node-RED instance for the first time.
- Backups are required before mutating tools run. If a backup cannot be created, the MCP blocks the mutation before calling the Node-RED write endpoint.
- Prefer dry-run tools first. `clone-flow`, `replace-in-flow`, and `clear-entities-in-flow` default to `dryRun=true`; set `dryRun=false` only after reviewing the returned changes and validation result.
- Prefer scoped tools over raw complete-flow edits. `clone-flow`, `create-subflow`, `clone-subflow`, `replace-in-flow`, `clear-entities-in-flow`, `update-flow`, `update-subflow`, `validate-flow-payload`, and `validate-subflow-payload` keep the blast radius much smaller than full `/flows` rewrites.
- Full `/flows` write tools are disabled unless `MCP_ALLOW_FULL_FLOW_WRITES=true` or `--allow-full-flow-writes` is set. Treat them as last-resort tools.
- Large mutations return `requiresConfirmation: true` with a deterministic `confirmToken`. Re-run with that token only after reviewing the preview.
- Large structured responses are capped by default. Use tool-specific `includePayload`, `includeChanges`, `limitChanges`, or `limitItems` options when detailed output is really needed.
- Successful mutating tools write a structured diff file next to the required backup so later agents can verify the exact added, removed, and modified flow objects.
- `update-flow` limits writes to the selected flow by using `PUT /flow/:id`; it does not rewrite the complete flow set.
- `create-subflow`, `update-subflow`, and `clone-subflow` update global Subflow definitions with `PUT /flow/global`; they do not require enabling full `/flows` write tools.
- `restore-backup-flows`, `update-flows`, and `update-flow-full` use Node-RED API v2 revision locking to avoid overwriting concurrent changes silently.
- Mutating JSON requests are sent with `application/json; charset=utf-8`.
- Verbose logs are written to stderr so stdout remains reserved for the MCP stdio transport.

## License

MIT License

Copyright (c) 2025
