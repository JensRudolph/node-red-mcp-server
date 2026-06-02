/**
 * MCP tools for working with Node-RED nodes
 */

import { z } from "zod";
import {
  filterNodes,
  shapeNodeForResponse,
  shapeNodesForResponse,
  shapeValueForResponse,
  searchNodeFields,
} from "../flow-analysis.mjs";
import { callNodeRed, jsonResponse, runTool, textResponse } from "../utils.mjs";
import {
  formatMutationAudit,
  getBackupFlows,
  runMutationWithBackup,
} from "./backup.mjs";

const responseShapeArgs = {
  includeFullValues: z
    .boolean()
    .optional()
    .describe("Return complete string values instead of truncating long fields"),
  maxStringLength: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Maximum string length in the response; defaults to MCP_MAX_STRING_LENGTH"),
};

const nodeProjectionArgs = {
  ...responseShapeArgs,
  fields: z
    .array(z.string())
    .optional()
    .describe("Only include these node fields/paths plus id/type/name/label/z/g"),
  omitFields: z
    .array(z.string())
    .optional()
    .describe("Omit these node fields/paths from the response"),
};

function responseShapeOptions(args = {}, config = {}) {
  return {
    ...args,
    defaultMaxStringLength: config.maxStringLength,
  };
}

function tabLabelsById(flows) {
  return new Map(
    flows
      .filter((node) => node?.type === "tab")
      .map((tab) => [tab.id, tab.label || tab.name || ""])
  );
}

function nodeMetadata(node, flows, source = {}) {
  const labels = tabLabelsById(flows);
  return {
    ...source,
    id: node.id,
    type: node.type || "",
    name: node.name || node.label || "",
    flowId: node.z || null,
    flowLabel: node.z ? labels.get(node.z) || null : null,
  };
}

function findNodeBySelection(flows, args = {}) {
  if (args.id) {
    const node = flows.find((item) => item.id === args.id);
    if (!node) {
      throw new Error(`Node '${args.id}' was not found`);
    }
    return node;
  }

  const candidates = filterNodes(flows, {
    flowId: args.flowId,
    flowLabel: args.flowLabel,
    nodeType: args.nodeType,
    name: args.name,
    includeTabs: args.includeTabs,
  });

  if (candidates.length === 0) {
    throw new Error("No node matched the selection");
  }

  if (candidates.length > 1) {
    throw new Error(`Selection matched ${candidates.length} nodes; refine by id`);
  }

  return candidates[0];
}

function mergeRanges(ranges) {
  const sorted = ranges
    .filter((range) => range.start <= range.end)
    .sort((a, b) => a.start - b.start);
  const merged = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || range.start > previous.end + 1) {
      merged.push({ ...range });
    } else {
      previous.end = Math.max(previous.end, range.end);
    }
  }

  return merged;
}

