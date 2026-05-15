import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const workspace = process.cwd();
const sourceBackupName = "before_li_33_hausflur_migration_20260515";
const targetBackupName = "li_33_hausflur_migrated_links_20260515";
const sourcePath = path.join(workspace, ".mcp-backups", `${sourceBackupName}.json`);
const targetPath = path.join(workspace, ".mcp-backups", `${targetBackupName}.json`);
const summaryPath = path.join(workspace, ".codex-build", `${targetBackupName}.summary.json`);
const payloadPath = path.join(workspace, ".codex-build", `${targetBackupName}.flow.json`);

const FLOW_ID = "58887373f03f37b5";
const FLOW_LABEL = "LI - 33 Hausflur";
const ROOM = "hausflur";

const OLD_CORE_SUBFLOW_ID = "12e4c2d2587a25a0";
const V2_CORE_SUBFLOW_TYPE = "subflow:d5c060879184b636";
const REQUEST_BUILDER_TYPE = "subflow:235e206401c6aa25";
const CENTRAL_LI_LINK_IN_ID = "1fa6e568f7f9844c";
const SY_DIAG_LINK_IN_ID = "d1a6761e9b2f40c3";

const PROFILE_GROUP_ID = "43e7667c70516c6c";
const PROFILE_SWITCH_ID = "44c4fb7eda15d7bd";
const CATCH_GROUP_ID = "20b9ed3883fb139d";
const CATCH_NODE_ID = "7087187c97496147";
const DEBUG_NODE_ID = "59f19887fc537713";

const COORD_LINK_ID = "b3d77cf79e4a0101";
const PROFILE_DIAG_FUNCTION_ID = "a0fdc4d445dc2b21";
const PROFILE_DIAG_LINK_ID = "b25b1ec2e0cfd62e";
const CATCH_DIAG_FUNCTION_ID = "df27d0e0837958ac";
const CATCH_DIAG_LINK_ID = "c7256d10b1de27f4";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function analyzeFlows(flows) {
  const serialized = JSON.stringify(flows);
  return {
    checksum: crypto.createHash("sha256").update(serialized).digest("hex"),
    flowsCount: flows.filter((node) => node.type === "tab").length,
    nodesCount: flows.filter((node) => node.type && node.type !== "tab" && node.type !== "subflow").length,
    size: serialized.length,
  };
}

function envString(name, value) {
  return { name, value: String(value ?? ""), type: "str" };
}

function envJson(name, value) {
  return { name, value: JSON.stringify(value), type: "json" };
}

function profileFromName(name) {
  if (name.includes("Sehr hell")) return "sehr_hell";
  if (name.includes("Hell")) return "hell";
  if (name.includes("Normal")) return "normal";
  if (name.includes("Sehr dunkel")) return "sehr_dunkel";
  if (name.includes("Dunkel")) return "dunkel";
  if (name.includes("Abendlicht")) return "abendlicht";
  if (name.includes("Nachtlicht")) return "nachtlicht";
  if (name.includes("Aus")) return "aus";
  return "";
}

function parseLiteralData(node) {
  const raw = String(node.data || "").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const normalized = raw.replace(/\t/g, " ").replace(/\r?\n/g, " ").trim();
    return JSON.parse(normalized);
  }
}

function buildRequestBuilderEnv(node) {
  const action = node.action || [node.domain, node.service].filter(Boolean).join(".");
  const intent = action === "light.turn_off" ? "turn_off" : action === "light.toggle" ? "toggle" : "turn_on";
  const env = [
    envJson("ENTITY_TEMPLATES", node.entityId || []),
    envString("ACTION", action),
    envString("DOMAIN", node.domain || "light"),
    envString("SERVICE", node.service || action.split(".")[1] || ""),
  ];

  if (node.service !== "turn_off") {
    env.push(envJson("DATA_SPEC", { mode: "literal", value: parseLiteralData(node) }));
  }

  env.push(
    envJson("SOURCE", {
      flow: FLOW_LABEL,
      room: ROOM,
      nodeId: node.id,
      nodeName: node.name || "",
    }),
    envString("ORIGIN", "presence_automation"),
    envString("INTENT", intent),
    envString("PRIORITY_CLASS", "presence_automation"),
    { name: "PRIORITY", type: "num", value: "50" },
    envString("SCOPE", "room"),
    envString("ROOM", ROOM),
    envString("PROFILE", profileFromName(node.name || ""))
  );

  return env;
}

