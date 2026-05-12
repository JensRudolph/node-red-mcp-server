/**
 * Deterministic helpers for inspecting and transforming Node-RED flow payloads.
 */

import crypto from "crypto";

const ENTITY_ID_PATTERN = /\b[a-z_][a-z0-9_]*\.[a-z0-9_][a-z0-9_-]*\b/gi;
const ID_LIKE_PATTERN = /^[a-f0-9.]{5,}$/i;
const STRUCTURAL_KEYS = new Set(["id", "z", "g", "wires", "links", "nodes"]);
const CONFIG_REF_KEYS = new Set([
  "account",
  "auth",
  "broker",
  "client",
  "config",
  "database",
  "device",
  "mqtt",
  "remoteServer",
  "serial",
  "server",
  "server_config",
  "tls",
  "websocket",
]);
const TRIGGER_NODE_TYPES = new Set([
  "server-state-changed",
  "trigger-state",
  "poll-state",
  "events-state",
  "ha-events",
]);
const CURRENT_STATE_NODE_TYPES = new Set([
  "api-current-state",
  "ha-get-entities",
  "api-get-history",
]);
const PRIMITIVE_DEFAULT_TYPES = new Set([
  "str",
  "num",
  "bool",
  "json",
  "bin",
  "date",
  "env",
  "cred",
  "flow",
  "global",
  "msg",
]);
export const DEFAULT_MUTATION_CONFIRMATION_THRESHOLD = 50;

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function pathToString(parts) {
  let output = "";

  for (const part of parts) {
    if (typeof part === "number") {
      output += `[${part}]`;
    } else {
      output += output ? `.${part}` : part;
    }
  }

  return output;
}

function lastPathKey(path) {
  const cleaned = String(path || "").replace(/\[\d+\]$/g, "");
  const last = cleaned.split(".").pop() || "";
  return last.toLowerCase();
}

function compilePatterns(patterns = []) {
  return patterns.map((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern;
    }

    return new RegExp(String(pattern));
  });
}

