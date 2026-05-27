[![npm version](https://img.shields.io/npm/v/@supcon-international/node-red-mcp-server.svg)](https://www.npmjs.com/package/@supcon-international/node-red-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@supcon-international/node-red-mcp-server.svg)](https://www.npmjs.com/package/@supcon-international/node-red-mcp-server)
[![GitHub license](https://img.shields.io/github/license/supcon-international/node-red-mcp-server.svg)](https://github.com/supcon-international/node-red-mcp-server/blob/main/LICENSE)

# @supcon-international/node-red-mcp-server

Model Context Protocol (MCP) server for Node-RED. It lets MCP clients inspect, search, validate, back up, and carefully change Node-RED through the Node-RED Admin API.

This is an enhanced version based on [karavaev-evgeniy/node-red-mcp-server](https://github.com/karavaev-evgeniy/node-red-mcp-server).

## Highlights

- Selective flow and node reads for large Node-RED installations.
- Read-only mode for safe first connection to important systems.
- Required automatic flow backup before mutating tools.
- Dry-run previews for high-risk flow and subflow operations.
- Scoped writes through `PUT /flow/:id` and `PUT /flow/global`.
- Full `/flows` writes disabled by default and available only as an explicit last resort.
- Flow/subflow validation for IDs, wires, links, groups, config references, and Home Assistant entity fields.
- Backup restore with optimistic locking, dry-run preview, and confirmation tokens for large restores.
- Home Assistant entity audit, clone helpers, structured diffs, and mutation audit metadata.

## Installation

```bash
npm install -g @supcon-international/node-red-mcp-server
```

For a local checkout:

```bash
npm install
npm test
```

## Quick Start

```bash
node-red-mcp --url http://localhost:1880 --read-only
```

Recommended first-use environment:

```ini
NODE_RED_URL=http://localhost:1880
MCP_READ_ONLY=true
MCP_BACKUPS_ENABLED=true
MCP_AUTO_BACKUP=true
MCP_ALLOW_FULL_FLOW_WRITES=false
```

When write access is needed, remove `MCP_READ_ONLY=true` only after confirming backup health and reviewing dry-run output.

## MCP Client Example

```json
{
  "node-red": {
    "command": "npx",
    "args": ["@supcon-international/node-red-mcp-server", "--read-only"],
    "env": {
      "NODE_RED_URL": "http://your-node-red-url:1880",
      "NODE_RED_TOKEN": "your-token-if-needed"
    }
  }
}
```

For a local checkout:

```json
{
  "node-red": {
    "command": "node",
    "args": ["/path/to/node-red-mcp-server/bin/node-red-mcp-server.mjs"],
    "env": {
      "NODE_RED_URL": "http://your-node-red-url:1880",
      "MCP_READ_ONLY": "true"
    }
  }
}
```

## Documentation

- [Configuration](docs/CONFIGURATION.md)
- [MCP tool catalog](docs/MCP_TOOLS.md)
- [Project structure](docs/PROJECT_STRUCTURE.md)
- [Development and maintenance](docs/DEVELOPMENT.md)
- [Roadmap and implementation history](docs/ROADMAP.md)
- [Generated Node-RED instance documentation](docs/node-red/README.md)
- [Archive index](docs/archive/README.md)

## Safety Notes

- Prefer `MCP_READ_ONLY=true` for discovery and audits.
- Mutating tools fail closed when the required backup cannot be created.
- Prefer `dryRun=true` tools before writing.
- Prefer scoped tools over complete flow-set rewrites.
- Use `restore-backup-flows` with `dryRun: true` before live restore.

## Development

```bash
npm test
npm run docs:node-red -- .mcp-backups/<backup-name>.json docs/node-red
npm run test:flows
npm run test:flows:compat
```

The flow-specific test scripts require local backup fixtures under `.mcp-backups`; those files are intentionally ignored.

## License

MIT License

Copyright (c) 2025
