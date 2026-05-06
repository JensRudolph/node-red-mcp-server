/**
 * MCP tools for working with Node-RED flows
 */

import { z } from "zod";
import {
  buildDirectFlowUpdatePayload,
  callNodeRed,
  formatFlowsOutput,
  getFlowsWithRevision,
  jsonResponse,
  postFlowsWithRevision,
  readStructuredOrJsonArgument,
  replaceFlowInCompleteFlows,
  runTool,
  textResponse,
} from "../utils.mjs";
import { formatMutationAudit, runMutationWithBackup } from "./backup.mjs";

const flowNodeSchema = z.record(z.any());
const flowConfigSchema = z.record(z.any());

/**
 * Registers flow-related tools in the MCP server
 * @param {Object} server - MCP server instance
 * @param {Object} config - Server configuration
 */
export default function registerFlowTools(server, config) {
  // Get all flows
  server.tool(
    "get-flows",
    "Retrieves the complete list of flows from the Node-RED instance.",
    {},
    async () => runTool("Get flows", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);
      return jsonResponse(flows);
    })
  );

  if (!config.readOnly) {
    // Update flows
    server.tool(
      "update-flows",
      "Safely updates the entire flow configuration using Node-RED API v2 revision locking. Prefer the structured 'flows' argument; 'flowsJson' is kept for backwards compatibility.",
      {
        flows: z
          .array(flowNodeSchema)
          .optional()
          .describe("Complete Node-RED flow array"),
        flowsJson: z
          .string()
          .optional()
          .describe("Deprecated fallback: complete flow array as JSON"),
      },
      async (args) => runTool("Update flows", async () => {
        const flowsObj = readStructuredOrJsonArgument(
          args,
          "flows",
          "flowsJson"
        );
        if (!Array.isArray(flowsObj)) {
          throw new Error("flows must be an array");
        }

        const audit = await runMutationWithBackup(
          config,
          "Before update-flows",
          async () => {
            const current = await getFlowsWithRevision(config);
            return postFlowsWithRevision(current, flowsObj, config, "full");
          }
        );
        const result = audit.result;
        const revText = result?.rev ? ` New revision: ${result.rev}` : "";
        return textResponse(
          `Flows updated safely.${revText}${formatMutationAudit(audit)}`
        );
      })
    );
  }

  // Get flow by ID
  server.tool(
    "get-flow",
    "Retrieves the configuration of a specific flow by its ID. Args: id (e.g.'396c237c693dc')",
    { id: z.string().describe("Flow ID") },
    async ({ id }) => runTool("Get flow", async () => {
      const flow = await callNodeRed(
        "get",
        `/flow/${encodeURIComponent(id)}`,
        null,
        config
      );
      return jsonResponse(flow);
    })
  );

  if (!config.readOnly) {
    // Update flow by ID
    server.tool(
      "update-flow",
      "Updates a specific flow by its id using Node-RED's direct PUT /flow/:id endpoint. This limits the write scope to that flow instead of rewriting the complete flow set. Prefer the structured 'flow' argument; 'flowJson' is kept for backwards compatibility.",
      {
        id: z.string().describe("Flow ID"),
        flow: flowConfigSchema
          .optional()
          .describe("Single-flow configuration object"),
        flowJson: z
          .string()
          .optional()
          .describe("Deprecated fallback: single-flow configuration as JSON"),
      },
      async (args) => runTool("Update flow", async () => {
          const { id } = args;
          const flowObj = readStructuredOrJsonArgument(args, "flow", "flowJson");
          const payload = buildDirectFlowUpdatePayload(id, flowObj);
          const audit = await runMutationWithBackup(
            config,
            `Before direct update-flow ${id}`,
            async () => callNodeRed(
              "put",
              `/flow/${encodeURIComponent(id)}`,
              payload,
              config
            )
          );
          const result = audit.result;
          return textResponse(
            `Flow ${id} updated using direct PUT /flow/:id.${result?.rev ? `\nNew revision: ${result.rev}` : ""}${formatMutationAudit(audit)}`
          );
      })
    );
  }

  if (!config.readOnly) {
    // Legacy update flow by replacing it in the complete flow set.
    server.tool(
      "update-flow-full",
      "Updates a specific flow by reading GET /flows and writing POST /flows with optimistic locking. This rewrites the complete flow set and should only be used when direct update-flow is insufficient.",
      {
        id: z.string().describe("Flow ID"),
        flow: flowConfigSchema
          .optional()
          .describe("Single-flow configuration object"),
        flowJson: z
          .string()
          .optional()
          .describe("Deprecated fallback: single-flow configuration as JSON"),
      },
      async (args) => runTool("Update flow full", async () => {
          const { id } = args;
          const flowObj = readStructuredOrJsonArgument(args, "flow", "flowJson");
          const payload = buildDirectFlowUpdatePayload(id, flowObj);
          const audit = await runMutationWithBackup(
            config,
            `Before update-flow-full ${id}`,
            async () => {
              const current = await getFlowsWithRevision(config);
              const nextFlows = replaceFlowInCompleteFlows(
                current.flows,
                id,
                payload
              );
              return postFlowsWithRevision(current, nextFlows, config, "flows");
            }
          );
          const result = audit.result;
          const revText = result?.rev ? `\nNew revision: ${result.rev}` : "";
          return textResponse(
            `Flow ${id} updated through complete /flows write using optimistic locking.${revText}${formatMutationAudit(audit)}`
          );
      })
    );
  }

  // List tabs
  server.tool(
    "list-tabs",
    "Lists all flow tabs (workspaces) in the Node-RED instance.",
    {},
    async () => runTool("List tabs", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);
      const tabs = flows
        .filter((node) => node.type === "tab")
        .map(
          (node) => `- ${node.label || node.name || "Unnamed"} (ID: ${node.id})`
        );

      return textResponse(tabs.length > 0 ? tabs.join("\n") : "No tabs found");
    })
  );

  if (!config.readOnly) {
    // Create new flow
    server.tool(
      "create-flow",
      "Creates a new flow in the Node-RED instance. Prefer the structured 'flow' argument; 'flowJson' is kept for backwards compatibility.",
      {
        flow: flowConfigSchema.optional().describe("New flow configuration"),
        flowJson: z
          .string()
          .optional()
          .describe("Deprecated fallback: new flow configuration as JSON"),
      },
      async (args) => runTool("Create flow", async () => {
          const flowObj = readStructuredOrJsonArgument(args, "flow", "flowJson");
          const audit = await runMutationWithBackup(
            config,
            "Before create-flow",
            async () => callNodeRed("post", "/flow", flowObj, config)
          );
          return textResponse(
            `New flow created with ID: ${audit.result.id}${formatMutationAudit(audit)}`
          );
      })
    );
  }

  if (!config.readOnly) {
    // Delete flow
    server.tool(
      "delete-flow",
      "Deletes a specific flow from the Node-RED instance by its ID. Args: id (e.g.'396c237c693dc')",
      { id: z.string().describe("Flow ID to delete") },
      async ({ id }) => runTool("Delete flow", async () => {
        const audit = await runMutationWithBackup(
          config,
          `Before delete-flow ${id}`,
          async () => callNodeRed(
            "delete",
            `/flow/${encodeURIComponent(id)}`,
            null,
            config
          )
        );
        return textResponse(`Flow ${id} deleted${formatMutationAudit(audit)}`);
      })
    );
  }

  // Get flows state
  server.tool(
    "get-flows-state",
    "Retrieves the current deployment state of all flows in the Node-RED instance. This tool returns the runtime state of the flows, including their active status.",
    {},
    async () => runTool("Get flows state", async () => {
      const state = await callNodeRed("get", "/flows/state", null, config);
      return jsonResponse(state);
    })
  );

  if (!config.readOnly) {
    // Set flows state
    server.tool(
      "set-flows-state",
      "Updates the deployment state of all flows in the Node-RED instance.",
      {
        state: z.record(z.any()).optional().describe("Flows state object"),
        stateJson: z
          .string()
          .optional()
          .describe("Deprecated fallback: flows state as JSON"),
      },
      async (args) => runTool("Set flows state", async () => {
          const stateObj = readStructuredOrJsonArgument(
            args,
            "state",
            "stateJson"
          );
          const audit = await runMutationWithBackup(
            config,
            "Before set-flows-state",
            async () => callNodeRed("post", "/flows/state", stateObj, config)
          );
          return textResponse(`Flows state updated${formatMutationAudit(audit)}`);
      })
    );
  }

  // Formatted flows output
  server.tool(
    "get-flows-formatted",
    "Retrieves a human-readable, formatted list of all flows in the Node-RED instance.",
    {},
    async () => runTool("Get formatted flows", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);
      const formatted = formatFlowsOutput(flows);

      return jsonResponse(formatted);
    })
  );

  // Structured flows output with visualization
  server.tool(
    "visualize-flows",
    "Generates a graph-like visualization of the flows in the Node-RED instance.",
    {},
    async () => runTool("Visualize flows", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);

      // Group by tabs
      const tabs = flows.filter((node) => node.type === "tab");
      const nodesByTab = Object.fromEntries(tabs.map((tab) => [tab.id, []]));

      flows.forEach((node) => {
        if (node.z && nodesByTab[node.z]) {
          nodesByTab[node.z].push(node);
        }
      });

      // Format output into a more convenient structure
      const result = tabs.map((tab) => {
        const nodes = nodesByTab[tab.id];
        const nodeTypes = {};

        nodes.forEach((node) => {
          if (!nodeTypes[node.type]) nodeTypes[node.type] = 0;
          nodeTypes[node.type]++;
        });

        return {
          id: tab.id,
          name: tab.label || tab.name || "Unnamed",
          nodes: nodes.length,
          nodeTypes: Object.entries(nodeTypes)
            .map(([type, count]) => `${type}: ${count}`)
            .join(", "),
        };
      });

      // Format for output
      const output = ["# Node-RED Flow Structure", "", "## Tabs", ""];

      result.forEach((tab) => {
        output.push(`### ${tab.name} (ID: ${tab.id})`);
        output.push(`- Number of nodes: ${tab.nodes}`);
        output.push(`- Node types: ${tab.nodeTypes}`);
        output.push("");
      });

      return textResponse(output.join("\n"));
    })
  );
}
