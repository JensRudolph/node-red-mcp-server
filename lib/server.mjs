/**
 * MCP server for Node-RED
 * Allows language models to interact with Node-RED through the MCP protocol
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import axios from "axios";
import { readFileSync } from "fs";
import { pathToFileURL } from "url";
import {
  DEFAULT_NODE_RED_TIMEOUT_MS,
  buildNodeRedAuthHeaders,
  parseBoolean,
  parsePositiveInteger,
} from "./utils.mjs";

// Import tool registrars
import registerFlowTools from "./tools/flows.mjs";
import registerNodeTools from "./tools/nodes.mjs";
import registerSettingsTools from "./tools/settings.mjs";
import registerUtilityTools from "./tools/utility.mjs";
import registerBackupTools from "./tools/backup.mjs";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

/**
 * Default server settings
 */
const defaultConfig = {
  serverName: "node-red-mcp-server",
  serverVersion: packageJson.version,
  nodeRedUrl: "http://localhost:1880",
  nodeRedToken: "",
  nodeRedAuthHeader: "",
  nodeRedBasicUser: "",
  nodeRedBasicPassword: "",
  nodeRedAPIVersion: "v1",
  nodeRedTimeoutMs: DEFAULT_NODE_RED_TIMEOUT_MS,
  apiPrefix: "", // API path prefix, e.g., "/api/v1" or "/node-red"
  transportType: "stdio",
  verbose: false,
  readOnly: false,
  backup: {
    enabled: true,
    backupPath: undefined,
    maxBackups: 10,
    autoCleanup: true,
    autoBeforeMutations: false,
  },
};

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function parseOptionalBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return parseBoolean(value);
}

function normalizeConfig(userConfig) {
  const userBackup = userConfig.backup || {};

  const backup = {
    ...defaultConfig.backup,
    ...userBackup,
    enabled: firstDefined(
      userBackup.enabled,
      process.env.MCP_BACKUPS_ENABLED !== undefined
        ? parseBoolean(process.env.MCP_BACKUPS_ENABLED)
        : undefined,
      defaultConfig.backup.enabled
    ),
    backupPath: firstDefined(
      userBackup.backupPath,
      process.env.MCP_BACKUP_PATH,
      defaultConfig.backup.backupPath
    ),
    maxBackups: firstDefined(
      userBackup.maxBackups !== undefined
        ? parsePositiveInteger(userBackup.maxBackups, "backup.maxBackups")
        : undefined,
      parsePositiveInteger(process.env.MCP_MAX_BACKUPS, "MCP_MAX_BACKUPS"),
      defaultConfig.backup.maxBackups
    ),
    autoCleanup: firstDefined(
      userBackup.autoCleanup,
      process.env.MCP_BACKUP_AUTO_CLEANUP !== undefined
        ? parseBoolean(process.env.MCP_BACKUP_AUTO_CLEANUP)
        : undefined,
      defaultConfig.backup.autoCleanup
    ),
    autoBeforeMutations: firstDefined(
      userBackup.autoBeforeMutations,
      process.env.MCP_AUTO_BACKUP !== undefined
        ? parseBoolean(process.env.MCP_AUTO_BACKUP)
        : undefined,
      defaultConfig.backup.autoBeforeMutations
    ),
  };

  return {
    ...defaultConfig,
    ...userConfig,
    nodeRedUrl: firstDefined(
      userConfig.nodeRedUrl,
      process.env.NODE_RED_URL,
      defaultConfig.nodeRedUrl
    ),
    nodeRedToken: firstDefined(
      userConfig.nodeRedToken,
      process.env.NODE_RED_TOKEN,
      defaultConfig.nodeRedToken
    ),
    nodeRedAuthHeader: firstDefined(
      userConfig.nodeRedAuthHeader,
      process.env.NODE_RED_AUTH_HEADER,
      defaultConfig.nodeRedAuthHeader
    ),
    nodeRedBasicUser: firstDefined(
      userConfig.nodeRedBasicUser,
      process.env.NODE_RED_BASIC_USER,
      defaultConfig.nodeRedBasicUser
    ),
    nodeRedBasicPassword: firstDefined(
      userConfig.nodeRedBasicPassword,
      process.env.NODE_RED_BASIC_PASSWORD,
      defaultConfig.nodeRedBasicPassword
    ),
    apiPrefix: firstDefined(
      userConfig.apiPrefix,
      process.env.NODE_MCP_PREFIX,
      defaultConfig.apiPrefix
    ),
    nodeRedTimeoutMs: firstDefined(
      userConfig.nodeRedTimeoutMs !== undefined
        ? parsePositiveInteger(userConfig.nodeRedTimeoutMs, "nodeRedTimeoutMs")
        : undefined,
      parsePositiveInteger(process.env.NODE_RED_TIMEOUT_MS, "NODE_RED_TIMEOUT_MS"),
      defaultConfig.nodeRedTimeoutMs
    ),
    verbose: firstDefined(
      userConfig.verbose,
      parseOptionalBoolean(process.env.MCP_VERBOSE, undefined),
      defaultConfig.verbose
    ),
    readOnly: firstDefined(
      userConfig.readOnly,
      process.env.MCP_READ_ONLY !== undefined
        ? parseBoolean(process.env.MCP_READ_ONLY)
        : undefined,
      defaultConfig.readOnly
    ),
    backup,
  };
}

/**
 * Creates and configures an MCP server for Node-RED
 * @param {Object} userConfig - User configuration
 * @returns {Object} Object with start method and other utilities
 */
export function createServer(userConfig = {}) {
  const config = normalizeConfig(userConfig);
  let lastConnectionError = null;

  // Create MCP server
  const server = new McpServer({
    name: config.serverName,
    version: config.serverVersion,
  });

  // Register all tools
  registerFlowTools(server, config);
  registerNodeTools(server, config);
  registerSettingsTools(server, config);
  registerUtilityTools(server, config);
  registerBackupTools(server, config);

  /**
   * Tests the connection to Node-RED
   * @returns {Promise<boolean>} True if connection is successful
   */
  async function testNodeRedConnection() {
    try {
      const headers = buildNodeRedAuthHeaders(config);
      await axios.get(config.nodeRedUrl, {
        headers,
        timeout: config.nodeRedTimeoutMs,
      });
      lastConnectionError = null;
      return true;
    } catch (error) {
      lastConnectionError = error;
      return false;
    }
  }

  /**
   * Starts the MCP server
   * @returns {Promise<void>}
   */
  async function start() {
    // Test Node-RED connection but don't stop if it fails
    const connected = await testNodeRedConnection();
    if (config.verbose) {
      if (connected) {
        console.error("[node-red-mcp] Node-RED connection check succeeded");
      } else {
        console.error(
          `[node-red-mcp] Node-RED connection check failed: ${
            lastConnectionError?.message || "unknown error"
          }`
        );
      }
    }

    // Create transport based on settings
    let transport;

    if (config.transportType === "stdio") {
      transport = new StdioServerTransport();
    } else {
      throw new Error(`Unsupported transport type: ${config.transportType}`);
    }

    // Connect server through transport
    await server.connect(transport);
  }

  return {
    server,
    config,
    start,
    testNodeRedConnection,
  };
}

// If this file is run directly (not imported as a module)
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  createServer()
    .start()
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}

export { defaultConfig, normalizeConfig };
