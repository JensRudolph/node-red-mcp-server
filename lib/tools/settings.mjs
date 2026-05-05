/**
 * MCP tools for working with Node-RED settings
 */

import { callNodeRed, jsonResponse, runTool } from "../utils.mjs";

/**
 * Registers tools for working with settings in the MCP server
 * @param {Object} server - Instance of the MCP server
 * @param {Object} config - Server configuration
 */
export default function registerSettingsTools(server, config) {
  // Retrieve runtime settings
  server.tool(
    "get-settings",
    "Retrieves the runtime settings of the Node-RED instance. This tool returns the current configuration settings of the Node-RED server.",
    {},
    async () => runTool("Get settings", async () => {
      const settings = await callNodeRed("get", "/settings", null, config);
      return jsonResponse(settings);
    })
  );

  // Retrieve diagnostics
  server.tool(
    "get-diagnostics",
    "Retrieves diagnostic information from the Node-RED instance. This tool returns detailed runtime diagnostics, including system status and performance metrics.",
    {},
    async () => runTool("Get diagnostics", async () => {
      const diagnostics = await callNodeRed(
        "get",
        "/diagnostics",
        null,
        config
      );
      return jsonResponse(diagnostics);
    })
  );
}