const diagnoseFilterFunc = `const diagnostic = msg.li_diagnostic;
if (!diagnostic) {
    return null;
}

function level(status) {
    if (status === 'deduplicated') return 'debug';
    if (status === 'rejected_lower_priority') return 'info';
    if (status === 'rejected_invalid' || status === 'rejected') return 'warning';
    return 'info';
}

const source = diagnostic.source || {};
const status = diagnostic.status || 'rejected_invalid';
const sourceText = source.nodeName || source.path || msg.path || 'LI - Request Builder';
const target = diagnostic.action || diagnostic.target || diagnostic.request?.room || '-';
const reason = diagnostic.reason || status;

msg.diagnose = {
    level: level(status),
    domain: 'LI',
    flow: '${FLOW_LABEL}',
    event: 'request_builder_' + status,
    source: sourceText,
    target,
    reason,
    message: status + ': ' + reason,
    details: { diagnostic, path: msg.path },
    correlation_id: msg._msgid
};
msg.payload = msg.diagnose;
return msg;`;

const catchDiagnoseFunc = `const error = msg.error ?? {};
const source = error.source?.name || error.source?.id || error.source?.type || 'unbekannte Quelle';
const message = error.message || 'Unbekannter Fehler';

msg.diagnose = {
    level: 'error',
    domain: 'LI',
    flow: '${FLOW_LABEL}',
    event: 'flow_error',
    source,
    target: error.source?.id || '',
    reason: message,
    message: '${FLOW_LABEL} Fehler: ' + message + ' (' + source + ')',
    details: { error },
    node_id: error.source?.id ?? null,
    node_type: error.source?.type ?? null,
    correlation_id: msg._msgid
};
msg.payload = msg.diagnose;
return msg;`;

const sourceBackup = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const flows = clone(sourceBackup.flows);
const allIds = new Set(flows.map((node) => node.id).filter(Boolean));
for (const id of [
  COORD_LINK_ID,
  PROFILE_DIAG_FUNCTION_ID,
  PROFILE_DIAG_LINK_ID,
  CATCH_DIAG_FUNCTION_ID,
  CATCH_DIAG_LINK_ID,
]) {
  assert(!allIds.has(id), `Generated id conflict: ${id}`);
}

const tab = flows.find((node) => node.id === FLOW_ID && node.type === "tab");
assert(tab, `Flow tab ${FLOW_ID} not found`);
assert(tab.label === FLOW_LABEL, `Unexpected flow label: ${tab.label}`);

const nodes = flows.filter((node) => node.z === FLOW_ID);
const byId = new Map(nodes.map((node) => [node.id, node]));

function requireNode(id) {
  const node = byId.get(id);
  assert(node, `Node ${id} not found`);
  return node;
}

function addNode(node) {
  flows.push(node);
  nodes.push(node);
  byId.set(node.id, node);
}

function addToGroup(groupId, ids) {
  const group = requireNode(groupId);
  group.nodes = unique([...(group.nodes || []), ...ids]);
}

function addReciprocalLink(linkInId, sourceIds) {
  const node = flows.find((item) => item.id === linkInId);
  assert(node, `Link-in ${linkInId} not found`);
  node.links = unique([...(node.links || []), ...sourceIds]);
  return node.links;
}

const changes = [];

const coreSubflow = requireNode(OLD_CORE_SUBFLOW_ID);
if (coreSubflow.type !== V2_CORE_SUBFLOW_TYPE) {
  changes.push({ id: coreSubflow.id, name: coreSubflow.name || "LI core subflow", before: coreSubflow.type, after: V2_CORE_SUBFLOW_TYPE });
  coreSubflow.type = V2_CORE_SUBFLOW_TYPE;
}

