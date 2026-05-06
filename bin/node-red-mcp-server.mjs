#!/usr/bin/env node

/**
 * Command-line interface for Node-RED MCP server
 */

import { createServer } from "../lib/server.mjs";
import { parseBoolean, parsePositiveInteger } from "../lib/utils.mjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Define __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version from package.json
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  nodeRedUrl: process.env.NODE_RED_URL,
  nodeRedToken: process.env.NODE_RED_TOKEN,
  nodeRedAuthHeader: process.env.NODE_RED_AUTH_HEADER,
  nodeRedBasicUser: process.env.NODE_RED_BASIC_USER,
  nodeRedBasicPassword: process.env.NODE_RED_BASIC_PASSWORD,
  apiPrefix: process.env.NODE_MCP_PREFIX,
  nodeRedTimeoutMs: parsePositiveInteger(
    process.env.NODE_RED_TIMEOUT_MS,
    "NODE_RED_TIMEOUT_MS"
  ),
  verbose: parseBoolean(process.env.MCP_VERBOSE),
  readOnly: parseBoolean(process.env.MCP_READ_ONLY),
  backup: {
    enabled:
      process.env.MCP_BACKUPS_ENABLED === undefined
        ? undefined
        : parseBoolean(process.env.MCP_BACKUPS_ENABLED),
    backupPath: process.env.MCP_BACKUP_PATH,
    maxBackups: process.env.MCP_MAX_BACKUPS
      ? parsePositiveInteger(process.env.MCP_MAX_BACKUPS, "MCP_MAX_BACKUPS")
      : undefined,
    autoCleanup:
      process.env.MCP_BACKUP_AUTO_CLEANUP === undefined
        ? undefined
        : parseBoolean(process.env.MCP_BACKUP_AUTO_CLEANUP),
    autoBeforeMutations:
      process.env.MCP_AUTO_BACKUP === undefined
        ? undefined
        : parseBoolean(process.env.MCP_AUTO_BACKUP),
  },
};

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

function readOptionValue(index, arg) {
  const value = args[index + 1];
  if (value === undefined) {
    exitWithError(`Missing value for ${arg}`);
  }

  return value;
}

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === "--url" || arg === "-u") {
    options.nodeRedUrl = readOptionValue(i, arg);
    i++;
  } else if (arg === "--token" || arg === "-t") {
    options.nodeRedToken = readOptionValue(i, arg);
    i++;
  } else if (arg === "--auth-header") {
    options.nodeRedAuthHeader = readOptionValue(i, arg);
    i++;
  } else if (arg === "--basic-user") {
    options.nodeRedBasicUser = readOptionValue(i, arg);
    i++;
  } else if (arg === "--basic-password") {
    options.nodeRedBasicPassword = readOptionValue(i, arg);
    i++;
  } else if (arg === "--api-prefix") {
    options.apiPrefix = readOptionValue(i, arg);
    i++;
  } else if (arg === "--timeout") {
    options.nodeRedTimeoutMs = parsePositiveInteger(
      readOptionValue(i, arg),
      "--timeout"
    );
    i++;
  } else if (arg === "--verbose" || arg === "-v") {
    options.verbose = true;
  } else if (arg === "--read-only") {
    options.readOnly = true;
  } else if (arg === "--no-backups") {
    options.backup.enabled = false;
  } else if (arg === "--auto-backup") {
    options.backup.autoBeforeMutations = true;
  } else if (arg === "--backup-path") {
    options.backup.backupPath = readOptionValue(i, arg);
    i++;
  } else if (arg === "--max-backups") {
    options.backup.maxBackups = parsePositiveInteger(
      readOptionValue(i, arg),
      "--max-backups"
    );
    i++;
  } else if (arg === "--help" || arg === "-h") {
    console.log(`
Node-RED MCP Server v${packageJson.version}

Usage: node-red-mcp [options]

Options:
  -u, --url <url>           Node-RED base URL (default: http://localhost:1880)
  -t, --token <token>       API access token
  --auth-header <value>     Complete Authorization header value
  --basic-user <user>       Basic auth username
  --basic-password <pass>   Basic auth password
  --api-prefix <prefix>     API path prefix for reverse proxies
  --timeout <ms>            Node-RED request timeout in milliseconds
  -v, --verbose             Enable verbose logging
  --read-only               Register only tools that do not mutate Node-RED
  --no-backups              Disable local backup tools; mutating tools will be blocked
  --auto-backup             Create a flow backup before mutating tools (default)
  --backup-path <path>      Custom backup directory path
  --max-backups <number>    Maximum number of backups to keep (default: 10)
  -h, --help               Show this help message
  -V, --version            Show version number

Environment Variables:
  NODE_RED_URL             Node-RED base URL
  NODE_RED_TOKEN           API access token  
  NODE_RED_AUTH_HEADER     Complete Authorization header value
  NODE_RED_BASIC_USER      Basic auth username
  NODE_RED_BASIC_PASSWORD  Basic auth password
  NODE_RED_TIMEOUT_MS      Node-RED request timeout in milliseconds
  NODE_MCP_PREFIX          API path prefix for reverse proxies
  MCP_VERBOSE              Enable verbose logging
  MCP_READ_ONLY            Register only tools that do not mutate Node-RED
  MCP_BACKUPS_ENABLED      Enable local backup tools
  MCP_BACKUP_PATH          Custom backup directory path
  MCP_MAX_BACKUPS          Maximum number of backups to keep
  MCP_BACKUP_AUTO_CLEANUP  Remove old backups when the limit is exceeded
  MCP_AUTO_BACKUP          Create a flow backup before mutating tools (default: true)
`);
    process.exit(0);
  } else if (arg === "--version" || arg === "-V") {
    console.log(packageJson.version);
    process.exit(0);
  } else {
    exitWithError(`Unknown option: ${arg}`);
  }
}

// Create and start server
async function run() {
  try {
    const server = createServer(options);
    await server.start();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Start
run();
