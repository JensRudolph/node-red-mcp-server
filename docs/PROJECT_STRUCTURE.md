# Project Structure

## Root

| Path | Purpose |
| --- | --- |
| `bin/` | CLI entry point for `node-red-mcp` |
| `lib/` | Runtime server, utilities, flow analysis, diffing, and MCP tool registration |
| `scripts/` | Local documentation generators and flow-preparation/test helpers |
| `test/` | Node test suite for runtime behavior and registration rules |
| `docs/` | Maintained project docs, generated Node-RED instance docs, and historical archive |
| `.mcp-backups/` | Local MCP flow backups. Ignored by Git |
| `node_modules/` | Local dependencies. Ignored by Git |

The root is intentionally kept to package metadata, license, README, source folders, tests, and docs.

## Runtime Code

| Path | Purpose |
| --- | --- |
| `lib/server.mjs` | Creates and starts the MCP server |
| `lib/utils.mjs` | API URL building, auth headers, config parsing, response helpers |
| `lib/flow-analysis.mjs` | Flow selection, validation, cloning, entity audit, and subflow helpers |
| `lib/flow-diff.mjs` | Structured flow diffing and diff summary formatting |
| `lib/flow-utils.mjs` | Lower-level flow formatting helpers |
| `lib/tools/flows.mjs` | Flow/subflow MCP tools |
| `lib/tools/nodes.mjs` | Node module and node search MCP tools |
| `lib/tools/backup.mjs` | Backup, restore, diff, and mutation-audit tools |
| `lib/tools/settings.mjs` | Settings and diagnostics tools |
| `lib/tools/utility.mjs` | API help tool |

## Documentation

| Path | Purpose |
| --- | --- |
| `docs/CONFIGURATION.md` | CLI, environment, backup path, and programmatic config |
| `docs/MCP_TOOLS.md` | Complete MCP tool catalog |
| `docs/DEVELOPMENT.md` | Test, docs, package, and maintenance workflows |
| `docs/ROADMAP.md` | Implemented feature history and open follow-ups |
| `docs/node-red/` | Generated productive Node-RED instance documentation |
| `docs/archive/` | Historical audit, backup, and migration artifacts |

## Generated and Historical Artifacts

Generated scratch output should not be placed in the root. Use:

- `.mcp-backups/` for local backups created by the MCP tools.
- `.codex-build/` for local scratch output.
- `docs/archive/<topic>/` only when an artifact should remain versioned for historical context.

The package publish footprint is restricted through `package.json` `files`, so runtime package installs do not include generated Node-RED instance docs or archived backups.
