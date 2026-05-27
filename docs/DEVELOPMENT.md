# Development and Maintenance

## Requirements

- Node.js 18.14.1 or newer.
- A Node-RED instance only when running live MCP tools or flow-specific scripts.
- Local backup fixtures under `.mcp-backups` for flow regression scripts.

## Common Commands

```powershell
npm install
npm test
npm run docs:node-red -- .mcp-backups\<backup-name>.json docs\node-red
npm run test:flows
npm run test:flows:compat
```

`npm test` is the repository unit test suite. The flow-specific scripts depend on local backup files that are not committed.

## Node-RED Work Rules

For any live Node-RED search, analysis, or change:

1. Load the Node-RED MCP tools.
2. Create a current backup with `backup-flows`.
3. Do search, analysis, and change preparation locally from that backup or derived local data.
4. Do not call Node-RED or Home Assistant APIs directly.
5. Write finished flow changes back through prepared backup restore.
6. Run `restore-backup-flows` with `dryRun: true` first.
7. Only run live restore after reviewing the dry-run result.

## Documentation Generation

Generated Node-RED docs are produced from an MCP backup:

```powershell
npm run docs:node-red -- .mcp-backups\<backup-name>.json docs\node-red
```

The generator writes:

- `docs/node-red/README.md`
- `docs/node-red/ARCHITEKTUR.md`
- `docs/node-red/OWNER-MATRIX-V2.md`
- `docs/node-red/FLOW-KATALOG.md`
- `docs/node-red/FLOW-DETAILS.md`
- `docs/node-red/NODE-INVENTORY.md`
- `docs/node-red/ENTITY-INVENTORY.md`
- `docs/node-red/SERVICE-CALLS.md`
- `docs/node-red/SUBFLOWS.md`
- `docs/node-red/BETRIEB-UND-TESTS.md`

## Script Policy

One-off flow preparation scripts are allowed when they encode an auditable migration or regression scenario. Prefer MCP tools for repeatable workflows, and document any remaining script-only workflow in `docs/ROADMAP.md`.

## Package Publishing

`package.json` uses `files` to keep npm packages focused on runtime code and maintained top-level docs:

- `bin/`
- `lib/`
- `docs/*.md`
- `README.md`
- `LICENSE`

Generated Node-RED instance docs, local backups, and historical archives stay in the Git repository where useful, but are not shipped in the npm package.

## Verification Checklist

Before handing off repository changes:

1. Run `npm test`.
2. If package metadata changed, run `npm pack --dry-run`.
3. If generated Node-RED docs changed, note the backup name and generation timestamp.
4. Check `git status --short` for accidental local backup or scratch files.
