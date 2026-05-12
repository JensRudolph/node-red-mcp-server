import assert from "node:assert/strict";
import test from "node:test";

import {
  auditEntitiesInFlow,
  cloneFlowConfig,
  evaluateMutationConfirmation,
  extractConfigRefCatalogFromNodeHtml,
  filterNodes,
  limitedList,
  searchNodeFields,
  selectFlows,
  validateFlowPayload,
} from "../lib/flow-analysis.mjs";

test("validateFlowPayload reports structural flow problems", () => {
  const result = validateFlowPayload({
    id: "tab-a",
    nodes: [
      { id: "node-a", type: "inject", z: "tab-a", wires: [["missing"]] },
      { id: "node-a", type: "debug", z: "tab-b" },
      { id: "group-a", type: "group", z: "tab-a", nodes: ["missing"] },
      { id: "node-b", type: "debug", z: "tab-a", g: "missing-group" },
    ],
    configs: [],
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.some((item) => item.code === "duplicate_id"), true);
  assert.equal(result.errors.some((item) => item.code === "missing_wire_target"), true);
  assert.equal(result.errors.some((item) => item.code === "wrong_z"), true);
  assert.equal(result.errors.some((item) => item.code === "missing_group_member"), true);
  assert.equal(result.errors.some((item) => item.code === "missing_group"), true);
});

test("validateFlowPayload accepts cross-tab link targets when they are known externally", () => {
  const result = validateFlowPayload(
    {
      id: "tab-a",
      nodes: [
        {
          id: "link-out-a",
          type: "link out",
          z: "tab-a",
          links: ["link-in-b"],
          wires: [],
        },
      ],
      configs: [],
    },
    {
      knownExternalLinkIds: new Set(["link-in-b"]),
    }
  );

  assert.equal(result.valid, true);
  assert.equal(result.errors.some((item) => item.code === "missing_link_target"), false);
});

test("validateFlowPayload still rejects unknown cross-tab link targets", () => {
  const result = validateFlowPayload({
    id: "tab-a",
    nodes: [
      {
        id: "link-out-a",
        type: "link out",
        z: "tab-a",
        links: ["missing-link"],
        wires: [],
      },
    ],
    configs: [],
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.some((item) => item.code === "missing_link_target"), true);
});

test("validateFlowPayload uses node metadata config-reference catalog when available", () => {
  const result = validateFlowPayload(
    [
      { id: "tab-a", type: "tab", label: "Flow A" },
      { id: "mqtt-a", type: "mqtt in", z: "tab-a", broker: "missing-broker" },
    ],
    {
      configRefCatalog: {
        "mqtt in": {
          broker: "mqtt-broker",
        },
      },
    }
  );

  assert.equal(result.valid, true);
  assert.equal(result.warnings.some((item) => item.source === "node_metadata"), true);
  assert.equal(result.warnings[0].expectedType, "mqtt-broker");
});

test("extractConfigRefCatalogFromNodeHtml extracts defaults with registered config node refs", () => {
  const html = `
<script>
RED.nodes.registerType('mqtt-broker', {
  category: 'config',
  defaults: {
    name: { value: '' }
  }
});
RED.nodes.registerType('mqtt in', {
  defaults: {
    name: { value: '' },
    broker: { type: 'mqtt-broker', required: true },
    topic: { value: '' },
    count: { type: 'num', value: 0 }
  }
});
</script>`;

  assert.deepEqual(extractConfigRefCatalogFromNodeHtml(html), {
    "mqtt in": {
      broker: "mqtt-broker",
    },
  });
});

test("evaluateMutationConfirmation requires token above threshold", () => {
  const first = evaluateMutationConfirmation({
    operation: "replace-in-flow",
    scope: "tab-a",
    affectedCount: 51,
    threshold: 50,
  });

  assert.equal(first.required, true);
  assert.equal(first.confirmed, false);

  const second = evaluateMutationConfirmation({
    operation: "replace-in-flow",
    scope: "tab-a",
    affectedCount: 51,
    threshold: 50,
    confirmToken: first.confirmToken,
  });

  assert.equal(second.required, true);
  assert.equal(second.confirmed, true);
});

test("limitedList reports truncation without returning every item", () => {
  const result = limitedList([1, 2, 3], { limit: 2 });

  assert.deepEqual(result, {
    total: 3,
    returned: 2,
    truncated: true,
    items: [1, 2],
  });
});

test("cloneFlowConfig remaps IDs, links, wires, groups and clears matching entities", () => {
  const source = {
    id: "tab-source",
    label: "LI - Ankleidezimmer",
    nodes: [
      {
        id: "trigger-a",
        type: "server-state-changed",
        z: "tab-source",
        name: "Ankleidezimmer trigger",
        entityid: "binary_sensor.ankleide_motion",
        wires: [["service-a"]],
      },
      {
        id: "service-a",
        type: "api-call-service",
        z: "tab-source",
        g: "group-a",
        service: "light.turn_on",
        entityId: "light.ankleide_decke",
        links: ["link-a"],
        wires: [],
      },
      {
        id: "link-a",
        type: "link in",
        z: "tab-source",
        links: ["service-a"],
        wires: [],
      },
      {
        id: "group-a",
        type: "group",
        z: "tab-source",
        nodes: ["service-a"],
      },
    ],
    configs: [{ id: "server-a", type: "server", z: "tab-source" }],
  };

  const clone = cloneFlowConfig(source, {
    existingIds: ["tab-source", "trigger-a", "service-a", "link-a", "group-a"],
    newLabel: "LI - Esszimmer",
    replacements: {
      Ankleidezimmer: "Esszimmer",
      ankleide: "esszimmer",
    },
    clearEntityPatterns: ["^light\\."],
    clearEntityReplacement: "",
  });

  assert.equal(clone.validation.valid, true);
  assert.notEqual(clone.flow.id, source.id);
  assert.equal(clone.flow.label, "LI - Esszimmer");

  const clonedTrigger = clone.flow.nodes.find((node) => node.type === "server-state-changed");
  const clonedService = clone.flow.nodes.find((node) => node.type === "api-call-service");
  const clonedLink = clone.flow.nodes.find((node) => node.type === "link in");
  const clonedGroup = clone.flow.nodes.find((node) => node.type === "group");

  assert.equal(clonedTrigger.z, clone.flow.id);
  assert.equal(clonedTrigger.name, "Esszimmer trigger");
  assert.equal(clonedTrigger.entityid, "binary_sensor.esszimmer_motion");
  assert.deepEqual(clonedTrigger.wires, [[clonedService.id]]);
  assert.deepEqual(clonedService.links, [clonedLink.id]);
  assert.deepEqual(clonedLink.links, [clonedService.id]);
  assert.equal(clonedService.g, clonedGroup.id);
  assert.deepEqual(clonedGroup.nodes, [clonedService.id]);
  assert.equal(clonedService.service, "light.turn_on");
  assert.equal(clonedService.entityId, "");
});

test("auditEntitiesInFlow categorizes HA entities without treating services as entities", () => {
  const audit = auditEntitiesInFlow({
    id: "tab-a",
    nodes: [
      {
        id: "trigger-a",
        type: "server-state-changed",
        z: "tab-a",
        entityid: "binary_sensor.room_motion",
      },
      {
        id: "service-a",
        type: "api-call-service",
        z: "tab-a",
        service: "light.turn_on",
        entityId: "light.room_main",
      },
    ],
    configs: [],
  });

  assert.deepEqual(
    audit.entities.map((entry) => entry.entityId).sort(),
    ["binary_sensor.room_motion", "light.room_main"]
  );
  assert.equal(audit.summary.byCategory.trigger, 1);
  assert.equal(audit.summary.byCategory.service_target, 1);
  assert.equal(audit.summary.byCategory.concrete_light, 1);
});

test("filterNodes and searchNodeFields return scoped structured matches", () => {
  const flows = [
    { id: "tab-a", type: "tab", label: "Flow A" },
    { id: "tab-b", type: "tab", label: "Flow B" },
    { id: "node-a", type: "inject", z: "tab-a", name: "Kitchen inject" },
    { id: "node-b", type: "debug", z: "tab-b", name: "Other" },
  ];

  const nodes = filterNodes(flows, { flowLabel: "Flow A", nodeType: "inject" });
  const matches = searchNodeFields(nodes, { query: "Kitchen", property: "name" });

  assert.deepEqual(nodes.map((node) => node.id), ["node-a"]);
  assert.deepEqual(matches, [
    {
      id: "node-a",
      type: "inject",
      name: "Kitchen inject",
      field: "name",
      value: "Kitchen inject",
    },
  ]);
});

test("selectFlows preserves full output by default and supports selective pagination", () => {
  const flows = [
    { id: "tab-a", type: "tab", label: "Flow A" },
    { id: "node-a", type: "inject", z: "tab-a" },
    { id: "node-b", type: "debug", z: "tab-a" },
  ];

  assert.equal(Array.isArray(selectFlows(flows)), true);

  const selected = selectFlows(flows, {
    flowId: "tab-a",
    includeTabs: false,
    limit: 1,
  });

  assert.equal(selected.summary.returned, 1);
  assert.deepEqual(selected.flows.map((node) => node.id), ["node-a"]);
});