function buildFunctionContext(node, flows, args = {}, config = {}, source = {}) {
  if (typeof node.func !== "string") {
    throw new Error(`Node '${node.id}' does not have a string func field`);
  }

  const lines = node.func.split("\n");
  const contextLines = args.contextLines ?? 5;
  const maxMatches = args.maxMatches ?? 20;
  const maxLineLength = args.maxLineLength ?? args.maxStringLength;
  const shapeOptions = responseShapeOptions(
    { ...args, maxStringLength: maxLineLength },
    config
  );
  const ranges = [];
  const matches = [];

  if (args.line !== undefined) {
    const lineIndex = Math.min(lines.length - 1, Math.max(0, args.line - 1));
    ranges.push({
      start: Math.max(1, lineIndex + 1 - contextLines),
      end: Math.min(lines.length, lineIndex + 1 + contextLines),
    });
  } else if (args.query || args.regex) {
    const regex = args.regex ? new RegExp(args.regex, args.regexFlags || "") : null;
    for (let index = 0; index < lines.length && matches.length < maxMatches; index += 1) {
      if (regex) regex.lastIndex = 0;
      const matched = regex ? regex.test(lines[index]) : lines[index].includes(args.query);
      if (!matched) continue;
      const lineNumber = index + 1;
      matches.push({ line: lineNumber, text: lines[index] });
      ranges.push({
        start: Math.max(1, lineNumber - contextLines),
        end: Math.min(lines.length, lineNumber + contextLines),
      });
    }
  } else {
    const limitLines = args.limitLines ?? 80;
    ranges.push({ start: 1, end: Math.min(lines.length, limitLines) });
  }

  const returnedRanges = mergeRanges(ranges).map((range) => ({
    ...range,
    lines: lines.slice(range.start - 1, range.end).map((text, offset) => {
      const shaped = shapeValueForResponse(text, shapeOptions, ["text"]);
      return {
        line: range.start + offset,
        text: shaped.value,
        truncated: shaped.truncations.length > 0,
        originalLength: shaped.truncations[0]?.originalLength ?? null,
      };
    }),
  }));

  return {
    node: nodeMetadata(node, flows, source),
    function: {
      totalLines: lines.length,
      returnedRanges,
      matches: matches.map((match) => {
        const shaped = shapeValueForResponse(match.text, shapeOptions, ["text"]);
        return {
          line: match.line,
          text: shaped.value,
          truncated: shaped.truncations.length > 0,
          originalLength: shaped.truncations[0]?.originalLength ?? null,
        };
      }),
      truncatedMatches: matches.length >= maxMatches,
    },
  };
}

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
      ...responseShapeArgs,
    },
    async (args) => runTool("Search nodes", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);
      const nodes = filterNodes(flows, args);
      const matches = searchNodeFields(nodes, responseShapeOptions(args, config));

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
      ...nodeProjectionArgs,
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
        nodes: shapeNodesForResponse(
          selected,
          responseShapeOptions(args, config)
        ),
      });
    })
  );

  server.tool(
    "get-node",
    "Retrieve one live Node-RED node by id or an exact-enough selector, with optional field projection and string truncation.",
    {
      id: z.string().optional().describe("Node id to retrieve"),
      flowId: z.string().optional().describe("Limit selector to one flow id"),
      flowLabel: z.string().optional().describe("Limit selector to one flow label"),
      nodeType: z.string().optional().describe("Limit selector to one node type"),
      name: z.string().optional().describe("Limit selector to node names containing this text"),
      includeTabs: z.boolean().optional().describe("Allow tab nodes in selector"),
      ...nodeProjectionArgs,
    },
    async (args) => runTool("Get node", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);
      const node = findNodeBySelection(flows, args);
      return jsonResponse({
        metadata: nodeMetadata(node, flows, { source: "live" }),
        node: shapeNodeForResponse(node, responseShapeOptions(args, config)),
      });
    })
  );

  server.tool(
    "get-function-context",
    "Return targeted line context from a function node, from live flows or from a named backup, without returning the whole func field.",
    {
      backupName: z.string().optional().describe("Read from this backup instead of live Node-RED"),
      id: z.string().optional().describe("Function node id"),
      flowId: z.string().optional().describe("Limit selector to one flow id"),
      flowLabel: z.string().optional().describe("Limit selector to one flow label"),
      name: z.string().optional().describe("Limit selector to function node names containing this text"),
      query: z.string().optional().describe("Return context around lines containing this string"),
      regex: z.string().optional().describe("Return context around lines matching this regex"),
      regexFlags: z.string().optional().describe("Regex flags for regex matching"),
      line: z.number().int().positive().optional().describe("Return context around this 1-based line"),
      contextLines: z.number().int().nonnegative().optional().describe("Lines before and after each match; default 5"),
      maxMatches: z.number().int().positive().optional().describe("Maximum matching lines to return; default 20"),
      limitLines: z.number().int().positive().optional().describe("Lines to return when no query/regex/line is provided; default 80"),
      maxLineLength: z.number().int().nonnegative().optional().describe("Maximum returned line length"),
      ...responseShapeArgs,
    },
    async (args) => runTool("Get function context", async () => {
      const flows = args.backupName
        ? (await getBackupFlows(args.backupName, config)).flows
        : await callNodeRed("get", "/flows", null, config);
      const node = findNodeBySelection(flows, {
        ...args,
        nodeType: "function",
      });
      return jsonResponse(
        buildFunctionContext(node, flows, args, config, {
          source: args.backupName ? "backup" : "live",
          backupName: args.backupName || null,
        })
      );
    })
  );
}
