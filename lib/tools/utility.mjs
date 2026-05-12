/**
 * MCP Utility Tools for Node-RED
 */

import { runTool, textResponse } from "../utils.mjs";

/**
 * Registers utility tools on the MCP server
 * @param {Object} server - Instance of the MCP server
 * @param {Object} config - Server configuration
 */
export default function registerUtilityTools(server, config) {
  // Node-RED API Help
  server.tool(
    "api-help",
    "Displays a help table of all available Node-RED Admin API methods, including their implementation status in the MCP server. This tool provides a quick reference for available API endpoints.",
    {},
    async () => runTool("Show API help", async () => {
      const prefix = config.apiPrefix || "";
      const endpoints = [
        { method: "GET", path: "/flows", description: "Get all flows" },
        { method: "POST", path: "/flows", description: "Update all flows" },
        {
          method: "GET",
          path: "/flow/:id",
          description: "Get a specific flow",
        },
        {
          method: "PUT",
          path: "/flow/:id",
          description: "Update a specific flow",
        },
        {
          method: "GET",
          path: "/flow/global",
          description: "Get global configs and subflows",
        },
        {
          method: "PUT",
          path: "/flow/global",
          description: "Update global configs and subflows",
        },
        {
          method: "DELETE",
          path: "/flow/:id",
          description: "Delete a specific flow",
        },
        { method: "POST", path: "/flow", description: "Create a new flow" },
        {
          method: "GET",
          path: "/flows/state",
          description: "Get the state of flows",
        },
        {
          method: "POST",
          path: "/flows/state",
          description: "Set the state of flows",
        },
        {
          method: "GET",
          path: "/nodes",
          description: "Get list of installed nodes",
        },
        {
          method: "POST",
          path: "/nodes",
          description: "Install a new node module",
        },
        {
          method: "GET",
          path: "/settings",
          description: "Get runtime settings",
        },
        {
          method: "GET",
          path: "/diagnostics",
          description: "Get diagnostics information",
        },
        {
          method: "POST",
          path: "/inject/:id",
          description: "Trigger an inject node",
        },
        {
          method: "GET",
          path: "/nodes/:module",
          description: "Get a node module's information",
        },
        {
          method: "PUT",
          path: "/nodes/:module",
          description: "Enable/disable a node module",
        },
        {
          method: "GET",
          path: "/nodes/:module/:set",
          description: "Get node module set information",
        },
        {
          method: "PUT",
          path: "/nodes/:module/:set",
          description: "Enable/disable a node set",
        },
      ];

      const implementedMethods = {
        "GET /flows": true,
        "POST /flows": config.allowFullFlowWrites === true,
        "GET /flow/:id": true,
        "PUT /flow/:id": true,
        "GET /flow/global": true,
        "PUT /flow/global": true,
        "POST /inject/:id": true,
        "POST /flow": true,
        "DELETE /flow/:id": true,
        "GET /flows/state": true,
        "POST /flows/state": true,
        "GET /nodes": true,
        "POST /nodes": true,
        "GET /nodes/:module": true,
        "PUT /nodes/:module": true,
        "GET /nodes/:module/:set": true,
        "PUT /nodes/:module/:set": true,
        "GET /settings": true,
        "GET /diagnostics": true,
      };

      const output = [
        "# Node-RED API Help",
        "",
        prefix
          ? `**API Prefix**: ${prefix}`
          : "**API Prefix**: None (using default Node-RED paths)",
        "",
        "| Method | Path | Description | Implemented in MCP |",
        "|--------|------|-------------|---------------------|",
      ];

      endpoints.forEach((endpoint) => {
        const key = `${endpoint.method} ${endpoint.path}`;
        const displayPath = prefix ? prefix + endpoint.path : endpoint.path;
        output.push(
          `| ${endpoint.method} | ${displayPath} | ${endpoint.description} | ${
            implementedMethods[key] ? "yes" : "no"
          } |`
        );
      });

      output.push(
        "",
        "## Safety-focused MCP tools",
        "",
        "- validate-flow-payload: validate a payload before writing",
        "- validate-subflow-payload: validate a subflow payload before writing",
        "- dry-run-create-flow: preview flow creation without mutation",
        "- dry-run-create-subflow: preview subflow creation without mutation",
        "- dry-run-update-subflow: preview subflow replacement without mutation",
        "- clone-flow: clone a flow with ID remapping; dry-run is default",
        "- create-subflow: create a subflow using scoped PUT /flow/global",
        "- clone-subflow: clone a subflow with ID remapping; dry-run is default",
        "- update-subflow: replace one subflow using scoped PUT /flow/global",
        "- replace-in-flow: scoped replacements; dry-run is default",
        "- clear-entities-in-flow: neutralize matching HA entities; dry-run is default",
        "- undo-last-mutation: preview or restore the latest automatic mutation backup",
        "- entity-audit: extract and categorize Home Assistant entities",
        "- diff-flow-against-source: compare cloned/source flows with optional ID mapping",
        "- get-nodes/search-nodes: filter large installations before returning details",
        "",
        config.allowFullFlowWrites
          ? "Full /flows write tools are enabled."
          : "Full /flows write tools are disabled. Set MCP_ALLOW_FULL_FLOW_WRITES=true only for last-resort operations."
      );

      return textResponse(output.join("\n"));
    })
  );
}
