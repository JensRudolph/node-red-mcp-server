[![npm version](https://img.shields.io/npm/v/@supcon-international/node-red-mcp-server.svg)](https://www.npmjs.com/package/@supcon-international/node-red-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@supcon-international/node-red-mcp-server.svg)](https://www.npmjs.com/package/@supcon-international/node-red-mcp-server)
[![GitHub license](https://img.shields.io/github/license/supcon-international/node-red-mcp-server.svg)](https://github.com/supcon-international/node-red-mcp-server/blob/main/LICENSE)

# @supcon-international/node-red-mcp-server

Model Context Protocol (MCP) server for Node-RED. It lets MCP clients such as Claude Desktop, Codex, or other LLM agents inspect and manage Node-RED through the Node-RED Admin API.

> This is an enhanced version based on [karavaev-evgeniy/node-red-mcp-server](https://github.com/karavaev-evgeniy/node-red-mcp-server).

## Features

- Retrieve and update Node-RED flows through MCP
- Safe single-flow updates using Node-RED API v2 revision locking
- Optional full-flow updates using revision locking
- Read-only mode for safe first use
- Bearer token, full Authorization header, and Basic auth support
- Optional API path prefix for reverse proxies
- Configurable Node-RED API request timeout
- Multi-version flow backup system with checksum validation
- Optional automatic flow backup before mutating tools
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
MCP_AUTO_BACKUP=false
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
| `--no-backups` | | Disable local backup tools |
| `--auto-backup` | | Create a flow backup before mutating tools |
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
| `MCP_BACKUPS_ENABLED` | Enable or disable local backup tools |
| `MCP_BACKUP_PATH` | Custom backup root directory |
| `MCP_MAX_BACKUPS` | Maximum number of backups to keep |
| `MCP_BACKUP_AUTO_CLEANUP` | Remove old backups when the limit is exceeded |
| `MCP_AUTO_BACKUP` | Create a flow backup before mutating tools |

## MCP Tools

### Flow Tools

- `get-flows` - Get all flows
- `update-flows` - Safely update the complete flow set with optimistic locking
- `get-flow` - Get a specific flow by ID
- `update-flow` - Safely update a specific flow by ID
- `list-tabs` - List all tabs
- `create-flow` - Create a new flow tab
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
- `search-nodes` - Find nodes by name or property

### Backup Tools

- `backup-flows` - Create a named backup of current flows
- `list-backups` - List available flow backups
- `get-backup-flows` - Get flow content from a backup by name
- `restore-backup-flows` - Restore flows from a backup using optimistic locking
- `backup-health` - Check backup system health

Backup names must use only letters, numbers, underscores, and hyphens. Backup files are stored under `.mcp-backups` inside the configured backup root.

### Settings Tools

- `get-settings` - Get Node-RED runtime settings
- `get-diagnostics` - Fetch diagnostics info

### Utility Tools

- `api-help` - Show Node-RED API help

## Safety Notes

- Start with `MCP_READ_ONLY=true` when connecting an LLM to an important Node-RED instance for the first time.
- Enable `MCP_AUTO_BACKUP=true` when you want a local flow backup before mutating tools run.
- `restore-backup-flows`, `update-flows`, and `update-flow` use Node-RED API v2 revision locking to avoid overwriting concurrent changes silently.
- Verbose logs are written to stderr so stdout remains reserved for the MCP stdio transport.

## License

MIT License

Copyright (c) 2025
