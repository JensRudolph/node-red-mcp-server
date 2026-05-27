# Configuration

The server can be configured through CLI flags, environment variables, or the programmatic `createServer` API.

## Precedence

- CLI flags override values loaded from the environment by the CLI.
- Programmatic `createServer({...})` values override environment values when set.
- Defaults are used only when neither explicit config nor environment values are present.

## CLI

```bash
node-red-mcp --url http://localhost:1880 --read-only --verbose
```

| Flag | Short | Meaning |
| --- | --- | --- |
| `--url <url>` | `-u` | Node-RED base URL. Default: `http://localhost:1880` |
| `--token <token>` | `-t` | Bearer token value |
| `--auth-header <value>` |  | Complete `Authorization` header value |
| `--basic-user <user>` |  | Basic auth username |
| `--basic-password <pass>` |  | Basic auth password |
| `--api-prefix <prefix>` |  | API path prefix for reverse proxies |
| `--timeout <ms>` |  | Node-RED request timeout in milliseconds |
| `--verbose` | `-v` | Write diagnostic logs to stderr |
| `--read-only` |  | Register only non-mutating tools |
| `--allow-full-flow-writes` |  | Register last-resort complete `/flows` write tools |
| `--mutation-confirm-threshold <n>` |  | Require confirmation tokens above this mutation size |
| `--max-response-items <n>` |  | Default cap for large structured response lists |
| `--no-backups` |  | Disable local backup tools; mutating tools are blocked |
| `--auto-backup` |  | Create a backup before mutating tools. This is the default |
| `--backup-path <path>` |  | Custom backup root directory |
| `--max-backups <number>` |  | Maximum number of backups to keep |
| `--help` | `-h` | Show help |
| `--version` | `-V` | Show package version |

## Environment

| Variable | Meaning |
| --- | --- |
| `NODE_RED_URL` | Node-RED base URL |
| `NODE_RED_TOKEN` | Bearer token value |
| `NODE_RED_AUTH_HEADER` | Complete `Authorization` header value. Takes precedence over token/basic auth |
| `NODE_RED_BASIC_USER` | Basic auth username |
| `NODE_RED_BASIC_PASSWORD` | Basic auth password |
| `NODE_RED_TIMEOUT_MS` | Node-RED request timeout in milliseconds |
| `NODE_MCP_PREFIX` | API path prefix for reverse proxies |
| `MCP_VERBOSE` | Enable verbose stderr logging |
| `MCP_READ_ONLY` | Register only non-mutating tools |
| `MCP_ALLOW_FULL_FLOW_WRITES` | Register full `/flows` write tools. Default: `false` |
| `MCP_MUTATION_CONFIRM_THRESHOLD` | Require confirmation tokens above this mutation size. Default: `50` |
| `MCP_MAX_RESPONSE_ITEMS` | Default cap for large structured response lists. Default: `100` |
| `MCP_BACKUPS_ENABLED` | Enable backup tools. Mutating tools require this to remain enabled |
| `MCP_BACKUP_PATH` | Custom backup root directory |
| `MCP_MAX_BACKUPS` | Maximum number of backups to keep |
| `MCP_BACKUP_AUTO_CLEANUP` | Remove old backups when the limit is exceeded |
| `MCP_AUTO_BACKUP` | Create a flow backup before mutating tools. Default: `true` |
| `NODE_RED_USER_DIR` | Node-RED user directory used for default backup location resolution |

## Backup Location

Backups are stored in `.mcp-backups` under the configured backup root:

- `MCP_BACKUP_PATH` when set.
- Otherwise `NODE_RED_USER_DIR` when set.
- Otherwise the platform default Node-RED user directory, for example `~/.node-red`.

Backup names must contain only letters, numbers, underscores, and hyphens.

## Programmatic API

```javascript
import { createServer } from "@supcon-international/node-red-mcp-server";

const server = createServer({
  nodeRedUrl: "http://localhost:1880",
  nodeRedToken: "YOUR_TOKEN",
  readOnly: true,
  verbose: true,
  backup: {
    enabled: true,
    autoBeforeMutations: true,
    maxBackups: 10,
  },
});

await server.start();
```

`createServer` returns `{ server, config, start, testNodeRedConnection }`.