function matchesAny(value, patterns) {
  return patterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

function getNodeName(node) {
  return node?.name || node?.label || "";
}

function getTabLabel(tab) {
  return tab?.label || tab?.name || "";
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function readQuotedString(text, index) {
  const quote = text[index];
  let result = "";
  let escaped = false;

  for (let i = index + 1; i < text.length; i++) {
    const char = text[i];
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === quote) {
      return { value: result, end: i + 1 };
    }

    result += char;
  }

  return null;
}

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = openIndex; i < text.length; i++) {
    const char = text[i];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function skipWhitespaceAndCommas(text, index) {
  let i = index;
  while (i < text.length && /[\s,]/.test(text[i])) {
    i++;
  }
  return i;
}

function readObjectKey(text, index) {
  let i = skipWhitespaceAndCommas(text, index);

  if (text[i] === "'" || text[i] === '"') {
    const quoted = readQuotedString(text, i);
    if (!quoted) {
      return null;
    }
    return { key: quoted.value, end: quoted.end };
  }

  const match = /^[A-Za-z_$][\w$-]*/.exec(text.slice(i));
  if (!match) {
    return null;
  }

  return { key: match[0], end: i + match[0].length };
}

function readObjectProperties(objectBody) {
  const properties = [];
  let index = 0;

  while (index < objectBody.length) {
    const keyInfo = readObjectKey(objectBody, index);
    if (!keyInfo) {
      break;
    }

    let cursor = skipWhitespaceAndCommas(objectBody, keyInfo.end);
    if (objectBody[cursor] !== ":") {
      index = cursor + 1;
      continue;
    }

    cursor = skipWhitespaceAndCommas(objectBody, cursor + 1);
    if (objectBody[cursor] !== "{") {
      index = cursor + 1;
      continue;
    }

    const closeIndex = findMatchingBrace(objectBody, cursor);
    if (closeIndex === -1) {
      break;
    }

    properties.push({
      key: keyInfo.key,
      body: objectBody.slice(cursor + 1, closeIndex),
    });
    index = closeIndex + 1;
  }

  return properties;
}

function extractDefaultsBody(registerTypeBody) {
  const defaultsMatch = /\bdefaults\s*:/.exec(registerTypeBody);
  if (!defaultsMatch) {
    return null;
  }

  const openIndex = registerTypeBody.indexOf("{", defaultsMatch.index);
  if (openIndex === -1) {
    return null;
  }

  const closeIndex = findMatchingBrace(registerTypeBody, openIndex);
  if (closeIndex === -1) {
    return null;
  }

  return registerTypeBody.slice(openIndex + 1, closeIndex);
}

export function createConfirmationToken(details) {
  return crypto
    .createHash("sha256")
    .update(stableStringify(details))
    .digest("hex")
    .slice(0, 16);
}

export function evaluateMutationConfirmation({
  operation,
  scope,
  affectedCount,
  deletedCount = 0,
  threshold = DEFAULT_MUTATION_CONFIRMATION_THRESHOLD,
  confirmToken,
}) {
  const normalizedThreshold =
    Number.isInteger(threshold) && threshold >= 0
      ? threshold
      : DEFAULT_MUTATION_CONFIRMATION_THRESHOLD;

  if (affectedCount <= normalizedThreshold) {
    return {
      required: false,
      confirmed: true,
      affectedCount,
      deletedCount,
      threshold: normalizedThreshold,
    };
  }

  const tokenPayload = {
    operation,
    scope: scope || "",
    affectedCount,
    deletedCount,
    threshold: normalizedThreshold,
  };
  const expectedToken = createConfirmationToken(tokenPayload);

  return {
    required: true,
    confirmed: confirmToken === expectedToken,
    confirmToken: expectedToken,
    affectedCount,
    deletedCount,
    threshold: normalizedThreshold,
    message: `Mutation affects ${affectedCount} objects, which exceeds the confirmation threshold of ${normalizedThreshold}. Re-run with this confirmToken to execute.`,
  };
}

export function limitedList(items, { include = true, limit = 100 } = {}) {
  const list = Array.isArray(items) ? items : [];
  const normalizedLimit =
    Number.isInteger(limit) && limit >= 0 ? limit : 100;
  const selected = include ? list.slice(0, normalizedLimit) : [];

  return {
    total: list.length,
    returned: selected.length,
    truncated: include && list.length > selected.length,
    items: selected,
  };
}

export function extractConfigRefCatalogFromNodeHtml(htmlString) {
  const html = String(htmlString || "");
  const registeredTypes = new Set();
  const registerPattern = /registerType\s*\(\s*(['"])([^'"]+)\1\s*,/g;
  const entries = [];
  let match;

  while ((match = registerPattern.exec(html)) !== null) {
    const type = match[2];
    registeredTypes.add(type);
    const openIndex = html.indexOf("{", registerPattern.lastIndex);
    if (openIndex === -1) {
      continue;
    }

    const closeIndex = findMatchingBrace(html, openIndex);
    if (closeIndex === -1) {
      continue;
    }

    entries.push({
      type,
      body: html.slice(openIndex + 1, closeIndex),
    });
    registerPattern.lastIndex = closeIndex + 1;
  }

  const catalog = {};

  for (const entry of entries) {
    const defaultsBody = extractDefaultsBody(entry.body);
    if (!defaultsBody) {
      continue;
    }

    for (const property of readObjectProperties(defaultsBody)) {
      const typeMatch = /\btype\s*:\s*(['"])([^'"]+)\1/.exec(property.body);
      if (!typeMatch) {
        continue;
      }

      const refType = typeMatch[2];
      if (
        !registeredTypes.has(refType) ||
        PRIMITIVE_DEFAULT_TYPES.has(refType)
      ) {
        continue;
      }

      catalog[entry.type] ||= {};
      catalog[entry.type][property.key] = refType;
    }
  }

  return catalog;
}

export function extractEntityIds(value) {
  const entities = [];

  function visit(item) {
    if (typeof item === "string") {
      for (const match of item.matchAll(ENTITY_ID_PATTERN)) {
        entities.push(match[0]);
      }
    } else if (Array.isArray(item)) {
      item.forEach(visit);
    } else if (isObject(item)) {
      Object.values(item).forEach(visit);
    }
  }

  visit(value);
  return [...new Set(entities)];
}

export function visitValues(value, visitor, path = [], parent = null, key = null) {
  const pathString = pathToString(path);
  visitor({ value, path, pathString, parent, key });

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      visitValues(item, visitor, path.concat(index), value, index);
    });
    return;
  }

  if (isObject(value)) {
    for (const [childKey, childValue] of Object.entries(value)) {
      visitValues(childValue, visitor, path.concat(childKey), value, childKey);
    }
  }
}

export function getValueAtPath(value, path) {
  if (!path) {
    return value;
  }

  const parts = [];
  String(path).replace(/([^[.\]]+)|\[(\d+)\]/g, (_, key, index) => {
    parts.push(index === undefined ? key : Number(index));
  });

  return parts.reduce(
    (current, part) => (current === undefined ? undefined : current?.[part]),
    value
  );
}

export function singleFlowToArray(flow) {
  if (!isObject(flow)) {
    throw new Error("Flow payload must be an object");
  }

  const {
    nodes = [],
    configs = [],
    subflows = [],
    ...tabFields
  } = flow;

  return [
    {
      ...tabFields,
      type: tabFields.type || "tab",
    },
    ...nodes,
    ...configs,
    ...subflows,
  ];
}

export function resolveFlowTab(flows, { flowId, flowLabel } = {}) {
  if (!Array.isArray(flows)) {
    throw new Error("flows must be an array");
  }

  if (!flowId && !flowLabel) {
    return null;
  }

  const tabs = flows.filter((node) => node?.type === "tab");
  let matches = tabs;

  if (flowId) {
    matches = matches.filter((tab) => tab.id === flowId);
  }

  if (flowLabel) {
    matches = matches.filter((tab) => getTabLabel(tab) === flowLabel);
  }

  if (matches.length === 0) {
    throw new Error(`Flow '${flowId || flowLabel}' was not found`);
  }

  if (matches.length > 1) {
    throw new Error(`Flow label '${flowLabel}' is ambiguous`);
  }

  return matches[0];
}

export function selectFlows(flows, options = {}) {
  if (!Array.isArray(flows)) {
    throw new Error("flows must be an array");
  }

  const hasSelection =
    options.flowId ||
    options.flowLabel ||
    options.includeTabs !== undefined ||
    options.includeConfigNodes !== undefined ||
    options.types ||
    options.limit !== undefined ||
    options.offset !== undefined;

  if (!hasSelection) {
    return flows;
  }

  const tab = resolveFlowTab(flows, options);
  const typeSet = options.types ? new Set(options.types) : null;
  const includeTabs = options.includeTabs ?? true;
  const includeConfigNodes = options.includeConfigNodes ?? true;
  const offset = options.offset ?? 0;
  const limit = options.limit;

  let selected = flows.filter((node) => {
    if (tab && node.id !== tab.id && node.z !== tab.id) {
      return false;
    }

    if (!includeTabs && node.type === "tab") {
      return false;
    }

    if (!includeConfigNodes && node.type !== "tab" && !node.z) {
      return false;
    }

    if (typeSet && !typeSet.has(node.type)) {
      return false;
    }

    return true;
  });

  if (offset > 0 || limit !== undefined) {
    selected = selected.slice(offset, limit === undefined ? undefined : offset + limit);
  }

  return {
    summary: {
      total: flows.length,
      returned: selected.length,
      offset,
      limit: limit ?? null,
      flowId: tab?.id || options.flowId || null,
      flowLabel: tab ? getTabLabel(tab) : options.flowLabel || null,
    },
    flows: selected,
  };
}

export function getSubflowDefinition(flows, id) {
  if (!Array.isArray(flows)) {
    throw new Error("flows must be an array");
  }

  const subflow = flows.find((node) => node?.type === "subflow" && node.id === id);
  if (!subflow) {
    throw new Error(`Subflow '${id}' was not found`);
  }

  const members = flows.filter((node) => node?.z === id);
  return {
    subflow,
    nodes: members.filter((node) => node.type !== "subflow"),
    count: members.length,
  };
}

function getSubflowName(subflow) {
  return subflow?.name || subflow?.label || "";
}

function isConfigLikeNode(node) {
  return (
    isObject(node) &&
    node.type &&
    node.type !== "group" &&
    node.type !== "junction" &&
    node.x === undefined &&
    node.y === undefined &&
    node.wires === undefined
  );
}

export function normalizeSubflowConfig(payload, options = {}) {
  if (!isObject(payload)) {
    throw new Error("Subflow payload must be an object");
  }

  let subflow;
  let nodes;
  let configs;
  let configsWereExplicit = false;

  if (isObject(payload.subflow)) {
    subflow = cloneJson(payload.subflow);
    nodes = payload.nodes ?? subflow.nodes ?? [];
    configs = payload.configs ?? subflow.configs ?? [];
    configsWereExplicit =
      payload.configs !== undefined || subflow.configs !== undefined;
  } else {
    subflow = cloneJson(payload);
    nodes = subflow.nodes ?? [];
    configs = subflow.configs ?? [];
    configsWereExplicit = subflow.configs !== undefined;
  }

  if (!Array.isArray(nodes)) {
    throw new Error("Subflow nodes must be an array");
  }

  if (!Array.isArray(configs)) {
    throw new Error("Subflow configs must be an array");
  }

  if (!configsWereExplicit) {
    const visualNodes = [];
    const configNodes = [];

    for (const node of nodes) {
      if (isConfigLikeNode(node)) {
        configNodes.push(node);
      } else {
        visualNodes.push(node);
      }
    }

    nodes = visualNodes;
    configs = configNodes;
  }

  const expectedId = options.id || subflow.id;
  if (!expectedId) {
    throw new Error("Subflow payload must include an id");
  }

  if (subflow.id && options.id && subflow.id !== options.id) {
    throw new Error(
      `Subflow id mismatch: request id '${options.id}' does not match payload id '${subflow.id}'`
    );
  }

  if (subflow.type && subflow.type !== "subflow") {
    throw new Error(`Subflow '${expectedId}' must have type 'subflow'`);
  }

  delete subflow.nodes;
  delete subflow.configs;

  const normalizeMember = (node) => {
    if (!isObject(node)) {
      throw new Error("Subflow members must be objects");
    }

    if (node.type === "tab" || node.type === "subflow") {
      throw new Error("Subflow members must not contain tab or subflow nodes");
    }

    return node.z === undefined ? { ...node, z: expectedId } : { ...node };
  };

  return {
    subflow: {
      ...subflow,
      id: expectedId,
      type: "subflow",
    },
    nodes: nodes.map(normalizeMember),
    configs: configs.map(normalizeMember),
  };
}

export function subflowConfigToGlobalSubflow(payload) {
  const normalized = normalizeSubflowConfig(payload);
  return {
    ...normalized.subflow,
    nodes: normalized.nodes,
    configs: normalized.configs,
  };
}

export function subflowConfigToFlatArray(payload) {
  const normalized = normalizeSubflowConfig(payload);
  return [
    normalized.subflow,
    ...normalized.nodes,
    ...normalized.configs,
  ];
}

function validateSubflowWireRefs(refs, ids, errors, context) {
  if (!Array.isArray(refs)) {
    errors.push({
      code: "invalid_subflow_port_wires",
      id: context.subflowId,
      field: context.field,
      message: `Subflow '${context.subflowId}' ${context.field} wires must be an array`,
    });
    return;
  }

  refs.forEach((ref, refIndex) => {
    if (!isObject(ref) || !ref.id) {
      errors.push({
        code: "invalid_subflow_port_target",
        id: context.subflowId,
        field: `${context.field}.wires[${refIndex}]`,
        message: `Subflow '${context.subflowId}' ${context.field} wire ${refIndex} must reference a node id`,
      });
      return;
    }

    if (!ids.has(ref.id)) {
      errors.push({
        code: "missing_subflow_port_target",
        id: context.subflowId,
        field: `${context.field}.wires[${refIndex}].id`,
        targetId: ref.id,
        message: `Subflow '${context.subflowId}' ${context.field} wire points to missing node '${ref.id}'`,
      });
    }
  });
}

function validateSubflowPorts(subflow, nodes, errors) {
  const ids = new Set(nodes.map((node) => node.id).filter(Boolean));
  const subflowId = subflow.id;

  for (const field of ["in", "out"]) {
    const ports = subflow[field];
    if (ports === undefined) {
      continue;
    }

    if (!Array.isArray(ports)) {
      errors.push({
        code: "invalid_subflow_ports",
        id: subflowId,
        field,
        message: `Subflow '${subflowId}' '${field}' must be an array`,
      });
      continue;
    }

    ports.forEach((port, portIndex) => {
      if (!isObject(port)) {
        errors.push({
          code: "invalid_subflow_port",
          id: subflowId,
          field: `${field}[${portIndex}]`,
          message: `Subflow '${subflowId}' ${field}[${portIndex}] must be an object`,
        });
        return;
      }

      validateSubflowWireRefs(port.wires || [], ids, errors, {
        subflowId,
        field: `${field}[${portIndex}]`,
      });
    });
  }

  if (isObject(subflow.status) && subflow.status.wires !== undefined) {
    validateSubflowWireRefs(subflow.status.wires, ids, errors, {
      subflowId,
      field: "status",
    });
  }
}

export function validateSubflowPayload(payload, options = {}) {
  const normalized = normalizeSubflowConfig(payload, { id: options.id });
  const validation = validateFlowPayload(
    subflowConfigToFlatArray(normalized),
    {
      ...options,
      flowId: normalized.subflow.id,
      allowExternalConfigRefs: options.allowExternalConfigRefs ?? true,
    }
  );

  validateSubflowPorts(
    normalized.subflow,
    [...normalized.nodes, ...normalized.configs],
    validation.errors
  );

  validation.valid = validation.errors.length === 0;
  validation.stats = {
    ...validation.stats,
    subflowId: normalized.subflow.id,
    subflowName: getSubflowName(normalized.subflow),
    nodeCount: normalized.nodes.length,
    configCount: normalized.configs.length,
  };

  return validation;
}

function normalizeGlobalFlow(globalFlow) {
  if (!isObject(globalFlow)) {
    throw new Error("Global flow configuration must be an object");
  }

  const next = cloneJson(globalFlow);
  next.id = "global";

  if (!Array.isArray(next.configs)) {
    next.configs = [];
  }

  if (!Array.isArray(next.subflows)) {
    next.subflows = [];
  }

  return next;
}

export function replaceSubflowInGlobalFlow(globalFlow, payload) {
  const replacement = subflowConfigToGlobalSubflow(payload);
  const next = normalizeGlobalFlow(globalFlow);
  const index = next.subflows.findIndex(
    (subflow) => subflow?.id === replacement.id
  );

  if (index === -1) {
    throw new Error(`Subflow '${replacement.id}' was not found in global flow`);
  }

  next.subflows[index] = replacement;
  return next;
}

export function appendSubflowToGlobalFlow(globalFlow, payload) {
  const addition = subflowConfigToGlobalSubflow(payload);
  const next = normalizeGlobalFlow(globalFlow);

  if (next.subflows.some((subflow) => subflow?.id === addition.id)) {
    throw new Error(`Subflow '${addition.id}' already exists in global flow`);
  }

  next.subflows.push(addition);
  return next;
}

function applyReplacementsToSubflowConfig(config, options = {}) {
  const next = cloneJson(config);
  const changes = [];

  next.subflow = applyStringUpdater(
    next.subflow,
    (value, pathString) => {
      if (!shouldEditStringPath(pathString, options)) {
        return value;
      }
      return applyReplacementsToString(
        value,
        options.replacements || {},
        options.regexReplacements || []
      );
    },
    changes,
    [],
    { node: next.subflow }
  );

  const nodeTypes = options.nodeTypes ? new Set(options.nodeTypes) : null;
  const transformNode = (node) => {
    if (nodeTypes && !nodeTypes.has(node.type)) {
      return node;
    }

    return applyStringUpdater(
      node,
      (value, pathString) => {
        if (!shouldEditStringPath(pathString, options)) {
          return value;
        }
        return applyReplacementsToString(
          value,
          options.replacements || {},
          options.regexReplacements || []
        );
      },
      changes,
      [],
      { node }
    );
  };

  next.nodes = next.nodes.map(transformNode);
  next.configs = next.configs.map(transformNode);

  return { config: next, changes };
}

export function cloneSubflowConfig(sourcePayload, options = {}) {
  const source = normalizeSubflowConfig(sourcePayload);
  const existingIds = new Set(options.existingIds || []);
  const idMap = {};
  const sourceObjects = subflowConfigToFlatArray(source).filter((node) => node?.id);

  if (options.newId && existingIds.has(options.newId)) {
    throw new Error(`Subflow id '${options.newId}' already exists`);
  }

  idMap[source.subflow.id] = options.newId || createNodeRedId(existingIds);
  existingIds.add(idMap[source.subflow.id]);

  for (const node of sourceObjects) {
    if (node.id === source.subflow.id) {
      continue;
    }
    idMap[node.id] = createNodeRedId(existingIds);
  }

  let cloned = remapIds(cloneJson(source), idMap);
  cloned.subflow.id = idMap[source.subflow.id];
  cloned.subflow.type = "subflow";
  cloned.subflow.name =
    options.newName || cloned.subflow.name || "Cloned subflow";
  cloned.nodes = cloned.nodes.map((node) => ({
    ...node,
    z: cloned.subflow.id,
  }));
  cloned.configs = cloned.configs.map((node) => ({
    ...node,
    z: node.z === undefined ? cloned.subflow.id : node.z,
  }));

  const replacementResult = applyReplacementsToSubflowConfig(cloned, {
    replacements: options.replacements || {},
    regexReplacements: options.regexReplacements || [],
  });
  cloned = replacementResult.config;

  let clearResult = { flow: { nodes: cloned.nodes, configs: cloned.configs }, changes: [] };
  if (options.clearEntityPatterns?.length > 0) {
    clearResult = clearEntitiesInFlow(
      {
        id: cloned.subflow.id,
        nodes: cloned.nodes,
        configs: cloned.configs,
      },
      {
        patterns: options.clearEntityPatterns,
        replacement: options.clearEntityReplacement ?? "",
      }
    );
    cloned.nodes = clearResult.flow.nodes;
    cloned.configs = clearResult.flow.configs;
  }

  const validation = validateSubflowPayload(cloned, {
    allowEmptyEntities: options.allowEmptyEntities ?? true,
    allowExternalConfigRefs: true,
    knownExternalLinkIds: options.knownExternalLinkIds,
  });

  return {
    subflow: cloned,
    idMap,
    plannedId: cloned.subflow.id,
    changes: {
      replacements: replacementResult.changes,
      clearedEntities: clearResult.changes,
    },
    validation,
    summary: {
      nodes: cloned.nodes.length,
      configs: cloned.configs.length,
      replacements: replacementResult.changes.length,
      clearedEntities: clearResult.changes.length,
    },
  };
}

export function summarizeSubflowUsage(flows, id) {
  if (!Array.isArray(flows)) {
    throw new Error("flows must be an array");
  }

  const tabsById = new Map(
    flows
      .filter((node) => node?.type === "tab")
      .map((tab) => [tab.id, tab])
  );
  const expectedType = `subflow:${id}`;
  const instances = flows
    .filter((node) => node?.type === expectedType)
    .map((node) => {
      const tab = tabsById.get(node.z);
      return {
        id: node.id,
        name: getNodeName(node),
        flowId: node.z || null,
        flowLabel: tab ? getTabLabel(tab) : null,
        disabled: node.d === true || node.disabled === true,
      };
    });
  const byFlow = {};

  for (const instance of instances) {
    const key = instance.flowId || "(unknown)";
    byFlow[key] ||= {
      flowId: instance.flowId,
      flowLabel: instance.flowLabel,
      count: 0,
    };
    byFlow[key].count++;
  }

  return {
    subflowId: id,
    instanceCount: instances.length,
    byFlow: Object.values(byFlow),
    instances,
  };
}

export function filterNodes(flows, filters = {}) {
  const tab = resolveFlowTab(flows, filters);
  const propertyFilters = filters.properties || {};

  return flows.filter((node) => {
    if (!node || typeof node !== "object") {
      return false;
    }

    if (!filters.includeTabs && node.type === "tab") {
      return false;
    }

    if (tab && node.id !== tab.id && node.z !== tab.id) {
      return false;
    }

    if (filters.subflowId && node.z !== filters.subflowId) {
      return false;
    }

    if (filters.nodeType && node.type !== filters.nodeType) {
      return false;
    }

    if (filters.name && !getNodeName(node).includes(filters.name)) {
      return false;
    }

    if (filters.entityId) {
      let found = false;
      visitValues(node, ({ value, pathString }) => {
        if (
          !found &&
          typeof value === "string" &&
          isEntityFieldPath(pathString) &&
          extractEntityIds(value).includes(filters.entityId)
        ) {
          found = true;
        }
      });
      if (!found) {
        return false;
      }
    }

    for (const [path, expected] of Object.entries(propertyFilters)) {
      const actual = getValueAtPath(node, path);
      if (actual === undefined || String(actual) !== String(expected)) {
        return false;
      }
    }

    return true;
  });
}

export function searchNodeFields(nodes, options = {}) {
  const matches = [];
  const query = options.query === undefined ? undefined : String(options.query);
  const queryRegex = options.regex ? new RegExp(options.regex) : null;
  const property = options.property;

  for (const node of nodes) {
    visitValues(node, ({ value, pathString }) => {
      if (isObject(value) || Array.isArray(value)) {
        return;
      }

      if (property && pathString !== property && lastPathKey(pathString) !== property) {
        return;
      }

      const text = String(value);
      const matched =
        queryRegex?.test(text) ||
        (query !== undefined && text.includes(query)) ||
        (query === undefined && !queryRegex && property && value !== undefined);

      if (!matched) {
        return;
      }

      matches.push({
        id: node.id,
        type: node.type || "",
        name: getNodeName(node),
        field: pathString,
        value,
      });
    });
  }

  return matches;
}

export function isEntityFieldPath(pathString) {
  const lower = String(pathString || "").toLowerCase();
  const key = lastPathKey(lower);

  if (["service", "action", "domain"].includes(key)) {
    return false;
  }

  return (
    key.includes("entity") ||
    lower.includes(".target.") ||
    lower.endsWith(".target") ||
    lower.includes(".data.entity") ||
    lower.endsWith("entityid") ||
    lower.endsWith("entity_id")
  );
}

function categoriesForEntity(node, pathString, value, entityId) {
  const categories = [];
  const type = node.type || "";
  const lowerPath = String(pathString || "").toLowerCase();

  if (TRIGGER_NODE_TYPES.has(type) || type.includes("state-changed")) {
    categories.push("trigger");
  }

  if (CURRENT_STATE_NODE_TYPES.has(type) || type.includes("current-state")) {
    categories.push("current_state");
  }

  if (type === "api-call-service" && !["service", "action"].includes(lastPathKey(lowerPath))) {
    categories.push("service_target");
  }

  if (String(value).includes("{{") || lowerPath.includes("template")) {
    categories.push("template");
  }

  if (lowerPath.includes("flow") || lowerPath.includes("global")) {
    categories.push("flow_variable");
  }

  if (entityId.startsWith("light.")) {
    categories.push("concrete_light");
  }

  if (/^(input_number|input_boolean|input_select)\./.test(entityId)) {
    categories.push("helper_or_placeholder");
  }

  if (categories.length === 0) {
    categories.push("entity");
  }

  return [...new Set(categories)];
}

export function auditEntitiesInNodes(nodes) {
  const entities = [];

  for (const node of nodes) {
    visitValues(node, ({ value, pathString }) => {
      if (typeof value !== "string" || !isEntityFieldPath(pathString)) {
        return;
      }

      for (const entityId of extractEntityIds(value)) {
        entities.push({
          entityId,
          nodeId: node.id || null,
          nodeType: node.type || "",
          nodeName: getNodeName(node),
          field: pathString,
          value,
          categories: categoriesForEntity(node, pathString, value, entityId),
        });
      }
    });
  }

  const byCategory = {};
  for (const entry of entities) {
    for (const category of entry.categories) {
      byCategory[category] = (byCategory[category] || 0) + 1;
    }
  }

  return {
    summary: {
      occurrences: entities.length,
      uniqueEntities: new Set(entities.map((entry) => entry.entityId)).size,
      byCategory,
    },
    entities,
  };
}

export function auditEntitiesInFlow(flow) {
  const nodes = Array.isArray(flow)
    ? flow
    : [
        ...(flow.nodes || []),
        ...(flow.configs || []),
      ];

  return auditEntitiesInNodes(nodes);
}

function validateWires(node, ids, errors) {
  if (node.wires === undefined) {
    return;
  }

  if (!Array.isArray(node.wires)) {
    errors.push({
      code: "invalid_wires",
      id: node.id,
      message: `Node '${node.id || "(unknown)"}' wires must be an array`,
    });
    return;
  }

  node.wires.forEach((output, outputIndex) => {
    if (!Array.isArray(output)) {
      errors.push({
        code: "invalid_wires",
        id: node.id,
        message: `Node '${node.id || "(unknown)"}' output ${outputIndex} wires must be an array`,
      });
      return;
    }

    output.forEach((targetId) => {
      if (targetId && !ids.has(targetId)) {
        errors.push({
          code: "missing_wire_target",
          id: node.id,
          targetId,
          message: `Node '${node.id || "(unknown)"}' wire points to missing node '${targetId}'`,
        });
      }
    });
  });
}

function normalizeKnownExternalLinkIds(value) {
  if (!value) {
    return new Set();
  }

  return value instanceof Set ? value : new Set(value);
}

function validateLinks(node, ids, errors, warnings, options = {}) {
  if (node.links === undefined) {
    return;
  }

  if (!Array.isArray(node.links)) {
    errors.push({
      code: "invalid_links",
      id: node.id,
      message: `Node '${node.id || "(unknown)"}' links must be an array`,
    });
    return;
  }

  const knownExternalLinkIds = normalizeKnownExternalLinkIds(
    options.knownExternalLinkIds
  );
  const allowUnknownExternalLinkRefs =
    options.allowUnknownExternalLinkRefs === true;

  node.links.forEach((targetId) => {
    if (!targetId || ids.has(targetId) || knownExternalLinkIds.has(targetId)) {
      return;
    }

    const issue = {
      code: allowUnknownExternalLinkRefs
        ? "unknown_external_link_target"
        : "missing_link_target",
      id: node.id,
      targetId,
      message: `Node '${node.id || "(unknown)"}' link points to missing node '${targetId}'`,
    };

    if (allowUnknownExternalLinkRefs) {
      warnings.push(issue);
      return;
    }

    errors.push(issue);
  });
}

function validateGroups(nodes, ids, errors, warnings) {
  const groups = new Map(
    nodes
      .filter((node) => node.type === "group" && node.id)
      .map((group) => [group.id, group])
  );

  for (const group of groups.values()) {
    if (!Array.isArray(group.nodes)) {
      warnings.push({
        code: "invalid_group_nodes",
        id: group.id,
        message: `Group '${group.id}' nodes must be an array`,
      });
      continue;
    }

    for (const nodeId of group.nodes) {
      if (!ids.has(nodeId)) {
        errors.push({
          code: "missing_group_member",
          id: group.id,
          targetId: nodeId,
          message: `Group '${group.id}' contains missing node '${nodeId}'`,
        });
      }
    }
  }

  for (const node of nodes) {
    if (!node.g) {
      continue;
    }

    const group = groups.get(node.g);
    if (!group) {
      errors.push({
        code: "missing_group",
        id: node.id,
        targetId: node.g,
        message: `Node '${node.id || "(unknown)"}' references missing group '${node.g}'`,
      });
    } else if (Array.isArray(group.nodes) && !group.nodes.includes(node.id)) {
      warnings.push({
        code: "group_membership_mismatch",
        id: node.id,
        targetId: node.g,
        message: `Node '${node.id}' references group '${node.g}', but the group does not list the node`,
      });
    }
  }
}

function validateConfigRefs(nodes, ids, warnings, allowExternalConfigRefs, catalog) {
  for (const node of nodes) {
    const catalogRefs = catalog?.[node.type];
    if (catalogRefs) {
      for (const [field, expectedType] of Object.entries(catalogRefs)) {
        const value = node[field];
        if (typeof value !== "string" || !value || ids.has(value)) {
          continue;
        }

        if (!allowExternalConfigRefs) {
          warnings.push({
            code: "missing_config_ref",
            id: node.id,
            field,
            targetId: value,
            expectedType,
            source: "node_metadata",
            message: `Node '${node.id || "(unknown)"}' field '${field}' references missing ${expectedType} config node '${value}'`,
          });
        }
      }
      continue;
    }

    for (const [key, value] of Object.entries(node)) {
      if (
        typeof value !== "string" ||
        !value ||
        ids.has(value) ||
        !ID_LIKE_PATTERN.test(value) ||
        !CONFIG_REF_KEYS.has(key)
      ) {
        continue;
      }

      if (!allowExternalConfigRefs) {
        warnings.push({
          code: "missing_config_ref",
          id: node.id,
          field: key,
          targetId: value,
          source: "heuristic",
          message: `Node '${node.id || "(unknown)"}' field '${key}' may reference missing config node '${value}'`,
        });
      }
    }
  }
}

function validateEntityFields(nodes, warnings, errors, options) {
  for (const node of nodes) {
    visitValues(node, ({ value, pathString }) => {
      if (!isEntityFieldPath(pathString)) {
        return;
      }

      const report = options.strictEntities ? errors : warnings;

      if (value === "") {
        if (!options.allowEmptyEntities) {
          report.push({
            code: "empty_entity_field",
            id: node.id,
            field: pathString,
            message: `Node '${node.id || "(unknown)"}' has an empty entity field '${pathString}'`,
          });
        }
        return;
      }

      if (typeof value === "string" && value && !value.includes("{{")) {
        const entities = extractEntityIds(value);
        if (entities.length === 0 && /entity/i.test(pathString)) {
          warnings.push({
            code: "invalid_entity_field",
            id: node.id,
            field: pathString,
            value,
            message: `Node '${node.id || "(unknown)"}' field '${pathString}' does not look like a Home Assistant entity id`,
          });
        }
      }
    });
  }
}

export function validateFlowPayload(payload, options = {}) {
  const errors = [];
  const warnings = [];
  let objects;
  let flowId = options.flowId || null;
  let allowExternalConfigRefs = options.allowExternalConfigRefs;

  if (Array.isArray(payload)) {
    objects = payload;
    allowExternalConfigRefs = allowExternalConfigRefs ?? false;
  } else if (isObject(payload)) {
    flowId = flowId || payload.id || null;
    objects = singleFlowToArray(payload);
    allowExternalConfigRefs = allowExternalConfigRefs ?? true;
  } else {
    throw new Error("Flow payload must be an object or an array");
  }

  const ids = new Set();
  const duplicateIds = new Set();

  for (const node of objects) {
    if (!isObject(node)) {
      errors.push({
        code: "invalid_node",
        message: "Flow payload contains a non-object node",
      });
      continue;
    }

    if (!node.id) {
      warnings.push({
        code: "missing_id",
        type: node.type || "",
        message: `A '${node.type || "unknown"}' node is missing an id`,
      });
      continue;
    }

    if (ids.has(node.id)) {
      duplicateIds.add(node.id);
    }
    ids.add(node.id);
  }

  for (const id of duplicateIds) {
    errors.push({
      code: "duplicate_id",
      id,
      message: `Duplicate node id '${id}'`,
    });
  }

  const nodes = objects.filter((node) => isObject(node) && node.type !== "tab");

  if (flowId) {
    for (const node of nodes) {
      if (node.z !== undefined && node.z !== flowId) {
        errors.push({
          code: "wrong_z",
          id: node.id,
          z: node.z,
          expected: flowId,
          message: `Node '${node.id || "(unknown)"}' belongs to flow '${node.z}', not '${flowId}'`,
        });
      }
    }
  }

  for (const node of nodes) {
    validateWires(node, ids, errors);
    validateLinks(node, ids, errors, warnings, options);
  }

  validateGroups(nodes, ids, errors, warnings);
  validateConfigRefs(
    nodes,
    ids,
    warnings,
    allowExternalConfigRefs,
    options.configRefCatalog || null
  );
  validateEntityFields(nodes, warnings, errors, options);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      objectCount: objects.length,
      nodeCount: nodes.length,
      idCount: ids.size,
      duplicateIdCount: duplicateIds.size,
    },
  };
}

function createNodeRedId(existingIds) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const id = crypto.randomBytes(8).toString("hex");
    if (!existingIds.has(id)) {
      existingIds.add(id);
      return id;
    }
  }

  throw new Error("Could not generate a unique Node-RED id");
}

