/**
 * MCP tools for working with Node-RED nodes
 */

import { z } from "zod";
import {
  filterNodes,
  searchNodeFields,
} from "../flow-analysis.mjs";
import { callNodeRed, jsonResponse, runTool, textResponse } from "../utils.mjs";
import { formatMutationAudit, runMutationWithBackup } from "./backup.mjs";

function getAttribute(attributes, name) {
  const match = attributes.match(
    new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i")
  );
  return match ? match[1] : "";
}

function assertSafePathPart(value, name) {
  if (/(^|\/)\.\.(\/|$)|[?#]/.test(value)) {
    throw new Error(`${name} contains characters that are not safe for API paths`);
  }
}

function extractNodesForModule(moduleName, nodeHtml) {
  const helpByName = new Map();
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let scriptMatch;

  while ((scriptMatch = scriptPattern.exec(nodeHtml)) !== null) {
    const helpName = getAttribute(scriptMatch[1], "data-help-name");
    if (helpName) {
      helpByName.set(helpName, scriptMatch[2].trim());
    }
  }

  const nodeNames = new Set();
  const typePattern = /registerType\s*\(\s*['"]([^'"]+)['"]/g;
  let typeMatch;

  while ((typeMatch = typePattern.exec(nodeHtml)) !== null) {
    nodeNames.add(typeMatch[1]);
  }

  return [...nodeNames].map((name) => ({
    name,
    help: helpByName.get(name) || "",
    module: moduleName,
  }));
}

export function extractAvailableNodesFromHtml(htmlString) {
  const html = String(htmlString || "");
  const nodePattern =
    /<!--\s*---\s*\[red-module:([^\]]+)\]\s*---\s*-->([\s\S]*?)(?=<!--\s*---\s*\[red-module:|$)/g;
  const result = [];
  let match;

  while ((match = nodePattern.exec(html)) !== null) {
    result.push(...extractNodesForModule(match[1], match[2]));
  }

  return result.length > 0 ? result : extractNodesForModule("", html);
}

/**
 * Registers node-related tools in the MCP server
 * @param {Object} server - MCP server instance
 * @param {Object} config - Server configuration
 */
export default function registerNodeTools(server, config) {
  if (!config.readOnly) {
    // Trigger inject node
    server.tool(
      "inject",
      "Triggers an inject node in the Node-RED instance by its ID. This tool simulates an input event for the specified inject node.",
      { id: z.string().describe("Inject node ID") },
      async ({ id }) => runTool("Trigger inject node", async () => {
        const audit = await runMutationWithBackup(
          config,
          `Before inject ${id}`,
          async () => callNodeRed(
            "post",
            `/inject/${encodeURIComponent(id)}`,
            null,
            config
          )
        );
        return textResponse(
          `Inject node ${id} triggered${formatMutationAudit(audit)}`
        );
      })
    );
  }

  // Get list of installed nodes
  server.tool(
    "get-available-nodes",
    "Retrieves a list of all installed nodes their information (name,help,module) in the Node-RED instance.",
    {},
    async () => runTool("Get available nodes", async () => {
      const htmlString = await callNodeRed("get", "/nodes", null, config);
      return jsonResponse(extractAvailableNodesFromHtml(htmlString));
    })
  );

  // Get information about a specific module
  server.tool(
    "get-node-detailed-info",
    "Retrieves source code about a specific node module by its name. Args: module (e.g.'node-red/inject')",
    { module: z.string().describe("Node module name") },
    async ({ module }) => runTool("Get node detailed info", async () => {
      assertSafePathPart(module, "module");
      const info = await callNodeRed("get", "/nodes/" + module, null, config);
      return jsonResponse(info);
    })
  );
  // Get  source code about a node module set
  server.tool(
    "get-node-set-detailed-info",
    "Retrieves source code about a specific node module by its name. Args: module (e.g.'@supcon-international/node-red-function-gpt-with-memory') set (e.g.'function-gpt')",
    {
      module: z.string().describe("Node module name"),
      set: z.string().describe("Node module set name"),
    },
    async ({ module, set }) => runTool("Get node set detailed info", async () => {
      assertSafePathPart(module, "module");
      assertSafePathPart(set, "set");
      const info = await callNodeRed(
        "get",
        "/nodes/" + module + "/" + set,
        null,
        config
      );
      return jsonResponse(info);
    })
  );
  if (!config.readOnly) {
    // Install node module
    server.tool(
      "install-node-module",
      "Install a specific node module in the Node-RED instance. Args: module (e.g.'node-red-dashboard')",
      {
        module: z
          .string()
          .regex(
            /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i,
            "Use an npm package name, for example node-red-dashboard"
          )
          .describe("Node module package name"),
      },
      async ({ module }) => runTool("Install node module", async () => {
        const audit = await runMutationWithBackup(
          config,
          `Before install-node-module ${module}`,
          async () => callNodeRed("post", "/nodes", { module }, config)
        );
        return jsonResponse({
          result: audit.result,
          backup: audit.backup,
          diff: audit.diff?.metadata,
          diffSummary: audit.diff?.summary,
          diffError: audit.diffError,
        });
      })
    );
  }

  if (!config.readOnly) {
    // Enable/disable node module
    server.tool(
      "toggle-node-module",
      "Enables or disables a specific node module in the Node-RED instance. Args: module (e.g.'node-red/inject') enabled (e.g.'true')",
      {
        module: z.string().describe("Node module name"),
        enabled: z.boolean().describe("true to enable, false to disable"),
      },
      async ({ module, enabled }) => runTool("Toggle node module", async () => {
        assertSafePathPart(module, "module");
        const audit = await runMutationWithBackup(
          config,
          `Before toggle-node-module ${module}`,
          async () => callNodeRed("put", "/nodes/" + module, { enabled }, config)
        );
        return textResponse(
          `Module ${module} ${enabled ? "enabled" : "disabled"}${formatMutationAudit(audit)}`
        );
      })
    );
  }
  if (!config.readOnly) {
    // Enable/disable node module set
    server.tool(
      "toggle-node-module-set",
      "Enables or disables a specific node module set in the Node-RED instance. Args: module (e.g.'@supcon-international/node-red-function-gpt-with-memory') set (e.g.'function-gpt') enabled (e.g.'true')",
      {
        module: z.string().describe("Node module name"),
        set: z.string().describe("Node module set name"),
        enabled: z.boolean().describe("true to enable, false to disable"),
      },
      async ({ module, set, enabled }) => runTool("Toggle node module set", async () => {
        assertSafePathPart(module, "module");
        assertSafePathPart(set, "set");
        const audit = await runMutationWithBackup(
          config,
          `Before toggle-node-module-set ${module}/${set}`,
          async () => callNodeRed(
            "put",
            "/nodes/" + module + "/" + set,
            { enabled },
            config
          )
        );
        return textResponse(
          `Module ${module} set ${set} ${enabled ? "enabled" : "disabled"}${formatMutationAudit(audit)}`
        );
      })
    );
  }

  // Find nodes by type
  server.tool(
    "find-nodes-by-type",
    "Searches for nodes in the Node-RED instance by their type. Args: nodeType (e.g.'inject')",
    { nodeType: z.string().describe("Node type to search for") },
    async ({ nodeType }) => runTool("Find nodes by type", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);
      const nodes = flows.filter((node) => node.type === nodeType);

      return textResponse(
        nodes.length > 0
          ? `Found ${nodes.length} nodes of type "${nodeType}":\n\n${JSON.stringify(
              nodes,
              null,
              2
            )}`
          : `No nodes of type "${nodeType}" found`
      );
    })
  );

  // Search nodes by name/properties
  server.tool(
    "search-nodes",
    "Searches for nodes and returns structured field-level matches. Supports optional flow and node filters to avoid oversized responses.",
    {
      query: z.string().optional().describe("String to search in node properties"),
      property: z
        .string()
        .optional()
        .describe("Specific property/path to search (optional)"),
      regex: z.string().optional().describe("Regex to search in property values"),
      flowId: z.string().optional().describe("Limit search to one flow id"),
      flowLabel: z.string().optional().describe("Limit search to one flow label"),
      nodeType: z.string().optional().describe("Limit search to one node type"),
      name: z.string().optional().describe("Limit search to node names containing this text"),
      entityId: z.string().optional().describe("Limit search to nodes referencing this entity id"),
      subflowId: z.string().optional().describe("Limit search to nodes inside this subflow"),
      includeTabs: z.boolean().optional().describe("Include tab nodes in the search"),
    },
    async (args) => runTool("Search nodes", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);
      const nodes = filterNodes(flows, args);
      const matches = searchNodeFields(nodes, args);

      return jsonResponse({
        summary: {
          scannedNodes: nodes.length,
          matches: matches.length,
          query: args.query || null,
          regex: args.regex || null,
          property: args.property || null,
        },
        matches,
      });
    })
  );

  server.tool(
    "get-nodes",
    "Retrieves nodes with combinable filters such as flowId, flowLabel, nodeType, name, entityId, subflowId, and arbitrary exact property matches.",
    {
      flowId: z.string().optional().describe("Limit to one flow id"),
      flowLabel: z.string().optional().describe("Limit to one flow label"),
      nodeType: z.string().optional().describe("Limit to one node type"),
      name: z.string().optional().describe("Limit to node names containing this text"),
      entityId: z.string().optional().describe("Limit to nodes referencing this entity id"),
      subflowId: z.string().optional().describe("Limit to nodes inside this subflow"),
      properties: z
        .record(z.any())
        .optional()
        .describe("Exact property/path filters, for example {\"server\":\"abc\"}"),
      includeTabs: z.boolean().optional().describe("Include tab nodes"),
      limit: z.number().int().nonnegative().optional().describe("Maximum nodes to return"),
      offset: z.number().int().nonnegative().optional().describe("Nodes to skip"),
    },
    async (args) => runTool("Get nodes", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);
      const nodes = filterNodes(flows, args);
      const offset = args.offset || 0;
      const selected = nodes.slice(
        offset,
        args.limit === undefined ? undefined : offset + args.limit
      );

      return jsonResponse({
        summary: {
          totalMatches: nodes.length,
          returned: selected.length,
          offset,
          limit: args.limit ?? null,
        },
        nodes: selected,
      });
    })
  );
}