const debugNode = requireNode(DEBUG_NODE_ID);
if (debugNode.active !== false) {
  changes.push({ id: debugNode.id, name: debugNode.name, before: { active: debugNode.active }, after: { active: false } });
  debugNode.active = false;
}

const catchNode = requireNode(CATCH_NODE_ID);
catchNode.wires = [[...unique([...(catchNode.wires?.[0] || []), CATCH_DIAG_FUNCTION_ID])]];

addNode({
  id: CATCH_DIAG_FUNCTION_ID,
  type: "function",
  z: FLOW_ID,
  g: CATCH_GROUP_ID,
  name: "Catch -> Diagnose",
  func: catchDiagnoseFunc,
  outputs: 1,
  timeout: 0,
  noerr: 0,
  initialize: "",
  finalize: "",
  libs: [],
  x: 350,
  y: 1460,
  wires: [[CATCH_DIAG_LINK_ID]],
});
addNode({
  id: CATCH_DIAG_LINK_ID,
  type: "link out",
  z: FLOW_ID,
  g: CATCH_GROUP_ID,
  name: "an SY - Diagnose",
  mode: "link",
  links: [SY_DIAG_LINK_IN_ID],
  x: 565,
  y: 1460,
  wires: [],
});
addToGroup(CATCH_GROUP_ID, [CATCH_DIAG_FUNCTION_ID, CATCH_DIAG_LINK_ID]);
changes.push({ id: CATCH_GROUP_ID, name: "Catch Diagnose", after: "Catch -> SY - Diagnose ergänzt" });

addNode({
  id: COORD_LINK_ID,
  type: "link out",
  z: FLOW_ID,
  g: PROFILE_GROUP_ID,
  name: "an LI - Koordination",
  mode: "link",
  links: [CENTRAL_LI_LINK_IN_ID],
  x: 2650,
  y: 560,
  wires: [],
});
addNode({
  id: PROFILE_DIAG_FUNCTION_ID,
  type: "function",
  z: FLOW_ID,
  g: PROFILE_GROUP_ID,
  name: "Diagnosefilter Request Builder",
  func: diagnoseFilterFunc,
  outputs: 1,
  timeout: 0,
  noerr: 0,
  initialize: "",
  finalize: "",
  libs: [],
  x: 2350,
  y: 620,
  wires: [[PROFILE_DIAG_LINK_ID]],
});
addNode({
  id: PROFILE_DIAG_LINK_ID,
  type: "link out",
  z: FLOW_ID,
  g: PROFILE_GROUP_ID,
  name: "an SY - Diagnose",
  mode: "link",
  links: [SY_DIAG_LINK_IN_ID],
  x: 2650,
  y: 620,
  wires: [],
});
addToGroup(PROFILE_GROUP_ID, [COORD_LINK_ID, PROFILE_DIAG_FUNCTION_ID, PROFILE_DIAG_LINK_ID]);

const profileGroup = requireNode(PROFILE_GROUP_ID);
profileGroup.w = Math.max(profileGroup.w || 0, 2152);
profileGroup.h = Math.max(profileGroup.h || 0, 607);

const profileSwitch = requireNode(PROFILE_SWITCH_ID);
if (!profileSwitch.rules?.some((rule) => rule.v === "LI - Koordination Request")) {
  profileSwitch.rules.push({ t: "eq", v: "LI - Koordination Request", vt: "str" });
  profileSwitch.wires.push([COORD_LINK_ID]);
  profileSwitch.outputs = profileSwitch.wires.length;
  changes.push({ id: profileSwitch.id, name: profileSwitch.name, after: "LI - Koordination Request Ausgang ergänzt" });
}

const profileServiceNodes = nodes
  .filter((node) => node.g === PROFILE_GROUP_ID && node.type === "api-call-service")
  .filter((node) => String(node.name || "").startsWith("Licht - Automatisierung Lichtanforderung - "));