function remapIds(value, idMap) {
  if (typeof value === "string") {
    return idMap[value] || value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => remapIds(item, idMap));
  }

  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, remapIds(child, idMap)])
    );
  }

  return value;
}

function applyStringUpdater(value, updater, changes, path = [], context = {}) {
  if (typeof value === "string") {
    const pathString = pathToString(path);
    const next = updater(value, pathString, context);
    if (next !== value) {
      changes.push({
        id: context.node?.id || null,
        type: context.node?.type || "",
        name: getNodeName(context.node),
        field: pathString,
        before: value,
        after: next,
      });
    }
    return next;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      applyStringUpdater(item, updater, changes, path.concat(index), context)
    );
  }

  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        applyStringUpdater(child, updater, changes, path.concat(key), context),
      ])
    );
  }

  return value;
}

function shouldEditStringPath(pathString, options = {}) {
  const key = lastPathKey(pathString);
  if (!options.includeStructural && STRUCTURAL_KEYS.has(key)) {
    return false;
  }

  if (options.fieldPaths?.length > 0 && !options.fieldPaths.includes(pathString)) {
    return false;
  }

  if (options.fieldRegex) {
    const regex = new RegExp(options.fieldRegex);
    if (!regex.test(pathString)) {
      return false;
    }
  }

  return true;
}

