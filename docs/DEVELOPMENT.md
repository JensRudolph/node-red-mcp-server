# Development and Maintenance

## Requirements

- Node.js 18.14.1 or newer.
- A Node-RED instance only when running live MCP tools.

## Common Commands

```powershell
npm install
npm test
```

## Node-RED Work Rules

For any live Node-RED search, analysis, or change:

1. Load the Node-RED MCP tools.
2. Create a current backup with `backup-flows`.
3. Do search, analysis, and change preparation locally from that backup or derived local data.
4. Do not call Node-RED or Home Assistant APIs directly.
5. Write finished flow changes back through prepared backup restore.
6. Run `restore-backup-flows` first and review the default dry-run result.
7. Only run live restore after reviewing the dry-run result.

## Package Publishing

`package.json` uses `files` to keep npm packages focused on runtime code and maintained top-level docs:

- `bin/`
- `lib/`
- `docs/*.md`
- `README.md`
- `LICENSE`

## Verification Checklist

Before handing off repository changes:

1. Run `npm test`.
2. If package metadata changed, run `npm pack --dry-run`.
3. Check `git status --short` for accidental local backup or scratch files.
