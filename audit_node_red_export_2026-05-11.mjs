import fs from "fs";
import path from "path";

const BACKUP_PATH = ".mcp-backups/audit_full_export_20260511.json";
const INVENTORY_JSON = "NODE_RED_AUDIT_INVENTORY_2026-05-11.json";
const INVENTORY_MD = "NODE_RED_AUDIT_INVENTORY_2026-05-11.md";

const ENTITY_ID_PATTERN = /\b[a-z_][a-z0-9_]*\.[a-z0-9_][a-z0-9_-]*\b/gi;

const NON_ENTITY_DOMAINS = new Set([
  "app",
  "com",
  "context",
  "flow",
  "global",
  "home",
  "http",
  "https",
  "mobile",
  "msg",
  "node",
  "parent",
  "payload",
]);

const ACTUATOR_SERVICE_DOMAINS = new Set([
  "alarm_control_panel",
  "button",
  "climate",
  "cover",
  "fan",
  "humidifier",
  "input_button",
  "light",
  "lock",
  "media_player",
  "number",
  "remote",
  "scene",
  "script",
  "select",
  "siren",
  "switch",
  "vacuum",
  "water_heater",
]);

const HELPER_DOMAINS = new Set([
  "counter",
  "input_boolean",
  "input_button",
  "input_datetime",
  "input_number",
  "input_select",
  "input_text",
  "timer",
]);

const SYSTEM_SERVICE_DOMAINS = new Set([
  "automation",
  "config",
  "hassio",
  "homeassistant",
  "recorder",
  "shell_command",
  "system_log",
  "update",
]);

const READ_NODE_TYPES = new Set([
  "api-current-state",
  "api-get-history",
  "ha-get-entities",
  "poll-state",
  "server-state-changed",
  "trigger-state",
]);

const TRIGGER_NODE_TYPES = new Set([
  "server-state-changed",
  "trigger-state",
  "events-state",
  "poll-state",
  "ha-events",
  "inject",
  "bigtimer",
  "cronplus",
]);

const EXPECTED_OWNER_BY_SERVICE_DOMAIN = {
  alarm_control_panel: "AL",
  climate: "KL",
  cover: "RE",
  fan: "KL",
  humidifier: "KL",
  light: "LI",
  lock: "AL",
  media_player: "M",
  remote: "M",
  scene: "LI",
  siren: "AL",
  switch: "STE",
  vacuum: "STA",
  water_heater: "KL",
};

const EXPECTED_OWNER_BY_ENTITY_DOMAIN = {
  alarm_control_panel: "AL",
  binary_sensor: null,
  climate: "KL",
  cover: "RE",
  fan: "KL",
  humidifier: "KL",
  light: "LI",
  lock: "AL",
  media_player: "M",
  remote: "M",
  scene: "LI",
  siren: "AL",
  switch: "STE",
  vacuum: "STA",
  water_heater: "KL",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, value.replace(/\n+$/u, "\n"));
}