function applyReplacementsToString(value, replacements = {}, regexReplacements = []) {
  let next = value;

  for (const [search, replacement] of Object.entries(replacements)) {
    if (search) {
      next = next.split(search).join(String(replacement));
    }
  }

  for (const item of regexReplacements) {
    const regex = new RegExp(item.pattern, item.flags || "g");
    next = next.replace(regex, item.replacement || "");
  }

  return next;
}

export function applyReplacementsToFlow(flow, options = {}) {
  const nextFlow = cloneJson(flow);
  const changes = [];
  const nodeTypes = options.nodeTypes ? new Set(options.nodeTypes) : null;
  const transformNode = (node) => {
    if (nodeTypes && !nodeTypes.has(node.type)) {
      return node;
    }

    return applyStringUpdater(
      node,
      (value, pathString) => {
        if (!shouldEditStringPath(pathString, options)) {
          return value;
        }
        return applyReplacementsToString(
          value,
          options.replacements || {},
          options.regexReplacements || []
        );
      },
      changes,
      [],
      { node }
    );
  };

  nextFlow.nodes = (nextFlow.nodes || []).map(transformNode);
  nextFlow.configs = (nextFlow.configs || []).map(transformNode);

  for (const key of ["label", "name", "info"]) {
    if (typeof nextFlow[key] === "string") {
      const after = applyReplacementsToString(
        nextFlow[key],
        options.replacements || {},
        options.regexReplacements || []
      );
      if (after !== nextFlow[key]) {
        changes.push({
          id: nextFlow.id || null,
          type: "tab",
          name: getTabLabel(nextFlow),
          field: key,
          before: nextFlow[key],
          after,
        });
        nextFlow[key] = after;
      }
    }
  }

  return { flow: nextFlow, changes };
}