for (const node of profileServiceNodes) {
  const originalWires = clone(node.wires || [[]]);
  const passthroughTargets = unique([...(originalWires[0] || []), PROFILE_DIAG_FUNCTION_ID]);
  const replacement = {
    id: node.id,
    type: REQUEST_BUILDER_TYPE,
    z: FLOW_ID,
    g: PROFILE_GROUP_ID,
    name: node.name,
    env: buildRequestBuilderEnv(node),
    x: node.x,
    y: node.y,
    wires: [[COORD_LINK_ID], passthroughTargets],
  };
  if (node.d !== undefined) replacement.d = node.d;

  Object.keys(node).forEach((key) => delete node[key]);
  Object.assign(node, replacement);
}
changes.push({ name: "Request Builder", after: `${profileServiceNodes.length} Profil-Service-Nodes auf ${REQUEST_BUILDER_TYPE} umgestellt` });

const coordinationIncomingLinks = addReciprocalLink(CENTRAL_LI_LINK_IN_ID, [COORD_LINK_ID]);
const diagnoseIncomingLinks = addReciprocalLink(SY_DIAG_LINK_IN_ID, [PROFILE_DIAG_LINK_ID, CATCH_DIAG_LINK_ID]);
changes.push({
  id: CENTRAL_LI_LINK_IN_ID,
  name: "LI - Koordination Eingang",
  after: `Ruecklink ${COORD_LINK_ID} ergänzt`,
});
changes.push({
  id: SY_DIAG_LINK_IN_ID,
  name: "Diagnose Eingang",
  after: `Ruecklinks ${PROFILE_DIAG_LINK_ID}, ${CATCH_DIAG_LINK_ID} ergänzt`,
});

const directFlowPayload = {
  id: tab.id,
  label: tab.label,
  disabled: tab.disabled,
  info: tab.info,
  env: tab.env || [],
  nodes: nodes.map(clone),
  configs: [],
};

const analysis = analyzeFlows(flows);
const migratedBackup = {
  metadata: {
    name: targetBackupName,
    timestamp: new Date().toISOString(),
    reason: "Migration LI - 33 Hausflur auf zentrale LI-Koordination",
    checksum: analysis.checksum,
    flowsCount: analysis.flowsCount,
    nodesCount: analysis.nodesCount,
    size: analysis.size,
  },
  flows,
};

const resultSummary = {
  sourceBackupName,
  targetBackupName,
  targetPath,
  payloadPath,
  flowId: FLOW_ID,
  flowLabel: FLOW_LABEL,
  migratedProfileNodes: profileServiceNodes.length,
  requestBuilderType: REQUEST_BUILDER_TYPE,
  coreSubflowType: coreSubflow.type,
  addedNodeIds: [
    COORD_LINK_ID,
    PROFILE_DIAG_FUNCTION_ID,
    PROFILE_DIAG_LINK_ID,
    CATCH_DIAG_FUNCTION_ID,
    CATCH_DIAG_LINK_ID,
  ],
  remainingProfileApiCallServiceNodes: nodes.filter((node) => node.g === PROFILE_GROUP_ID && node.type === "api-call-service").length,
  validationHints: {
    profileSwitchOutputs: profileSwitch.outputs,
    profileSwitchHasCoordinationRequest: profileSwitch.rules.some((rule) => rule.v === "LI - Koordination Request"),
    debugActive: debugNode.active,
    catchWires: catchNode.wires,
    coordLinkTargets: requireNode(COORD_LINK_ID).links,
    profileDiagnoseLinkTargets: requireNode(PROFILE_DIAG_LINK_ID).links,
    catchDiagnoseLinkTargets: requireNode(CATCH_DIAG_LINK_ID).links,
    coordinationIncomingLinks,
    diagnoseIncomingLinks,
  },
  changes,
};

fs.writeFileSync(targetPath, `${JSON.stringify(migratedBackup, null, 2)}\n`, "utf8");
fs.writeFileSync(summaryPath, `${JSON.stringify(resultSummary, null, 2)}\n`, "utf8");
fs.writeFileSync(payloadPath, `${JSON.stringify(directFlowPayload)}\n`, "utf8");

console.log(JSON.stringify(resultSummary, null, 2));