function countBy(items, keyFn) {
  const result = {};
  for (const item of items) {
    const key = keyFn(item);
    result[key] = (result[key] || 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(result).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  );
}

function inc(object, key, amount = 1) {
  object[key] = (object[key] || 0) + amount;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function entityDomain(entityId) {
  return String(entityId || "").split(".")[0] || "";
}

function extractEntityIds(value) {
  const entities = [];

  function visit(item) {
    if (typeof item === "string") {
      for (const match of item.matchAll(ENTITY_ID_PATTERN)) {
        entities.push(match[0]);
      }
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item && typeof item === "object") {
      Object.values(item).forEach(visit);
    }
  }

  visit(value);
  return unique(entities).filter((entityId) => !NON_ENTITY_DOMAINS.has(entityDomain(entityId)));
}

function visitValues(value, visitor, pathParts = []) {
  visitor(value, pathParts);

  if (Array.isArray(value)) {
    value.forEach((item, index) => visitValues(item, visitor, pathParts.concat(index)));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      visitValues(child, visitor, pathParts.concat(key));
    }
  }
}

function pathString(pathParts) {
  return pathParts
    .map((part) => (typeof part === "number" ? `[${part}]` : String(part)))
    .join(".");
}

function lastPathKey(pathParts) {
  const last = pathParts[pathParts.length - 1];
  return String(last || "").toLowerCase();
}

function isEntityRelevantPath(pathParts) {
  const lower = pathString(pathParts).toLowerCase();
  const key = lastPathKey(pathParts);
  if (["action", "domain", "service"].includes(key)) {
    return false;
  }
  return (
    key.includes("entity") ||
    lower.includes("target") ||
    lower.includes("data") ||
    lower.includes("template") ||
    lower.endsWith("entity_id") ||
    lower.endsWith("entityid")
  );
}

function nodeName(node) {
  return node.name || node.label || "";
}

function parseAction(node) {
  if (node.domain && node.service) {
    return { domain: String(node.domain), service: String(node.service) };
  }

  const action = String(node.action || "");
  if (action.includes(".")) {
    const [domain, ...rest] = action.split(".");
    return { domain, service: rest.join(".") };
  }

  return {
    domain: String(node.domain || ""),
    service: String(node.service || action || ""),
  };
}

function tabPrefix(label) {
  if (!label || label.startsWith("###")) {
    return "";
  }
  const match = /^([A-Z0-9]+)\s+-/.exec(label);
  return match ? match[1] : "";
}

function sectionName(label) {
  return label.replace(/^#+\s*/u, "").trim();
}

function hasConcreteOrDynamicTarget(node) {
  const directEntities = extractEntityIds({
    entityId: node.entityId,
    entity_id: node.entity_id,
    target: node.target,
    data: node.data,
  });
  if (directEntities.length > 0) {
    return true;
  }
  const text = JSON.stringify({
    entityId: node.entityId,
    target: node.target,
    data: node.data,
  });
  return text.includes("{{") || text.includes("$parent") || text.includes("msg.");
}

function riskLevel(score) {
  if (score >= 80) return "hoch";
  if (score >= 35) return "mittel";
  return "niedrig";
}

function markdownTable(headers, rows) {
  const clean = (value) => String(value ?? "").replace(/\|/gu, "\\|").replace(/\n/gu, " ");
  const lines = [];
  lines.push(`| ${headers.map(clean).join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of rows) {
    lines.push(`| ${row.map(clean).join(" | ")} |`);
  }
  return lines.join("\n");
}

const backup = readJson(BACKUP_PATH);
const flows = backup.flows;
const tabs = flows.filter((node) => node.type === "tab");
const subflows = flows.filter((node) => node.type === "subflow");
const configNodes = flows.filter((node) => node.type !== "tab" && node.type !== "subflow" && !node.z);
const regularNodes = flows.filter((node) => node.type !== "tab" && node.type !== "subflow");

const tabById = new Map(tabs.map((tab) => [tab.id, tab]));
const subflowById = new Map(subflows.map((subflow) => [subflow.id, subflow]));
const allIds = new Set(flows.map((node) => node.id).filter(Boolean));

let currentSection = "(ohne Sektion)";
const sectionByTabId = new Map();
for (const tab of tabs) {
  if (tab.label?.startsWith("###")) {
    currentSection = sectionName(tab.label);
  }
  sectionByTabId.set(tab.id, currentSection);
}

function ownerForNode(node) {
  if (node.z && tabById.has(node.z)) {
    const tab = tabById.get(node.z);
    return {
      kind: "tab",
      id: tab.id,
      label: tab.label,
      prefix: tabPrefix(tab.label),
      section: sectionByTabId.get(tab.id) || "(ohne Sektion)",
    };
  }

  if (node.z && subflowById.has(node.z)) {
    const subflow = subflowById.get(node.z);
    return {
      kind: "subflow",
      id: subflow.id,
      label: subflow.name || subflow.label || subflow.id,
      prefix: "SUBFLOW",
      section: "Subflows",
    };
  }

  return {
    kind: "config",
    id: null,
    label: "(config/global)",
    prefix: "CONFIG",
    section: "Config",
  };
}

const nodeEnvelopes = regularNodes.map((node) => ({ node, owner: ownerForNode(node) }));

const serviceCalls = [];
const entityOccurrences = [];
const missingWireTargets = [];
const disabledNodes = [];
const longFunctions = [];
const functionMetrics = [];
const groupMetrics = [];

for (const { node, owner } of nodeEnvelopes) {
  if (node.d === true || node.disabled === true) {
    disabledNodes.push({
      id: node.id,
      type: node.type,
      name: nodeName(node),
      tab: owner.label,
      section: owner.section,
    });
  }

  if (Array.isArray(node.wires)) {
    node.wires.forEach((output, outputIndex) => {
      if (!Array.isArray(output)) {
        return;
      }
      output.forEach((targetId) => {
        if (targetId && !allIds.has(targetId)) {
          missingWireTargets.push({
            sourceId: node.id,
            sourceName: nodeName(node),
            sourceType: node.type,
            sourceTab: owner.label,
            outputIndex,
            targetId,
          });
        }
      });
    });
  }

  visitValues(node, (value, parts) => {
    if (typeof value !== "string" || !isEntityRelevantPath(parts)) {
      return;
    }
    for (const entityId of extractEntityIds(value)) {
      entityOccurrences.push({
        entityId,
        entityDomain: entityDomain(entityId),
        nodeId: node.id,
        nodeType: node.type,
        nodeName: nodeName(node),
        field: pathString(parts),
        ownerKind: owner.kind,
        tab: owner.label,
        prefix: owner.prefix,
        section: owner.section,
      });
    }
  });

  if (node.type === "function") {
    const func = String(node.func || "");
    const lines = func ? func.split(/\r?\n/u).length : 0;
    const metric = {
      id: node.id,
      name: nodeName(node),
      tab: owner.label,
      section: owner.section,
      chars: func.length,
      lines,
      usesFlowContext: /\bflow\./u.test(func),
      usesGlobalContext: /\bglobal\./u.test(func),
      usesSetTimeout: /\bsetTimeout\b/u.test(func),
      usesEnv: /\benv\./u.test(func),
    };
    functionMetrics.push(metric);
    if (lines >= 80 || func.length >= 4000) {
      longFunctions.push(metric);
    }
  }

  if (node.type === "group") {
    groupMetrics.push({
      id: node.id,
      name: nodeName(node),
      emptyName: !nodeName(node).trim(),
      tab: owner.label,
      section: owner.section,
      style: node.style || {},
    });
  }

  if (node.type !== "api-call-service") {
    continue;
  }

  const { domain, service } = parseAction(node);
  const targetEntities = unique(
    extractEntityIds({
      entityId: node.entityId,
      entity_id: node.entity_id,
      target: node.target,
      data: node.data,
      outputProperties: node.outputProperties,
    })
  );
  const targetDomains = unique(targetEntities.map(entityDomain));
  const expectedOwners = unique([
    EXPECTED_OWNER_BY_SERVICE_DOMAIN[domain],
    ...targetDomains.map((targetDomain) => EXPECTED_OWNER_BY_ENTITY_DOMAIN[targetDomain]),
  ]);
  const mismatchedExpectedOwners = expectedOwners.filter(
    (expectedOwner) => expectedOwner && owner.prefix && owner.prefix !== expectedOwner
  );
  const helperWrite =
    HELPER_DOMAINS.has(domain) || targetDomains.some((targetDomain) => HELPER_DOMAINS.has(targetDomain));
  const systemCall = SYSTEM_SERVICE_DOMAINS.has(domain);
  const actuatorLike =
    ACTUATOR_SERVICE_DOMAINS.has(domain) ||
    targetDomains.some((targetDomain) => ACTUATOR_SERVICE_DOMAINS.has(targetDomain));

  serviceCalls.push({
    id: node.id,
    name: nodeName(node),
    tab: owner.label,
    prefix: owner.prefix,
    section: owner.section,
    ownerKind: owner.kind,
    domain,
    service,
    action: domain && service ? `${domain}.${service}` : String(node.action || ""),
    targetEntities,
    targetDomains,
    hasTarget: hasConcreteOrDynamicTarget(node),
    helperWrite,
    systemCall,
    actuatorLike,
    sceneCall: domain === "scene" || targetDomains.includes("scene"),
    notifyCall: domain === "notify",
    queue: node.queue ?? null,
    blockInputOverrides: node.blockInputOverrides ?? null,
    expectedOwners,
    mismatchedExpectedOwners,
    crossOwner: mismatchedExpectedOwners.length > 0,
  });
}

const tabStats = tabs.map((tab, index) => {
  const nodes = regularNodes.filter((node) => node.z === tab.id);
  const services = serviceCalls.filter((call) => call.tab === tab.label);
  const groups = groupMetrics.filter((group) => group.tab === tab.label);
  const functions = functionMetrics.filter((func) => func.tab === tab.label);
  const catches = nodes.filter((node) => node.type === "catch").length;
  const debugs = nodes.filter((node) => node.type === "debug").length;
  const disabled = nodes.filter((node) => node.d === true || node.disabled === true).length;
  const directActuator = services.filter((call) => call.actuatorLike && !call.helperWrite).length;
  const crossOwner = services.filter((call) => call.crossOwner).length;
  const riskScore =
    directActuator * 5 +
    crossOwner * 7 +
    services.length * 1 +
    functions.length * 2 +
    functions.filter((func) => func.lines >= 80 || func.chars >= 4000).length * 5 +
    groups.filter((group) => group.emptyName).length * 1 +
    (services.length > 0 && catches === 0 ? 5 : 0) +
    disabled * 2;

  return {
    index,
    id: tab.id,
    label: tab.label,
    prefix: tabPrefix(tab.label),
    section: sectionByTabId.get(tab.id) || "(ohne Sektion)",
    disabled: tab.disabled === true,
    locked: tab.locked === true,
    hasInfo: Boolean(String(tab.info || "").trim()),
    nodeCount: nodes.length,
    groups: groups.length,
    emptyGroups: groups.filter((group) => group.emptyName).length,
    serviceCalls: services.length,
    directActuatorCalls: directActuator,
    helperWrites: services.filter((call) => call.helperWrite).length,
    systemCalls: services.filter((call) => call.systemCall).length,
    notifyCalls: services.filter((call) => call.notifyCall).length,
    crossOwnerCalls: crossOwner,
    triggerNodes: nodes.filter((node) => TRIGGER_NODE_TYPES.has(node.type)).length,
    readNodes: nodes.filter((node) => READ_NODE_TYPES.has(node.type)).length,
    functionNodes: functions.length,
    catchNodes: catches,
    debugNodes: debugs,
    linkNodes: nodes.filter((node) => String(node.type || "").startsWith("link")).length,
    disabledNodes: disabled,
    riskScore,
    riskLevel: riskLevel(riskScore),
    nodeTypes: countBy(nodes, (node) => node.type || "(unknown)"),
  };
});

const sectionStats = [];
for (const section of unique(tabStats.map((tab) => tab.section))) {
  const sectionTabs = tabStats.filter((tab) => tab.section === section);
  const sectionServices = serviceCalls.filter((call) => call.section === section);
  sectionStats.push({
    section,
    tabs: sectionTabs.length,
    disabledTabs: sectionTabs.filter((tab) => tab.disabled).length,
    nodes: sectionTabs.reduce((sum, tab) => sum + tab.nodeCount, 0),
    groups: sectionTabs.reduce((sum, tab) => sum + tab.groups, 0),
    emptyGroups: sectionTabs.reduce((sum, tab) => sum + tab.emptyGroups, 0),
    serviceCalls: sectionServices.length,
    directActuatorCalls: sectionServices.filter((call) => call.actuatorLike && !call.helperWrite).length,
    helperWrites: sectionServices.filter((call) => call.helperWrite).length,
    crossOwnerCalls: sectionServices.filter((call) => call.crossOwner).length,
    catchNodes: sectionTabs.reduce((sum, tab) => sum + tab.catchNodes, 0),
    debugNodes: sectionTabs.reduce((sum, tab) => sum + tab.debugNodes, 0),
    functionNodes: sectionTabs.reduce((sum, tab) => sum + tab.functionNodes, 0),
    riskScore: sectionTabs.reduce((sum, tab) => sum + tab.riskScore, 0),
  });
}
sectionStats.sort((a, b) => b.riskScore - a.riskScore || a.section.localeCompare(b.section));

const subflowUsage = subflows.map((subflow) => {
  const type = `subflow:${subflow.id}`;
  const instances = regularNodes.filter((node) => node.type === type);
  return {
    id: subflow.id,
    name: subflow.name || subflow.label || subflow.id,
    internalNodes: regularNodes.filter((node) => node.z === subflow.id).length,
    instances: instances.length,
    instanceTabs: unique(instances.map((node) => ownerForNode(node).label)).sort(),
  };
});

const serviceByAction = countBy(serviceCalls, (call) => call.action || "(unknown)");
const serviceBySection = countBy(serviceCalls, (call) => call.section || "(unknown)");
const serviceByDomain = countBy(serviceCalls, (call) => call.domain || "(unknown)");
const entityByDomain = countBy(entityOccurrences, (entry) => entry.entityDomain || "(unknown)");
const entitiesById = countBy(entityOccurrences, (entry) => entry.entityId);
const nodeTypes = countBy(regularNodes, (node) => node.type || "(unknown)");

const actorTargetMap = new Map();
for (const call of serviceCalls.filter((entry) => entry.actuatorLike && !entry.helperWrite)) {
  for (const entityId of call.targetEntities) {
    const entries = actorTargetMap.get(entityId) || [];
    entries.push(call);
    actorTargetMap.set(entityId, entries);
  }
}

const actorTargetMatrix = [...actorTargetMap.entries()]
  .map(([entityId, calls]) => ({
    entityId,
    entityDomain: entityDomain(entityId),
    calls: calls.length,
    sections: unique(calls.map((call) => call.section)).sort(),
    tabs: unique(calls.map((call) => call.tab)).sort(),
    actions: unique(calls.map((call) => call.action)).sort(),
  }))
  .sort((a, b) => b.sections.length - a.sections.length || b.tabs.length - a.tabs.length || b.calls - a.calls);

const sharedActorTargets = actorTargetMatrix.filter(
  (entry) => entry.sections.length > 1 || entry.tabs.length > 1 || entry.calls > 2
);

const expectedSectionByPrefix = {
  AL: "Alarmanlage",
  AQ: "Aquarium",
  BR: "Brandmeldeanlage",
  DA: "Datenbank",
  E: "Endgerät",
  F: "Fortbewegung",
  GEO: "Geofencing",
  GES: "Gesundheit",
  H: "Heimgeräte",
  KAL: "Kalender",
  KAM: "Kamera",
  KL: "Klima",
  LI: "Licht",
  M: "Medienkontrolle",
  NE: "Netzwerk",
  RE: "Relais",
  RO: "Routine",
  SPA: "Sprachausgabe",
  SPS: "Sprachsteuerung",
  STA: "Staubsauger",
  STE: "Steckdosen",
  STR: "Strom",
  SY: "System",
  TO: "ToDo",
  WA: "Wassermeldeanlage",
  WE: "Wetter",
  ZA: "Zahnbürste",
};

const prefixSectionMismatches = tabStats
  .filter((tab) => tab.prefix && expectedSectionByPrefix[tab.prefix] && expectedSectionByPrefix[tab.prefix] !== tab.section)
  .map((tab) => ({
    tab: tab.label,
    prefix: tab.prefix,
    section: tab.section,
    expectedSection: expectedSectionByPrefix[tab.prefix],
  }));

const serviceTabsWithoutCatch = tabStats
  .filter((tab) => !tab.label.startsWith("###") && tab.serviceCalls > 0 && tab.catchNodes === 0)
  .map((tab) => ({
    tab: tab.label,
    section: tab.section,
    serviceCalls: tab.serviceCalls,
    directActuatorCalls: tab.directActuatorCalls,
  }));

const realTabsWithoutInfo = tabStats
  .filter((tab) => !tab.label.startsWith("###") && !tab.hasInfo)
  .map((tab) => ({ tab: tab.label, section: tab.section }));

const highComplexityTabs = [...tabStats]
  .filter((tab) => tab.nodeCount >= 80 || tab.serviceCalls >= 20 || tab.riskScore >= 80)
  .sort((a, b) => b.riskScore - a.riskScore || b.nodeCount - a.nodeCount);

const crossOwnerCalls = serviceCalls
  .filter((call) => call.crossOwner)
  .sort((a, b) => a.section.localeCompare(b.section) || a.tab.localeCompare(b.tab) || a.action.localeCompare(b.action));

const directActuatorCalls = serviceCalls
  .filter((call) => call.actuatorLike && !call.helperWrite)
  .sort((a, b) => a.section.localeCompare(b.section) || a.tab.localeCompare(b.tab) || a.action.localeCompare(b.action));

const dynamicTargetCalls = serviceCalls.filter((call) => call.actuatorLike && !call.targetEntities.length && call.hasTarget);
const targetlessActuatorCalls = serviceCalls.filter((call) => call.actuatorLike && !call.hasTarget);
const serviceOverrideOpen = serviceCalls.filter((call) => call.blockInputOverrides === false);
const queueNoneCalls = serviceCalls.filter((call) => call.queue === "none");
const debugConsoleCalls = regularNodes.filter((node) => node.type === "debug" && node.console === true);

const currentStateWeakAvailability = regularNodes.filter((node) => {
  if (node.type !== "api-current-state") {
    return false;
  }
  return (
    node.halt_if !== "unavailable" &&
    node.halt_if !== "unknown" &&
    node.ignoreCurrentStateUnknown !== true &&
    node.ignoreCurrentStateUnavailable !== true
  );
});

const triggerWeakAvailability = regularNodes.filter((node) => {
  if (node.type !== "server-state-changed") {
    return false;
  }
  return node.ignoreCurrentStateUnknown !== true || node.ignoreCurrentStateUnavailable !== true;
});

const inventory = {
  source: {
    backupPath: BACKUP_PATH,
    backupName: backup.metadata?.name,
    backupTimestamp: backup.metadata?.timestamp,
    checksum: backup.metadata?.checksum,
    metadata: backup.metadata,
  },
  totals: {
    totalObjects: flows.length,
    tabs: tabs.length,
    disabledTabs: tabs.filter((tab) => tab.disabled).length,
    subflows: subflows.length,
    configNodes: configNodes.length,
    regularNodes: regularNodes.length,
    serviceCalls: serviceCalls.length,
    directActuatorCalls: directActuatorCalls.length,
    helperWrites: serviceCalls.filter((call) => call.helperWrite).length,
    crossOwnerCalls: crossOwnerCalls.length,
    entityOccurrences: entityOccurrences.length,
    uniqueEntities: Object.keys(entitiesById).length,
    concreteActorTargets: actorTargetMatrix.length,
    sharedActorTargets: sharedActorTargets.length,
    missingWireTargets: missingWireTargets.length,
    disabledNodes: disabledNodes.length,
    groups: groupMetrics.length,
    emptyGroups: groupMetrics.filter((group) => group.emptyName).length,
    functionNodes: functionMetrics.length,
    longFunctions: longFunctions.length,
    catchNodes: regularNodes.filter((node) => node.type === "catch").length,
    debugNodes: regularNodes.filter((node) => node.type === "debug").length,
    consoleDebugNodes: debugConsoleCalls.length,
  },
  counts: {
    nodeTypes,
    serviceByAction,
    serviceByDomain,
    serviceBySection,
    entityByDomain,
    topEntities: Object.fromEntries(Object.entries(entitiesById).slice(0, 100)),
  },
  tabStats,
  sectionStats,
  subflowUsage,
  serviceCalls,
  directActuatorCalls,
  actorTargetMatrix,
  sharedActorTargets,
  crossOwnerCalls,
  dynamicTargetCalls,
  targetlessActuatorCalls,
  serviceOverrideOpen,
  queueNoneCalls,
  entityOccurrences,
  functionMetrics,
  longFunctions,
  groupMetrics,
  missingWireTargets,
  disabledNodes,
  prefixSectionMismatches,
  serviceTabsWithoutCatch,
  realTabsWithoutInfo,
  availability: {
    currentStateWeakAvailability: currentStateWeakAvailability.map((node) => ({
      id: node.id,
      name: nodeName(node),
      tab: ownerForNode(node).label,
      entity: node.entity_id || extractEntityIds(node).join(", "),
    })),
    triggerWeakAvailability: triggerWeakAvailability.map((node) => ({
      id: node.id,
      name: nodeName(node),
      tab: ownerForNode(node).label,
      entities: extractEntityIds(node).join(", "),
    })),
  },
};

writeJson(INVENTORY_JSON, inventory);

const topServiceActions = Object.entries(serviceByAction).slice(0, 25);
const topEntities = Object.entries(entitiesById).slice(0, 25);

const md = [
  "# Node-RED Audit Inventar 2026-05-11",
  "",
  `Quelle: \`${BACKUP_PATH}\``,
  `Backup: \`${backup.metadata?.name}\`, Zeitstempel: \`${backup.metadata?.timestamp}\``,
  "",
  "## Gesamtzahlen",
  "",
  markdownTable(
    ["Kennzahl", "Wert"],
    [
      ["Objekte gesamt", inventory.totals.totalObjects],
      ["Tabs", inventory.totals.tabs],
      ["Subflows", inventory.totals.subflows],
      ["Config Nodes", inventory.totals.configNodes],
      ["Regulaere Nodes", inventory.totals.regularNodes],
      ["Service Calls", inventory.totals.serviceCalls],
      ["Direkte aktorartige Calls", inventory.totals.directActuatorCalls],
      ["Helper Writes", inventory.totals.helperWrites],
      ["Cross-Owner Calls", inventory.totals.crossOwnerCalls],
      ["Entity-Vorkommen", inventory.totals.entityOccurrences],
      ["Eindeutige Entities", inventory.totals.uniqueEntities],
      ["Konkrete Aktor-Targets", inventory.totals.concreteActorTargets],
      ["Mehrfach genutzte Aktor-Targets", inventory.totals.sharedActorTargets],
      ["Groups", inventory.totals.groups],
      ["Leere Groups", inventory.totals.emptyGroups],
      ["Function Nodes", inventory.totals.functionNodes],
      ["Lange Functions", inventory.totals.longFunctions],
      ["Catch Nodes", inventory.totals.catchNodes],
      ["Debug Nodes", inventory.totals.debugNodes],
      ["Console Debug Nodes", inventory.totals.consoleDebugNodes],
      ["Fehlende Wire-Ziele", inventory.totals.missingWireTargets],
      ["Deaktivierte Nodes", inventory.totals.disabledNodes],
    ]
  ),
  "",
  "## Domaenen/Sektionen",
  "",
  markdownTable(
    ["Sektion", "Tabs", "Nodes", "Service", "Aktor", "CrossOwner", "Groups", "Leer", "Catch", "Debug", "Risk"],
    sectionStats.map((section) => [
      section.section,
      section.tabs,
      section.nodes,
      section.serviceCalls,
      section.directActuatorCalls,
      section.crossOwnerCalls,
      section.groups,
      section.emptyGroups,
      section.catchNodes,
      section.debugNodes,
      section.riskScore,
    ])
  ),
  "",
  "## Alle Tabs",
  "",
  markdownTable(
    [
      "#",
      "Tab",
      "Sektion",
      "Nodes",
      "Service",
      "Aktor",
      "CrossOwner",
      "Funktionen",
      "Catch",
      "Debug",
      "LeerGrp",
      "Info",
      "Risiko",
    ],
    tabStats.map((tab) => [
      tab.index + 1,
      tab.label,
      tab.section,
      tab.nodeCount,
      tab.serviceCalls,
      tab.directActuatorCalls,
      tab.crossOwnerCalls,
      tab.functionNodes,
      tab.catchNodes,
      tab.debugNodes,
      tab.emptyGroups,
      tab.hasInfo ? "ja" : "nein",
      `${tab.riskLevel} (${tab.riskScore})`,
    ])
  ),
  "",
  "## Hochkomplexe Tabs",
  "",
  markdownTable(
    ["Tab", "Sektion", "Nodes", "Service", "Aktor", "CrossOwner", "Funktionen", "Risiko"],
    highComplexityTabs.slice(0, 50).map((tab) => [
      tab.label,
      tab.section,
      tab.nodeCount,
      tab.serviceCalls,
      tab.directActuatorCalls,
      tab.crossOwnerCalls,
      tab.functionNodes,
      `${tab.riskLevel} (${tab.riskScore})`,
    ])
  ),
  "",
  "## Top Service Actions",
  "",
  markdownTable(["Action", "Anzahl"], topServiceActions),
  "",
  "## Service-Domaenen",
  "",
  markdownTable(["Domaene", "Anzahl"], Object.entries(serviceByDomain)),
  "",
  "## Entity-Domaenen",
  "",
  markdownTable(["Entity-Domaene", "Vorkommen"], Object.entries(entityByDomain)),
  "",
  "## Top Entities",
  "",
  markdownTable(["Entity", "Vorkommen"], topEntities),
  "",
  "## Subflows",
  "",
  markdownTable(
    ["Subflow", "Interne Nodes", "Instanzen", "Instanz-Tabs"],
    subflowUsage.map((subflow) => [
      subflow.name,
      subflow.internalNodes,
      subflow.instances,
      subflow.instanceTabs.join(", "),
    ])
  ),
  "",
  "## Mehrfach genutzte konkrete Aktor-Targets (erste 80)",
  "",
  markdownTable(
    ["Entity", "Calls", "Sektionen", "Tabs", "Actions"],
    sharedActorTargets.slice(0, 80).map((entry) => [
      entry.entityId,
      entry.calls,
      entry.sections.join(", "),
      entry.tabs.join(", "),
      entry.actions.join(", "),
    ])
  ),
  "",
  "## Prefix/Sektion-Abweichungen",
  "",
  markdownTable(
    ["Tab", "Prefix", "Sektion", "Erwartete Sektion"],
    prefixSectionMismatches.map((entry) => [
      entry.tab,
      entry.prefix,
      entry.section,
      entry.expectedSection,
    ])
  ),
  "",
  "## Auffaellige Cross-Owner Calls (erste 120)",
  "",
  markdownTable(
    ["Tab", "Sektion", "Action", "Node", "Targets", "Erwarteter Owner"],
    crossOwnerCalls.slice(0, 120).map((call) => [
      call.tab,
      call.section,
      call.action,
      call.name,
      call.targetEntities.join(", "),
      call.mismatchedExpectedOwners.join(", "),
    ])
  ),
  "",
  "## Lange Function Nodes",
  "",
  markdownTable(
    ["Tab", "Sektion", "Function", "Zeilen", "Chars", "FlowCtx", "GlobalCtx"],
    longFunctions.map((func) => [
      func.tab,
      func.section,
      func.name,
      func.lines,
      func.chars,
      func.usesFlowContext ? "ja" : "nein",
      func.usesGlobalContext ? "ja" : "nein",
    ])
  ),
  "",
  "## Deaktivierte Tabs/Nodes",
  "",
  markdownTable(
    ["Typ", "Tab/Node", "Sektion"],
    [
      ...tabStats.filter((tab) => tab.disabled).map((tab) => ["Tab", tab.label, tab.section]),
      ...disabledNodes.map((node) => [node.type, `${node.tab} / ${node.name}`, node.section]),
    ]
  ),
  "",
  "## Hinweis",
  "",
  "Dieses Inventar ist maschinell aus dem Flow-Export erzeugt und dient als Grundlage fuer den menschenlesbaren Auditbericht.",
  "",
].join("\n");

writeText(INVENTORY_MD, md);

console.log(`Wrote ${INVENTORY_JSON}`);
console.log(`Wrote ${INVENTORY_MD}`);
console.log(JSON.stringify(inventory.totals, null, 2));
