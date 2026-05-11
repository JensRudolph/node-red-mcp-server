/**
 * MCP tools for working with Node-RED flows
 */

import { z } from "zod";
import {
  applyReplacementsToFlow,
  auditEntitiesInFlow,
  clearEntitiesInFlow,
  cloneFlowConfig,
  evaluateMutationConfirmation,
  extractConfigRefCatalogFromNodeHtml,
  getAllIds,
  getSubflowDefinition,
  limitedList,
  resolveFlowTab,
  selectFlows,
  singleFlowToArray,
  summarizeInternalLinks,
  validateFlowPayload,
} from "../flow-analysis.mjs";
import { createFlowDiff } from "../flow-diff.mjs";
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
import {
  formatMutationAudit,
  formatMutationAuditObject,
  runMutationWithBackup,
} from "./backup.mjs";

const flowNodeSchema = z.record(z.any());
const flowConfigSchema = z.record(z.any());
const replacementSchema = z.record(z.string());
const regexReplacementSchema = z.object({
  pattern: z.string(),
  replacement: z.string().optional(),
  flags: z.string().optional(),
});

const confirmationArgSchema = z
  .string()
  .optional()
  .describe("Confirmation token returned by a previous large-mutation dry-run");

function hasSelectiveGetFlowsArgs(args = {}) {
  return [
    "includeTabs",
    "includeConfigNodes",
    "flowId",
    "flowLabel",
    "types",
    "limit",
    "offset",
  ].some((key) => args[key] !== undefined);
}

function normalizeDryRun(value) {
  return value ?? true;
}

function getResponseLimit(args, config) {
  return args.limitChanges ?? args.limitItems ?? config.maxResponseItems ?? 100;
}

function getConfirmationThreshold(config) {
  return config.mutationConfirmationThreshold ?? 50;
}

function mutationBlockedResponse(confirmation, extra = {}) {
  return jsonResponse({
    requiresConfirmation: true,
    wouldWrite: false,
    confirmation,
    ...extra,
  });
}

function checkLargeMutation(args, config, details) {
  return evaluateMutationConfirmation({
    ...details,
    threshold: getConfirmationThreshold(config),
    confirmToken: args.confirmToken,
  });
}

function countDiffAffected(diff) {
  const summary = diff?.summary || {};
  return (summary.added || 0) + (summary.modified || 0) + (summary.removed || 0);
}

function compactChangeResponse(changes, args, config) {
  return limitedList(changes, {
    include: args.includeChanges ?? true,
    limit: getResponseLimit(args, config),
  });
}

