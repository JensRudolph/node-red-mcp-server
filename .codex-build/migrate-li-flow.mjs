import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const workspace = process.cwd();

const OLD_TEMPLATE_TYPE = "subflow:4a6b0b8393918faa";
const V2_TEMPLATE_TYPE = "subflow:d5c060879184b636";
const REQUEST_BUILDER_TYPE = "subflow:235e206401c6aa25";
const CENTRAL_LI_LINK_IN_ID = "1fa6e568f7f9844c";
const SY_DIAG_LINK_IN_ID = "d1a6761e9b2f40c3";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    args[key.slice(2)] = value;
    i += 1;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const sourceBackupName = args["source-backup"];
const targetBackupName = args["target-backup"];
const flowLabel = args["flow-label"];
const room = args.room;

for (const [name, value] of Object.entries({ sourceBackupName, targetBackupName, flowLabel, room })) {
  if (!value) throw new Error(`Missing required argument: ${name}`);
}

const sourcePath = path.join(workspace, ".mcp-backups", `${sourceBackupName}.json`);
const targetPath = path.join(workspace, ".mcp-backups", `${targetBackupName}.json`);
const summaryPath = path.join(workspace, ".codex-build", `${targetBackupName}.summary.json`);
const payloadPath = path.join(workspace, ".codex-build", `${targetBackupName}.flow.json`);

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

function makeId(flowId, purpose) {
  return crypto.createHash("sha256").update(`${flowId}:${purpose}`).digest("hex").slice(0, 16);
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
    return JSON.parse(raw.replace(/\t/g, " ").replace(/\r?\n/g, " ").trim());
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
      flow: flowLabel,
      room,
      nodeId: node.id,
      nodeName: node.name || "",
    }),
    envString("ORIGIN", "presence_automation"),
    envString("INTENT", intent),
    envString("PRIORITY_CLASS", "presence_automation"),
    { name: "PRIORITY", type: "num", value: "50" },
    envString("SCOPE", "room"),
    envString("ROOM", room),
    envString("PROFILE", profileFromName(node.name || ""))
  );

  return env;
}