export function clearEntitiesInFlow(flow, options = {}) {
  const nextFlow = cloneJson(flow);
  const changes = [];
  const patterns = compilePatterns(options.patterns || []);
  const replacement = options.replacement ?? "";

  if (patterns.length === 0) {
    return { flow: nextFlow, changes };
  }

  const transformNode = (node) =>
    applyStringUpdater(
      node,
      (value, pathString) => {
        if (!isEntityFieldPath(pathString)) {
          return value;
        }

        let next = value;
        for (const entityId of extractEntityIds(value)) {
          if (matchesAny(entityId, patterns)) {
            next = next.split(entityId).join(replacement);
          }
        }

        return next;
      },
      changes,
      [],
      { node }
    );

  nextFlow.nodes = (nextFlow.nodes || []).map(transformNode);
  nextFlow.configs = (nextFlow.configs || []).map(transformNode);

  return { flow: nextFlow, changes };
}

export function cloneFlowConfig(sourceFlow, options = {}) {
  if (!isObject(sourceFlow)) {
    throw new Error("sourceFlow must be an object");
  }

  if (!sourceFlow.id) {
    throw new Error("sourceFlow must include an id");
  }

  const existingIds = new Set(options.existingIds || []);
  const sourceObjects = singleFlowToArray(sourceFlow).filter((node) => node?.id);
  const idMap = {};

  idMap[sourceFlow.id] = options.newId || createNodeRedId(existingIds);

  for (const node of sourceObjects) {
    if (node.id === sourceFlow.id) {
      continue;
    }
    idMap[node.id] = createNodeRedId(existingIds);
  }

  let cloned = remapIds(cloneJson(sourceFlow), idMap);
  cloned.id = idMap[sourceFlow.id];
  cloned.label = options.newLabel || cloned.label || cloned.name || "Cloned flow";

  const replacementResult = applyReplacementsToFlow(cloned, {
    replacements: options.replacements || {},
    regexReplacements: options.regexReplacements || [],
  });
  cloned = replacementResult.flow;

  let clearResult = { flow: cloned, changes: [] };
  if (options.clearEntityPatterns?.length > 0) {
    clearResult = clearEntitiesInFlow(cloned, {
      patterns: options.clearEntityPatterns,
      replacement: options.clearEntityReplacement ?? "",
    });
    cloned = clearResult.flow;
  }

  const validation = validateFlowPayload(cloned, {
    allowEmptyEntities: options.allowEmptyEntities ?? true,
    allowExternalConfigRefs: true,
    knownExternalLinkIds: options.knownExternalLinkIds,
  });

  return {
    flow: cloned,
    idMap,
    plannedId: cloned.id,
    changes: {
      replacements: replacementResult.changes,
      clearedEntities: clearResult.changes,
    },
    validation,
    summary: {
      nodes: cloned.nodes?.length || 0,
      configs: cloned.configs?.length || 0,
      replacements: replacementResult.changes.length,
      clearedEntities: clearResult.changes.length,
    },
  };
}

export function summarizeInternalLinks(flow) {
  const nodes = Array.isArray(flow) ? flow : [...(flow.nodes || []), ...(flow.configs || [])];
  return nodes
    .filter((node) => Array.isArray(node.links) && node.links.length > 0)
    .map((node) => ({
      id: node.id,
      type: node.type || "",
      name: getNodeName(node),
      links: node.links,
    }));
}

export function getAllIds(flows) {
  const ids = new Set();
  for (const node of flows || []) {
    if (node?.id) {
      ids.add(node.id);
    }
  }
  return ids;
}