async function fetchCreatedFlow(result, config) {
  if (!result?.id) {
    return { flow: null, error: null };
  }

  try {
    return {
      flow: await callNodeRed(
        "get",
        `/flow/${encodeURIComponent(result.id)}`,
        null,
        config
      ),
      error: null,
    };
  } catch (error) {
    return {
      flow: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function compareCreatedIds(flowObj, actualFlow) {
  if (!actualFlow) {
    return null;
  }

  const payloadIds = getAllIds(singleFlowToArray(flowObj));
  const actualIds = getAllIds(singleFlowToArray(actualFlow));

  return {
    payloadIds: [...payloadIds],
    actualIds: [...actualIds],
    missingPayloadIds: [...payloadIds].filter((id) => !actualIds.has(id)),
    extraActualIds: [...actualIds].filter((id) => !payloadIds.has(id)),
  };
}

function summarizeCreateResult(result, flowObj, audit, createdFlowInfo = {}) {
  const actualId = result?.id || null;
  const payloadId = flowObj?.id || null;
  const idComparison = compareCreatedIds(flowObj, createdFlowInfo.flow);
  const warning =
    payloadId && actualId && payloadId !== actualId
      ? `Node-RED returned flow id '${actualId}' instead of payload id '${payloadId}'`
      : null;

  return {
    id: actualId,
    payloadId,
    label: flowObj?.label || flowObj?.name || null,
    nodeCount: Array.isArray(flowObj?.nodes) ? flowObj.nodes.length : 0,
    configCount: Array.isArray(flowObj?.configs) ? flowObj.configs.length : 0,
    revision: result?.rev || null,
    warning,
    idComparison,
    actualFlowReadError: createdFlowInfo.error || null,
    audit: formatMutationAuditObject(audit),
    result,
  };
}

function buildDiffArray(flow, replacements = {}) {
  let array = singleFlowToArray(flow);
  if (Object.keys(replacements).length > 0) {
    const replaced = applyReplacementsToFlow(
      {
        ...flow,
        nodes: flow.nodes || [],
        configs: flow.configs || [],
      },
      { replacements }
    ).flow;
    array = singleFlowToArray(replaced);
  }
  return array;
}

function remapArrayIds(nodes, idMap = {}) {
  return nodes.map((node) => {
    const serialized = JSON.stringify(node);
    const remapped = JSON.parse(serialized, (key, value) =>
      typeof value === "string" && idMap[value] ? idMap[value] : value
    );
    return remapped;
  });
}

async function loadFlowBySelection(args, config) {
  if (args.flowId) {
    return callNodeRed(
      "get",
      `/flow/${encodeURIComponent(args.flowId)}`,
      null,
      config
    );
  }

  if (args.flowLabel) {
    const flows = await callNodeRed("get", "/flows", null, config);
    const tab = resolveFlowTab(flows, { flowLabel: args.flowLabel });
    return callNodeRed(
      "get",
      `/flow/${encodeURIComponent(tab.id)}`,
      null,
      config
    );
  }

  throw new Error("Provide either flowId or flowLabel");
}

function createConfigRefCatalogLoader(config) {
  let catalogPromise = null;

  return async function loadConfigRefCatalog() {
    if (!catalogPromise) {
      catalogPromise = callNodeRed("get", "/nodes", null, config)
        .then((html) => extractConfigRefCatalogFromNodeHtml(html))
        .catch(() => null);
    }

    return catalogPromise;
  };
}

/**
 * Registers flow-related tools in the MCP server
 * @param {Object} server - MCP server instance
 * @param {Object} config - Server configuration
 */
export default function registerFlowTools(server, config) {
  const loadConfigRefCatalog = createConfigRefCatalogLoader(config);

  // Get all flows
  server.tool(
    "get-flows",
    "Retrieves Node-RED flows. With no arguments it returns the complete flow list; optional filters provide safer, smaller responses.",
    {
      includeTabs: z.boolean().optional().describe("Include tab nodes in selective output"),
      includeConfigNodes: z
        .boolean()
        .optional()
        .describe("Include global/config nodes in selective output"),
      flowId: z.string().optional().describe("Limit output to one flow/tab id"),
      flowLabel: z.string().optional().describe("Limit output to one flow/tab label"),
      types: z.array(z.string()).optional().describe("Limit output to node types"),
      limit: z.number().int().nonnegative().optional().describe("Maximum objects to return"),
      offset: z.number().int().nonnegative().optional().describe("Objects to skip"),
    },
    async (args) => runTool("Get flows", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);
      return jsonResponse(hasSelectiveGetFlowsArgs(args) ? selectFlows(flows, args) : flows);
    })
  );

  if (!config.readOnly && config.allowFullFlowWrites) {
    // Update flows
    server.tool(
      "update-flows",
      "Last-resort full /flows write using Node-RED API v2 revision locking. Disabled unless MCP_ALLOW_FULL_FLOW_WRITES=true or --allow-full-flow-writes is set.",
      {
        flows: z
          .array(flowNodeSchema)
          .optional()
          .describe("Complete Node-RED flow array"),
        flowsJson: z
          .string()
          .optional()
          .describe("Deprecated fallback: complete flow array as JSON"),
        confirmToken: confirmationArgSchema,
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
        const catalog = await loadConfigRefCatalog();
        const validation = validateFlowPayload(flowsObj, {
          allowEmptyEntities: true,
          allowExternalConfigRefs: false,
          configRefCatalog: catalog,
        });
        if (!validation.valid) {
          return jsonResponse({
            updated: false,
            validation,
          });
        }

        const current = await getFlowsWithRevision(config);
        const previewDiff = createFlowDiff(current.flows, flowsObj, {
          operation: "update-flows-preview",
        });
        const confirmation = checkLargeMutation(args, config, {
          operation: "update-flows",
          scope: "all-flows",
          affectedCount: countDiffAffected(previewDiff),
          deletedCount: previewDiff.summary.removed || 0,
        });
        if (confirmation.required && !confirmation.confirmed) {
          return mutationBlockedResponse(confirmation, {
            validation,
            diff: { summary: previewDiff.summary },
          });
        }

        const audit = await runMutationWithBackup(
          config,
          "Before update-flows",
          async () => {
            return postFlowsWithRevision(current, flowsObj, config, "full");
          }
        );
        return jsonResponse({
          updated: true,
          revision: audit.result?.rev || null,
          validation,
          confirmation,
          audit: formatMutationAuditObject(audit),
        });
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

  server.tool(
    "get-subflow",
    "Retrieves a specific subflow definition and its internal nodes without returning the complete flow list.",
    { id: z.string().describe("Subflow ID") },
    async ({ id }) => runTool("Get subflow", async () => {
      const flows = await callNodeRed("get", "/flows", null, config);
      return jsonResponse(getSubflowDefinition(flows, id));
    })
  );

  server.tool(
    "validate-flow-payload",
    "Validates a Node-RED flow payload before it is written. Prefer the structured 'flow' argument; 'flowJson' is kept for backwards compatibility.",
    {
      flow: z.union([flowConfigSchema, z.array(flowNodeSchema)]).optional(),
      flowJson: z.string().optional().describe("Deprecated fallback: flow payload as JSON"),
      allowEmptyEntities: z
        .boolean()
        .optional()
        .describe("Allow intentionally empty entity fields as warnings-free"),
      strictEntities: z
        .boolean()
        .optional()
        .describe("Treat empty entity fields as validation errors"),
      allowExternalConfigRefs: z
        .boolean()
        .optional()
        .describe("Allow config-node references that are not included in this payload"),
    },
    async (args) => runTool("Validate flow payload", async () => {
      const payload = readStructuredOrJsonArgument(args, "flow", "flowJson");
      const catalog = await loadConfigRefCatalog();
      return jsonResponse(
        validateFlowPayload(payload, {
          allowEmptyEntities: args.allowEmptyEntities ?? false,
          strictEntities: args.strictEntities ?? false,
          allowExternalConfigRefs: args.allowExternalConfigRefs,
          configRefCatalog: catalog,
        })
      );
    })
  );

  server.tool(
    "dry-run-create-flow",
    "Simulates creating a flow without writing to Node-RED. Returns validation, ID conflicts, entities, and internal links.",
    {
      flow: flowConfigSchema.optional().describe("New flow configuration"),
      flowJson: z.string().optional().describe("Deprecated fallback: new flow configuration as JSON"),
      allowEmptyEntities: z.boolean().optional(),
      includeEntities: z.boolean().optional().describe("Include entity occurrence details"),
      includeInternalLinks: z.boolean().optional().describe("Include internal link details"),
      limitItems: z.number().int().nonnegative().optional().describe("Limit returned entity/link detail items"),
    },
    async (args) => runTool("Dry-run create flow", async () => {
      const flowObj = readStructuredOrJsonArgument(args, "flow", "flowJson");
      const existingFlows = await callNodeRed("get", "/flows", null, config);
      const catalog = await loadConfigRefCatalog();
      const existingIds = getAllIds(existingFlows);
      const payloadObjects = singleFlowToArray(flowObj);
      const conflicts = payloadObjects
        .filter((node) => node?.id && existingIds.has(node.id))
        .map((node) => ({
          id: node.id,
          type: node.type || "",
          name: node.name || node.label || "",
        }));
      const entityAudit = auditEntitiesInFlow(flowObj);

      return jsonResponse({
        wouldWrite: false,
        payloadId: flowObj.id || null,
        nodeRedMayGenerateDifferentFlowId: true,
        validation: validateFlowPayload(flowObj, {
          allowEmptyEntities: args.allowEmptyEntities ?? true,
          allowExternalConfigRefs: true,
          configRefCatalog: catalog,
        }),
        conflicts,
        entities: {
          summary: entityAudit.summary,
          details: limitedList(entityAudit.entities, {
            include: args.includeEntities ?? true,
            limit: args.limitItems ?? config.maxResponseItems,
          }),
        },
        internalLinks: limitedList(summarizeInternalLinks(flowObj), {
          include: args.includeInternalLinks ?? true,
          limit: args.limitItems ?? config.maxResponseItems,
        }),
        counts: {
          nodes: Array.isArray(flowObj.nodes) ? flowObj.nodes.length : 0,
          configs: Array.isArray(flowObj.configs) ? flowObj.configs.length : 0,
        },
      });
    })
  );

  server.tool(
    "entity-audit",
    "Extracts and categorizes Home Assistant entity references from one flow payload or a live flow.",
    {
      flowId: z.string().optional().describe("Live flow id to audit"),
      flowLabel: z.string().optional().describe("Live flow label to audit"),
      flow: flowConfigSchema.optional().describe("Flow payload to audit"),
      flowJson: z.string().optional().describe("Deprecated fallback: flow payload as JSON"),
      includeEntities: z.boolean().optional().describe("Include entity occurrence details"),
      limitItems: z.number().int().nonnegative().optional().describe("Limit returned entity detail items"),
    },
    async (args) => runTool("Entity audit", async () => {
      let flowObj;
      if (args.flow !== undefined || args.flowJson !== undefined) {
        flowObj = readStructuredOrJsonArgument(args, "flow", "flowJson");
      } else {
        flowObj = await loadFlowBySelection(args, config);
      }

      const audit = auditEntitiesInFlow(flowObj);
      return jsonResponse({
        summary: audit.summary,
        entities: limitedList(audit.entities, {
          include: args.includeEntities ?? true,
          limit: args.limitItems ?? config.maxResponseItems,
        }),
      });
    })
  );

  server.tool(
    "diff-flow-against-source",
    "Compares two flows, optionally remapping cloned IDs and applying expected source replacements before diffing.",
    {
      sourceFlowId: z.string().describe("Source flow id"),
      targetFlowId: z.string().describe("Target flow id"),
      idMap: z.record(z.string()).optional().describe("Mapping from source IDs to target IDs"),
      expectedReplacements: replacementSchema
        .optional()
        .describe("Expected string replacements to apply to the source before diffing"),
      format: z
        .enum(["summary", "json"])
        .optional()
        .describe("Return compact summary by default, or full JSON diff"),
    },
    async ({ sourceFlowId, targetFlowId, idMap, expectedReplacements, format }) =>
      runTool("Diff flow against source", async () => {
        const sourceFlow = await callNodeRed(
          "get",
          `/flow/${encodeURIComponent(sourceFlowId)}`,
          null,
          config
        );
        const targetFlow = await callNodeRed(
          "get",
          `/flow/${encodeURIComponent(targetFlowId)}`,
          null,
          config
        );
        const map = {
          [sourceFlowId]: targetFlowId,
          ...(idMap || {}),
        };
        const sourceArray = remapArrayIds(
          buildDiffArray(sourceFlow, expectedReplacements || {}),
          map
        );
        const targetArray = buildDiffArray(targetFlow);

        const diff = createFlowDiff(sourceArray, targetArray, {
            sourceFlowId,
            targetFlowId,
            idMapApplied: Object.keys(map).length,
          });

        return jsonResponse(
          format === "json"
            ? diff
            : {
                metadata: diff.metadata,
                summary: diff.summary,
                tabOrder: diff.tabOrder,
              }
        );
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
        confirmToken: confirmationArgSchema,
      },
      async (args) => runTool("Update flow", async () => {
          const { id } = args;
          const flowObj = readStructuredOrJsonArgument(args, "flow", "flowJson");
          const payload = buildDirectFlowUpdatePayload(id, flowObj);
          const catalog = await loadConfigRefCatalog();
          const validation = validateFlowPayload(payload, {
            allowEmptyEntities: true,
            allowExternalConfigRefs: true,
            configRefCatalog: catalog,
          });
          if (!validation.valid) {
            return jsonResponse({
              updated: false,
              validation,
            });
          }
          const currentFlow = await callNodeRed(
            "get",
            `/flow/${encodeURIComponent(id)}`,
            null,
            config
          );
          const previewDiff = createFlowDiff(
            singleFlowToArray(currentFlow),
            singleFlowToArray(payload),
            { operation: "update-flow-preview", flowId: id }
          );
          const confirmation = checkLargeMutation(args, config, {
            operation: "update-flow",
            scope: id,
            affectedCount: countDiffAffected(previewDiff),
            deletedCount: previewDiff.summary.removed || 0,
          });
          if (confirmation.required && !confirmation.confirmed) {
            return mutationBlockedResponse(confirmation, {
              validation,
              diff: { summary: previewDiff.summary },
            });
          }
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
          return jsonResponse({
            updated: true,
            flowId: id,
            revision: audit.result?.rev || null,
            validation,
            confirmation,
            audit: formatMutationAuditObject(audit),
          });
      })
    );
  }

  if (!config.readOnly && config.allowFullFlowWrites) {
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
        confirmToken: confirmationArgSchema,
      },
      async (args) => runTool("Update flow full", async () => {
          const { id } = args;
          const flowObj = readStructuredOrJsonArgument(args, "flow", "flowJson");
          const payload = buildDirectFlowUpdatePayload(id, flowObj);
          const catalog = await loadConfigRefCatalog();
          const validation = validateFlowPayload(payload, {
            allowEmptyEntities: true,
            allowExternalConfigRefs: true,
            configRefCatalog: catalog,
          });
          if (!validation.valid) {
            return jsonResponse({
              updated: false,
              validation,
            });
          }
          const current = await getFlowsWithRevision(config);
          const currentFlowObjects = current.flows.filter(
            (node) => node.id === id || node.z === id
          );
          const previewDiff = createFlowDiff(
            currentFlowObjects,
            singleFlowToArray(payload),
            { operation: "update-flow-full-preview", flowId: id }
          );
          const confirmation = checkLargeMutation(args, config, {
            operation: "update-flow-full",
            scope: id,
            affectedCount: countDiffAffected(previewDiff),
            deletedCount: previewDiff.summary.removed || 0,
          });
          if (confirmation.required && !confirmation.confirmed) {
            return mutationBlockedResponse(confirmation, {
              validation,
              diff: { summary: previewDiff.summary },
            });
          }
          const audit = await runMutationWithBackup(
            config,
            `Before update-flow-full ${id}`,
            async () => {
              const nextFlows = replaceFlowInCompleteFlows(
                current.flows,
                id,
                payload
              );
              return postFlowsWithRevision(current, nextFlows, config, "flows");
            }
          );
          return jsonResponse({
            updated: true,
            flowId: id,
            revision: audit.result?.rev || null,
            validation,
            confirmation,
            audit: formatMutationAuditObject(audit),
          });
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
        confirmToken: confirmationArgSchema,
      },
      async (args) => runTool("Create flow", async () => {
          const flowObj = readStructuredOrJsonArgument(args, "flow", "flowJson");
          const catalog = await loadConfigRefCatalog();
          const validation = validateFlowPayload(flowObj, {
            allowEmptyEntities: true,
            allowExternalConfigRefs: true,
            configRefCatalog: catalog,
          });
          if (!validation.valid) {
            return jsonResponse({
              created: false,
              validation,
            });
          }
          const affectedCount = singleFlowToArray(flowObj).length;
          const confirmation = checkLargeMutation(args, config, {
            operation: "create-flow",
            scope: flowObj.label || flowObj.name || flowObj.id || "new-flow",
            affectedCount,
          });
          if (confirmation.required && !confirmation.confirmed) {
            return mutationBlockedResponse(confirmation, {
              validation,
              counts: {
                objects: affectedCount,
                nodes: Array.isArray(flowObj.nodes) ? flowObj.nodes.length : 0,
                configs: Array.isArray(flowObj.configs) ? flowObj.configs.length : 0,
              },
            });
          }
          const audit = await runMutationWithBackup(
            config,
            "Before create-flow",
            async () => callNodeRed("post", "/flow", flowObj, config)
          );
          const createdFlowInfo = await fetchCreatedFlow(audit.result, config);
          return jsonResponse({
            created: true,
            validation,
            confirmation,
            ...summarizeCreateResult(audit.result, flowObj, audit, createdFlowInfo),
          });
      })
    );
  }

  if (!config.readOnly) {
    server.tool(
      "clone-flow",
      "Clones an existing flow with deterministic ID remapping, optional replacements, entity clearing, validation, and dry-run support. Set dryRun=false to write.",
      {
        sourceId: z.string().describe("Source flow/tab id"),
        newLabel: z.string().describe("Label for the cloned flow"),
        replacements: replacementSchema
          .optional()
          .describe("String replacements to apply after ID remapping"),
        regexReplacements: z
          .array(regexReplacementSchema)
          .optional()
          .describe("Regex replacements to apply after ID remapping"),
        clearEntityPatterns: z
          .array(z.string())
          .optional()
          .describe("Entity-id regex patterns to neutralize"),
        clearEntityReplacement: z
          .string()
          .optional()
          .describe("Replacement for cleared entity ids; defaults to empty string"),
        allowEmptyEntities: z.boolean().optional(),
        dryRun: z
          .boolean()
          .optional()
          .describe("Default true. Set false to actually create the flow."),
        confirmToken: confirmationArgSchema,
        includePayload: z.boolean().optional().describe("Include the full cloned flow payload in the response"),
        includeChanges: z.boolean().optional().describe("Include replacement/entity clearing detail lists"),
        includeEntities: z.boolean().optional().describe("Include entity audit detail list"),
        limitChanges: z.number().int().nonnegative().optional().describe("Limit returned change details"),
      },
      async (args) => runTool("Clone flow", async () => {
        const sourceFlow = await callNodeRed(
          "get",
          `/flow/${encodeURIComponent(args.sourceId)}`,
          null,
          config
        );
        const existingFlows = await callNodeRed("get", "/flows", null, config);
        const clone = cloneFlowConfig(sourceFlow, {
          existingIds: getAllIds(existingFlows),
          newLabel: args.newLabel,
          replacements: args.replacements || {},
          regexReplacements: args.regexReplacements || [],
          clearEntityPatterns: args.clearEntityPatterns || [],
          clearEntityReplacement: args.clearEntityReplacement,
          allowEmptyEntities: args.allowEmptyEntities ?? true,
        });
        const catalog = await loadConfigRefCatalog();
        clone.validation = validateFlowPayload(clone.flow, {
          allowEmptyEntities: args.allowEmptyEntities ?? true,
          allowExternalConfigRefs: true,
          configRefCatalog: catalog,
        });
        const compactChanges = {
          replacements: compactChangeResponse(
            clone.changes.replacements,
            args,
            config
          ),
          clearedEntities: compactChangeResponse(
            clone.changes.clearedEntities,
            args,
            config
          ),
        };
        const entityAudit = auditEntitiesInFlow(clone.flow);

        if (normalizeDryRun(args.dryRun)) {
          return jsonResponse({
            dryRun: true,
            wouldWrite: false,
            idMap: clone.idMap,
            plannedId: clone.plannedId,
            summary: clone.summary,
            changes: compactChanges,
            validation: clone.validation,
            entities: {
              summary: entityAudit.summary,
              details: limitedList(entityAudit.entities, {
                include: args.includeEntities ?? false,
                limit: args.limitChanges ?? config.maxResponseItems,
              }),
            },
            internalLinks: limitedList(summarizeInternalLinks(clone.flow), {
              include: args.includePayload ?? false,
              limit: args.limitChanges ?? config.maxResponseItems,
            }),
            ...(args.includePayload ? { flow: clone.flow } : {}),
          });
        }

        if (!clone.validation.valid) {
          return jsonResponse({
            created: false,
            validation: clone.validation,
            idMap: clone.idMap,
          });
        }
        const affectedCount = singleFlowToArray(clone.flow).length;
        const confirmation = checkLargeMutation(args, config, {
          operation: "clone-flow",
          scope: `${args.sourceId}:${args.newLabel}`,
          affectedCount,
        });
        if (confirmation.required && !confirmation.confirmed) {
          return mutationBlockedResponse(confirmation, {
            sourceId: args.sourceId,
            plannedId: clone.plannedId,
            idMap: clone.idMap,
            summary: clone.summary,
            changes: compactChanges,
            validation: clone.validation,
          });
        }

        const audit = await runMutationWithBackup(
          config,
          `Before clone-flow ${args.sourceId}`,
          async () => callNodeRed("post", "/flow", clone.flow, config)
        );
        const createdFlowInfo = await fetchCreatedFlow(audit.result, config);
        const createSummary = summarizeCreateResult(
          audit.result,
          clone.flow,
          audit,
          createdFlowInfo
        );

        return jsonResponse({
          created: true,
          sourceId: args.sourceId,
          plannedId: clone.plannedId,
          actualId: createSummary.id,
          idMap: {
            ...clone.idMap,
            ...(createSummary.id && createSummary.id !== clone.plannedId
              ? { [args.sourceId]: createSummary.id }
              : {}),
          },
          validation: clone.validation,
          summary: clone.summary,
          confirmation,
          changes: compactChanges,
          create: createSummary,
        });
      })
    );
  }

  if (!config.readOnly) {
    server.tool(
      "replace-in-flow",
      "Performs scoped string/regex replacements in one flow with a dry-run diff by default. Set dryRun=false to write.",
      {
        flowId: z.string().describe("Flow id to update"),
        replacements: replacementSchema.optional(),
        regexReplacements: z.array(regexReplacementSchema).optional(),
        nodeTypes: z.array(z.string()).optional().describe("Only edit these node types"),
        fieldPaths: z.array(z.string()).optional().describe("Only edit these exact field paths"),
        fieldRegex: z.string().optional().describe("Only edit fields matching this regex"),
        allowEmptyEntities: z.boolean().optional(),
        dryRun: z.boolean().optional().describe("Default true. Set false to update the flow."),
        confirmToken: confirmationArgSchema,
        includeChanges: z.boolean().optional().describe("Include change detail list"),
        limitChanges: z.number().int().nonnegative().optional().describe("Limit returned change details"),
        includeEntities: z.boolean().optional().describe("Include post-clear entity detail list in dry-run output"),
      },
      async (args) => runTool("Replace in flow", async () => {
        if (
          Object.keys(args.replacements || {}).length === 0 &&
          (args.regexReplacements || []).length === 0
        ) {
          throw new Error("Provide replacements or regexReplacements");
        }

        const flow = await callNodeRed(
          "get",
          `/flow/${encodeURIComponent(args.flowId)}`,
          null,
          config
        );
        const result = applyReplacementsToFlow(flow, {
          replacements: args.replacements || {},
          regexReplacements: args.regexReplacements || [],
          nodeTypes: args.nodeTypes,
          fieldPaths: args.fieldPaths,
          fieldRegex: args.fieldRegex,
        });
        const catalog = await loadConfigRefCatalog();
        const validation = validateFlowPayload(result.flow, {
          allowEmptyEntities: args.allowEmptyEntities ?? true,
          allowExternalConfigRefs: true,
          configRefCatalog: catalog,
        });
        const changes = compactChangeResponse(result.changes, args, config);

        if (normalizeDryRun(args.dryRun)) {
          return jsonResponse({
            dryRun: true,
            wouldWrite: false,
            changes,
            validation,
          });
        }

        if (!validation.valid) {
          return jsonResponse({
            updated: false,
            changes,
            validation,
          });
        }
        const confirmation = checkLargeMutation(args, config, {
          operation: "replace-in-flow",
          scope: args.flowId,
          affectedCount: result.changes.length,
        });
        if (confirmation.required && !confirmation.confirmed) {
          return mutationBlockedResponse(confirmation, {
            flowId: args.flowId,
            changes,
            validation,
          });
        }

        const payload = buildDirectFlowUpdatePayload(args.flowId, result.flow);
        const audit = await runMutationWithBackup(
          config,
          `Before replace-in-flow ${args.flowId}`,
          async () => callNodeRed(
            "put",
            `/flow/${encodeURIComponent(args.flowId)}`,
            payload,
            config
          )
        );

        return jsonResponse({
          updated: true,
          flowId: args.flowId,
          changes,
          validation,
          confirmation,
          revision: audit.result?.rev || null,
          audit: formatMutationAuditObject(audit),
        });
      })
    );
  }

  if (!config.readOnly) {
    server.tool(
      "clear-entities-in-flow",
      "Neutralizes Home Assistant entity assignments matching regex patterns in one flow. Service names such as light.turn_on are not treated as entities. Dry-run is default.",
      {
        flowId: z.string().describe("Flow id to update"),
        patterns: z.array(z.string()).describe("Entity-id regex patterns"),
        replacement: z.string().optional().describe("Replacement value, defaults to empty string"),
        allowEmptyEntities: z.boolean().optional(),
        dryRun: z.boolean().optional().describe("Default true. Set false to update the flow."),
        confirmToken: confirmationArgSchema,
        includeChanges: z.boolean().optional().describe("Include change detail list"),
        limitChanges: z.number().int().nonnegative().optional().describe("Limit returned change details"),
      },
      async (args) => runTool("Clear entities in flow", async () => {
        const flow = await callNodeRed(
          "get",
          `/flow/${encodeURIComponent(args.flowId)}`,
          null,
          config
        );
        const result = clearEntitiesInFlow(flow, {
          patterns: args.patterns,
          replacement: args.replacement ?? "",
        });
        const catalog = await loadConfigRefCatalog();
        const validation = validateFlowPayload(result.flow, {
          allowEmptyEntities:
            args.allowEmptyEntities ?? (args.replacement === undefined || args.replacement === ""),
          allowExternalConfigRefs: true,
          configRefCatalog: catalog,
        });
        const changes = compactChangeResponse(result.changes, args, config);

        if (normalizeDryRun(args.dryRun)) {
          const audit = auditEntitiesInFlow(result.flow);
          return jsonResponse({
            dryRun: true,
            wouldWrite: false,
            changes,
            validation,
            entities: {
              summary: audit.summary,
              details: limitedList(audit.entities, {
                include: args.includeEntities ?? false,
                limit: args.limitChanges ?? config.maxResponseItems,
              }),
            },
          });
        }

        if (!validation.valid) {
          return jsonResponse({
            updated: false,
            changes,
            validation,
          });
        }
        const confirmation = checkLargeMutation(args, config, {
          operation: "clear-entities-in-flow",
          scope: args.flowId,
          affectedCount: result.changes.length,
        });
        if (confirmation.required && !confirmation.confirmed) {
          return mutationBlockedResponse(confirmation, {
            flowId: args.flowId,
            changes,
            validation,
          });
        }

        const payload = buildDirectFlowUpdatePayload(args.flowId, result.flow);
        const audit = await runMutationWithBackup(
          config,
          `Before clear-entities-in-flow ${args.flowId}`,
          async () => callNodeRed(
            "put",
            `/flow/${encodeURIComponent(args.flowId)}`,
            payload,
            config
          )
        );

        return jsonResponse({
          updated: true,
          flowId: args.flowId,
          changes,
          validation,
          confirmation,
          revision: audit.result?.rev || null,
          audit: formatMutationAuditObject(audit),
        });
      })
    );
  }

  if (!config.readOnly) {
    // Delete flow
    server.tool(
      "delete-flow",
      "Deletes a specific flow from the Node-RED instance by its ID. Args: id (e.g.'396c237c693dc')",
      {
        id: z.string().describe("Flow ID to delete"),
        confirmToken: confirmationArgSchema,
      },
      async (args) => runTool("Delete flow", async () => {
        const { id } = args;
        const flow = await callNodeRed(
          "get",
          `/flow/${encodeURIComponent(id)}`,
          null,
          config
        );
        const affectedCount = singleFlowToArray(flow).length;
        const confirmation = checkLargeMutation(args, config, {
          operation: "delete-flow",
          scope: id,
          affectedCount,
          deletedCount: affectedCount,
        });
        if (confirmation.required && !confirmation.confirmed) {
          return mutationBlockedResponse(confirmation, {
            flowId: id,
            label: flow.label || flow.name || null,
            counts: {
              objects: affectedCount,
              nodes: Array.isArray(flow.nodes) ? flow.nodes.length : 0,
              configs: Array.isArray(flow.configs) ? flow.configs.length : 0,
            },
          });
        }

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
        return jsonResponse({
          deleted: true,
          flowId: id,
          confirmation,
          audit: formatMutationAuditObject(audit),
        });
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
