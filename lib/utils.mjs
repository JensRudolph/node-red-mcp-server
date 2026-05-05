/**
 * Utility tools for the Node-RED MCP server
 */

import axios from "axios";
export { replaceFlowInCompleteFlows } from "./flow-utils.mjs";

/**
 * Call the Node-RED API
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {string} path - API path
 * @param {Object|null} data - Data to send (optional)
 * @param {Object} config - Connection configuration
 * @returns {Promise<any>} Result of the API call
 */
export async function callNodeRed(
  method,
  path,
  data = null,
  config,
  options = {}
) {
  // Add API prefix if configured
  const apiPath = config.apiPrefix ? config.apiPrefix + path : path;
  const url = config.nodeRedUrl + apiPath;
  const headers = config.nodeRedToken
    ? { Authorization: "Bearer " + config.nodeRedToken }
    : {};

  if (options.apiVersion) {
    headers["Node-RED-API-Version"] = options.apiVersion;
  }

  if (options.deploymentType) {
    headers["Node-RED-Deployment-Type"] = options.deploymentType;
  }

  if (["post", "put"].includes(method.toLowerCase())) {
    headers["Content-Type"] = "application/json";
  }

  Object.assign(headers, options.headers || {});

  try {
    const response = await axios({ method, url, headers, data });
    return response.data;
  } catch (error) {
    const message =
      typeof error.response?.data === "string"
        ? error.response.data
        : JSON.stringify(error.response?.data || error.message);
    const wrappedError = new Error(`Node-RED API error: ${message}`);
    wrappedError.status = error.response?.status;
    throw wrappedError;
  }
}

/**
 * Fetch the complete flow set with a revision id for optimistic locking.
 * @param {Object} config - Connection configuration
 * @returns {Promise<{rev: string, flows: Array, credentials?: Object}>}
 */
export async function getFlowsWithRevision(config) {
  const response = await callNodeRed("get", "/flows", null, config, {
    apiVersion: "v2",
  });

  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new Error("Node-RED did not return a v2 flows response with a rev");
  }

  if (!response.rev) {
    throw new Error("Node-RED flows response is missing rev");
  }

  if (!Array.isArray(response.flows)) {
    throw new Error("Node-RED flows response is missing flows array");
  }

  return response;
}

/**
 * Deploy a complete flow set with the latest known revision id.
 * @param {Object} current - Response returned by getFlowsWithRevision
 * @param {Array} flows - Updated complete flow array
 * @param {Object} config - Connection configuration
 * @param {string} deploymentType - Node-RED deployment type
 * @returns {Promise<any>} Result of the deployment call
 */
export async function postFlowsWithRevision(
  current,
  flows,
  config,
  deploymentType = "flows"
) {
  if (!current?.rev) {
    throw new Error("Cannot deploy flows safely without a base rev");
  }

  const payload = { rev: current.rev, flows };

  if (current.credentials !== undefined) {
    payload.credentials = current.credentials;
  }

  return callNodeRed("post", "/flows", payload, config, {
    apiVersion: "v2",
    deploymentType,
  });
}

/**
 * Format output of Node-RED flows
 * @param {Array} flows - Array of Node-RED flows
 * @returns {Object} Formatted data with statistics
 */
export function formatFlowsOutput(flows) {
  // Grouping by type
  const result = {
    tabs: flows.filter((n) => n.type === "tab"),
    nodes: flows.filter((n) => n.type !== "tab" && n.type !== "subflow"),
    subflows: flows.filter((n) => n.type === "subflow"),
  };

  // Statistics
  const stats = {
    tabCount: result.tabs.length,
    nodeCount: result.nodes.length,
    subflowCount: result.subflows.length,
    nodeTypes: {},
  };

  result.nodes.forEach((node) => {
    if (!stats.nodeTypes[node.type]) stats.nodeTypes[node.type] = 0;
    stats.nodeTypes[node.type]++;
  });

  return {
    summary: `Node-RED project: ${stats.tabCount} tabs, ${stats.nodeCount} nodes, ${stats.subflowCount} subflows`,
    statistics: stats,
    data: result,
  };
}