function diagnoseFilterFunc(label) {
  return `const diagnostic = msg.li_diagnostic;
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
    flow: '${label}',
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
}

function catchDiagnoseFunc(label) {
  return `const error = msg.error ?? {};
const source = error.source?.name || error.source?.id || error.source?.type || 'unbekannte Quelle';
const message = error.message || 'Unbekannter Fehler';

msg.diagnose = {
    level: 'error',
    domain: 'LI',
    flow: '${label}',
    event: 'flow_error',
    source,
    target: error.source?.id || '',
    reason: message,
    message: '${label} Fehler: ' + message + ' (' + source + ')',
    details: { error },
    node_id: error.source?.id ?? null,
    node_type: error.source?.type ?? null,
    correlation_id: msg._msgid
};
msg.payload = msg.diagnose;
return msg;`;
}

function getBackupFlows(file) {
  const backup = JSON.parse(fs.readFileSync(file, "utf8"));
  assert(Array.isArray(backup.flows), `Backup ${file} has no flows array`);
  return backup.flows;
}

const flows = clone(getBackupFlows(sourcePath));
const tab = flows.find((node) => node.type === "tab" && node.label === flowLabel);
assert(tab, `Flow '${flowLabel}' not found in ${sourceBackupName}`);

const flowId = tab.id;
const nodes = flows.filter((node) => node.z === flowId);
const byId = new Map(nodes.map((node) => [node.id, node]));
const allIds = new Set(flows.map((node) => node.id).filter(Boolean));

const ids = {
  coordLink: makeId(flowId, "li-coordination-link-out"),
  profileDiagFunction: makeId(flowId, "profile-diagnose-function"),
  profileDiagLink: makeId(flowId, "profile-diagnose-link-out"),
  catchDiagFunction: makeId(flowId, "catch-diagnose-function"),
  catchDiagLink: makeId(flowId, "catch-diagnose-link-out"),
};

for (const id of Object.values(ids)) {
  assert(!allIds.has(id), `Generated id conflict: ${id}`);
}

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

function addToGroup(groupId, nodeIds) {
  const group = requireNode(groupId);
  group.nodes = unique([...(group.nodes || []), ...nodeIds]);
}

function addReciprocalLink(linkInId, sourceIds) {
  const node = flows.find((item) => item.id === linkInId);
  assert(node, `Link-in ${linkInId} not found`);
  node.links = unique([...(node.links || []), ...sourceIds]);
  return node.links;
}

const profileSwitch = nodes.find((node) =>
  node.type === "switch" &&
  node.name === "Verteiler-In" &&
  node.rules?.some((rule) => String(rule.v || "").startsWith("Licht - Automatisierung Lichtanforderung - "))
);
assert(profileSwitch, "Profile Verteiler-In switch not found");

const profileGroupId = profileSwitch.g;
assert(profileGroupId, "Profile switch has no group id");
const profileGroup = requireNode(profileGroupId);

const coreSubflow = nodes.find((node) => node.type === OLD_TEMPLATE_TYPE);
assert(coreSubflow, `Old LI template instance ${OLD_TEMPLATE_TYPE} not found`);

const catchNode = nodes.find((node) => node.type === "catch" && node.name === "Fehlerabfrage");
assert(catchNode, "Catch node Fehlerabfrage not found");
const catchGroupId = catchNode.g;
assert(catchGroupId, "Catch node has no group id");
const debugNode = nodes.find((node) =>
  node.type === "debug" &&
  node.g === catchGroupId &&
  (catchNode.wires || []).flat().includes(node.id)
);
assert(debugNode, "Debug node wired from catch node not found");

const changes = [];

changes.push({ id: coreSubflow.id, name: coreSubflow.name || "LI core subflow", before: coreSubflow.type, after: V2_TEMPLATE_TYPE });
coreSubflow.type = V2_TEMPLATE_TYPE;

if (debugNode.active !== false) {
  changes.push({ id: debugNode.id, name: debugNode.name, before: { active: debugNode.active }, after: { active: false } });
  debugNode.active = false;
}

catchNode.wires = [[...unique([...(catchNode.wires?.[0] || []), ids.catchDiagFunction])]];

addNode({
  id: ids.catchDiagFunction,
  type: "function",
  z: flowId,
  g: catchGroupId,
  name: "Catch -> Diagnose",
  func: catchDiagnoseFunc(flowLabel),
  outputs: 1,
  timeout: 0,
  noerr: 0,
  initialize: "",
  finalize: "",
  libs: [],
  x: 350,
  y: catchNode.y,
  wires: [[ids.catchDiagLink]],
});
addNode({
  id: ids.catchDiagLink,
  type: "link out",
  z: flowId,
  g: catchGroupId,
  name: "an SY - Diagnose",
  mode: "link",
  links: [SY_DIAG_LINK_IN_ID],
  x: (debugNode.x || catchNode.x + 300) + 120,
  y: catchNode.y,
  wires: [],
});
addToGroup(catchGroupId, [ids.catchDiagFunction, ids.catchDiagLink]);
const catchGroup = requireNode(catchGroupId);
catchGroup.w = Math.max(catchGroup.w || 0, 700);

addNode({
  id: ids.coordLink,
  type: "link out",
  z: flowId,
  g: profileGroupId,
  name: "an LI - Koordination",
  mode: "link",
  links: [CENTRAL_LI_LINK_IN_ID],
  x: (profileGroup.x || 724) + Math.max(profileGroup.w || 0, 1962) - 36,
  y: 560,
  wires: [],
});
addNode({
  id: ids.profileDiagFunction,
  type: "function",
  z: flowId,
  g: profileGroupId,
  name: "Diagnosefilter Request Builder",
  func: diagnoseFilterFunc(flowLabel),
  outputs: 1,
  timeout: 0,
  noerr: 0,
  initialize: "",
  finalize: "",
  libs: [],
  x: (profileGroup.x || 724) + Math.max(profileGroup.w || 0, 1962) - 336,
  y: 620,
  wires: [[ids.profileDiagLink]],
});
addNode({
  id: ids.profileDiagLink,
  type: "link out",
  z: flowId,
  g: profileGroupId,
  name: "an SY - Diagnose",
  mode: "link",
  links: [SY_DIAG_LINK_IN_ID],
  x: (profileGroup.x || 724) + Math.max(profileGroup.w || 0, 1962) - 36,
  y: 620,
  wires: [],
});
addToGroup(profileGroupId, [ids.coordLink, ids.profileDiagFunction, ids.profileDiagLink]);
profileGroup.w = Math.max(profileGroup.w || 0, 2152);
profileGroup.h = Math.max(profileGroup.h || 0, 607);

if (!profileSwitch.rules?.some((rule) => rule.v === "LI - Koordination Request")) {
  profileSwitch.rules.push({ t: "eq", v: "LI - Koordination Request", vt: "str" });
  profileSwitch.wires.push([ids.coordLink]);
  profileSwitch.outputs = profileSwitch.wires.length;
  changes.push({ id: profileSwitch.id, name: profileSwitch.name, after: "LI - Koordination Request Ausgang ergänzt" });
}

const profileServiceNodes = nodes
  .filter((node) => node.g === profileGroupId && node.type === "api-call-service")
  .filter((node) => String(node.name || "").startsWith("Licht - Automatisierung Lichtanforderung - "));

for (const node of profileServiceNodes) {
  const originalWires = clone(node.wires || [[]]);
  const passthroughTargets = unique([...(originalWires[0] || []), ids.profileDiagFunction]);
  const replacement = {
    id: node.id,
    type: REQUEST_BUILDER_TYPE,
    z: flowId,
    g: profileGroupId,
    name: node.name,
    env: buildRequestBuilderEnv(node),
    x: node.x,
    y: node.y,
    wires: [[ids.coordLink], passthroughTargets],
  };
  if (node.d !== undefined) replacement.d = node.d;

  Object.keys(node).forEach((key) => delete node[key]);
  Object.assign(node, replacement);
}
changes.push({ name: "Request Builder", after: `${profileServiceNodes.length} Profil-Service-Nodes auf ${REQUEST_BUILDER_TYPE} umgestellt` });

const coordinationIncomingLinks = addReciprocalLink(CENTRAL_LI_LINK_IN_ID, [ids.coordLink]);
const diagnoseIncomingLinks = addReciprocalLink(SY_DIAG_LINK_IN_ID, [ids.profileDiagLink, ids.catchDiagLink]);
changes.push({ id: CENTRAL_LI_LINK_IN_ID, name: "LI - Koordination Eingang", after: `Ruecklink ${ids.coordLink} ergänzt` });
changes.push({ id: SY_DIAG_LINK_IN_ID, name: "Diagnose Eingang", after: `Ruecklinks ${ids.profileDiagLink}, ${ids.catchDiagLink} ergänzt` });

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
    reason: `Migration ${flowLabel} auf zentrale LI-Koordination`,
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
  flowId,
  flowLabel,
  room,
  profileGroupId,
  profileSwitchId: profileSwitch.id,
  catchGroupId,
  migratedProfileNodes: profileServiceNodes.length,
  requestBuilderType: REQUEST_BUILDER_TYPE,
  coreSubflowType: coreSubflow.type,
  addedNodeIds: Object.values(ids),
  remainingProfileApiCallServiceNodes: nodes.filter((node) => node.g === profileGroupId && node.type === "api-call-service").length,
  validationHints: {
    profileSwitchOutputs: profileSwitch.outputs,
    profileSwitchHasCoordinationRequest: profileSwitch.rules.some((rule) => rule.v === "LI - Koordination Request"),
    debugActive: debugNode.active,
    catchWires: catchNode.wires,
    coordLinkTargets: requireNode(ids.coordLink).links,
    profileDiagnoseLinkTargets: requireNode(ids.profileDiagLink).links,
    catchDiagnoseLinkTargets: requireNode(ids.catchDiagLink).links,
    coordinationIncomingLinks,
    diagnoseIncomingLinks,
  },
  changes,
};

fs.writeFileSync(targetPath, `${JSON.stringify(migratedBackup, null, 2)}\n`, "utf8");
fs.writeFileSync(summaryPath, `${JSON.stringify(resultSummary, null, 2)}\n`, "utf8");
fs.writeFileSync(payloadPath, `${JSON.stringify(directFlowPayload)}\n`, "utf8");

console.log(JSON.stringify(resultSummary, null, 2));
