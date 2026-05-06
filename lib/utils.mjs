/**
 * Utility tools for the Node-RED MCP server
 */

import axios from "axios";
export {
  buildDirectFlowUpdatePayload,
  replaceFlowInCompleteFlows,
} from "./flow-utils.mjs";

export const DEFAULT_NODE_RED_TIMEOUT_MS = 30000;

/**
 * Build authentication headers for the Node-RED API.
 * @param {Object} config - Connection configuration
 * @returns {Object} Headers containing configured authentication
 */
export function buildNodeRedAuthHeaders(config) {
  if (config.nodeRedAuthHeader) {
    return { Authorization: config.nodeRedAuthHeader };
  }

  if (config.nodeRedBasicUser && config.nodeRedBasicPassword) {
    const encoded = Buffer.from(
      `${config.nodeRedBasicUser}:${config.nodeRedBasicPassword}`,
      "utf8"
    ).toString("base64");
    return { Authorization: `Basic ${encoded}` };
  }

  if (config.nodeRedToken) {
    return { Authorization: "Bearer " + config.nodeRedToken };
  }

  return {};
}

/**
 * Parse common environment-style boolean values.
 * @param {unknown} value - Value to parse
 * @returns {boolean}
 */
export function parseBoolean(value) {
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

/**
 * Parse a positive integer while preserving undefined values.
 * @param {unknown} value - Value to parse
 * @param {string} name - Name used in error messages
 * @returns {number|undefined}
 */
export function parsePositiveInteger(value, name) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

/**
 * Normalize an optional API path prefix.
 * @param {string} prefix - Prefix to normalize
 * @returns {string}
 */
export function normalizeApiPrefix(prefix = "") {
  const trimmed = String(prefix).trim();
  if (!trimmed) {
    return "";
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

/**
 * Build a Node-RED Admin API URL from configured base URL, prefix and path.
 * @param {Object} config - Connection configuration
 * @param {string} path - API path
 * @returns {string}
 */
export function buildNodeRedApiUrl(config, path) {
  const baseUrl = String(config.nodeRedUrl || "").replace(/\/+$/g, "");
  const prefix = normalizeApiPrefix(config.apiPrefix);
  const normalizedPath = `/${String(path || "").replace(/^\/+/g, "")}`;

  return `${baseUrl}${prefix}${normalizedPath}`;
}

export function textResponse(text) {
  return { content: [{ type: "text", text }] };
}

export function jsonResponse(value) {
  return textResponse(JSON.stringify(value, null, 2));
}

export function errorResponse(action, error) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [{ type: "text", text: `${action} failed: ${message}` }],
  };
}

export async function runTool(action, fn) {
  try {
    return await fn();
  } catch (error) {
    return errorResponse(action, error);
  }
}

export function parseJsonString(value, name) {
  try {
    return JSON.parse(value);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON for ${name}: ${message}`);
  }
}

export function readStructuredOrJsonArgument(args, valueKey, jsonKey) {
  if (args[valueKey] !== undefined) {
    return args[valueKey];
  }

  if (args[jsonKey] !== undefined) {
    return parseJsonString(args[jsonKey], jsonKey);
  }

  throw new Error(`Provide either '${valueKey}' or '${jsonKey}'`);
}

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
  const url = buildNodeRedApiUrl(config, path);
  const headers = buildNodeRedAuthHeaders(config);
  const timeout =
    options.timeout ??
    config.nodeRedTimeoutMs ??
    DEFAULT_NODE_RED_TIMEOUT_MS;

  if (options.apiVersion) {
    headers["Node-RED-API-Version"] = options.apiVersion;
  }

  if (options.deploymentType) {
    headers["Node-RED-Deployment-Type"] = options.deploymentType;
  }

  if (["post", "put"].includes(method.toLowerCase())) {
    headers["Content-Type"] = "application/json; charset=utf-8";
  }

  Object.assign(headers, options.headers || {});

  try {
    if (config.verbose) {
      console.error(`[node-red-mcp] ${method.toUpperCase()} ${url}`);
    }

    const response = await axios({ method, url, headers, data, timeout });
    return response.data;
  } catch (error) {
    const responseData = error.response?.data;
    const message =
      typeof responseData === "string"
        ? responseData
        : responseData !== undefined
          ? JSON.stringify(responseData)
          : error.message;
    const status = error.response?.status ? ` (${error.response.status})` : "";
    const wrappedError = new Error(
      `Node-RED API error${status} for ${method.toUpperCase()} ${path}: ${message}`
    );
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
