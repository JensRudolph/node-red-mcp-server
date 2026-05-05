/**
 * Replace a single tab's definition inside a complete Node-RED flow array.
 * The tab node keeps its original array position so editor tab order is stable.
 * @param {Array} flows - Complete Node-RED flow array
 * @param {string} flowId - Flow/tab id to replace
 * @param {Object} flowConfig - Single-flow object from /flow/:id format
 * @returns {Array} Updated complete flow array
 */
export function replaceFlowInCompleteFlows(flows, flowId, flowConfig) {
  if (!Array.isArray(flows)) {
    throw new Error("Existing flows must be an array");
  }

  if (flowId === "global") {
    throw new Error("Safe update-flow does not support the global flow");
  }

  if (!flowConfig || typeof flowConfig !== "object" || Array.isArray(flowConfig)) {
    throw new Error("Flow configuration must be an object");
  }

  if (flowConfig.id && flowConfig.id !== flowId) {
    throw new Error(
      `Flow id mismatch: request id '${flowId}' does not match payload id '${flowConfig.id}'`
    );
  }

  const tabIndex = flows.findIndex(
    (node) => node?.type === "tab" && node.id === flowId
  );
  if (tabIndex === -1) {
    throw new Error(`Flow '${flowId}' was not found in the current flows`);
  }

  const {
    nodes = [],
    configs = [],
    subflows = [],
    ...tabFields
  } = flowConfig;

  if (!Array.isArray(nodes) || !Array.isArray(configs)) {
    throw new Error("Flow configuration nodes and configs must be arrays");
  }

  if (Array.isArray(subflows) && subflows.length > 0) {
    throw new Error("Safe update-flow does not support subflow replacement");
  }

  const tab = {
    ...tabFields,
    id: flowId,
    type: "tab",
  };

  const replacementMembers = [...nodes, ...configs].map((node) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      throw new Error("Flow members must be objects");
    }

    if (node.type === "tab") {
      throw new Error("Flow members must not contain tab nodes");
    }

    if (node.z !== undefined && node.z !== flowId) {
      throw new Error(
        `Node '${node.id || "(unknown)"}' belongs to flow '${node.z}', not '${flowId}'`
      );
    }

    if (nodes.includes(node) && node.z === undefined) {
      return { ...node, z: flowId };
    }

    return node;
  });

  const nextFlows = [];
  let replacedTab = false;

  for (const node of flows) {
    if (node?.type === "tab" && node.id === flowId) {
      nextFlows.push(tab);
      replacedTab = true;
      continue;
    }

    if (node?.z === flowId) {
      continue;
    }

    nextFlows.push(node);
  }

  const existingIds = new Set(nextFlows.map((node) => node?.id).filter(Boolean));
  for (const node of replacementMembers) {
    if (node.id && existingIds.has(node.id)) {
      throw new Error(`Duplicate node id '${node.id}' in replacement flow`);
    }
    if (node.id) {
      existingIds.add(node.id);
    }
  }

  if (!replacedTab) {
    throw new Error(`Flow '${flowId}' was not replaced`);
  }

  return nextFlows.concat(replacementMembers);
}
