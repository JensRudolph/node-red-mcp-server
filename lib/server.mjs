/**
 * MCP server for Node-RED
 * Allows language models to interact with Node-RED through the MCP protocol
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import axios from "axios";
import { buildNodeRedAuthHeaders } from "./utils.mjs";

// Import tool registrars
import registerFlowTools from "./tools/flows.mjs";
import registerNodeTools from "./tools/nodes.mjs";
import registerSettingsTools from "./tools/settings.mjs";
import registerUtilityTools from "./tools/utility.mjs";
import registerBackupTools from "./tools/backup.mjs";

/**
 * Default server settings
 */
const defaultConfig = {
  serverName: "node-red-mcp-server",
  serverVersion: "1.0.0",
  nodeRedUrl: "http://localhost:1880",
  nodeRedToken: "",
  nodeRedAuthHeader: "",
  nodeRedBasicUser: "",
  nodeRedBasicPassword: "",
  nodeRedAPIVersion: "v1",
  apiPrefix: "", // API path prefix, e.g., "/api/v1" or "/node-red"
  transportType: "stdio",
  verbose: false,
  readOnly: false,
  backup: {
    enabled: true,
    backupPath: "~/.node-red/",
    maxBackups: 10,
    autoCleanup: true,
  },
};

function parseBoolean(value) {
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

/**
 * Creates and configures an MCP server for Node-RED
 * @param {Object} userConfig - User configuration
 * @returns {Object} Object with start method and other utilities
 */
export function createServer(userConfig = {}) {
  // Merge configuration
  const config = {
    ...defaultConfig,
    ...userConfig,
    nodeRedUrl:
      userConfig.nodeRedUrl ||
      process.env.NODE_RED_URL ||
      defaultConfig.nodeRedUrl,
    nodeRedToken:
      userConfig.nodeRedToken ||
      process.env.NODE_RED_TOKEN ||
      defaultConfig.nodeRedToken,
    nodeRedAuthHeader:
      userConfig.nodeRedAuthHeader ||
      process.env.NODE_RED_AUTH_HEADER ||
      defaultConfig.nodeRedAuthHeader,
    nodeRedBasicUser:
      userConfig.nodeRedBasicUser ||
      process.env.NODE_RED_BASIC_USER ||
      defaultConfig.nodeRedBasicUser,
    nodeRedBasicPassword:
      userConfig.nodeRedBasicPassword ||
      process.env.NODE_RED_BASIC_PASSWORD ||
      defaultConfig.nodeRedBasicPassword,
    apiPrefix:
      userConfig.apiPrefix !== undefined
        ? userConfig.apiPrefix
        : process.env.NODE_MCP_PREFIX || defaultConfig.apiPrefix,
    readOnly:
      userConfig.readOnly !== undefined
        ? userConfig.readOnly
        : parseBoolean(process.env.MCP_READ_ONLY),
  };

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
      await axios.get(config.nodeRedUrl, { headers, timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Starts the MCP server
   * @returns {Promise<void>}
   */
  async function start() {
    // Test Node-RED connection but don't stop if it fails
    try {
      await testNodeRedConnection();
    } catch (_) {
      // Ignore errors
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
  import.meta.url.startsWith("file:") &&
  import.meta.url === `file://${process.argv[1]}`
) {
  try {
    const server = createServer();
    server.start();
  } catch (err) {
    process.exit(1);
  }
}

export { defaultConfig };
