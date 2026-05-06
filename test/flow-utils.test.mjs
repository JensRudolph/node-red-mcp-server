import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDirectFlowUpdatePayload,
  replaceFlowInCompleteFlows,
} from "../lib/flow-utils.mjs";

test("buildDirectFlowUpdatePayload normalizes single-flow updates", () => {
  const payload = buildDirectFlowUpdatePayload("tab-a", {
    label: "Kueche",
    nodes: [{ id: "inject-a", type: "inject" }],
  });

  assert.deepEqual(payload, {
    id: "tab-a",
    label: "Kueche",
    nodes: [{ id: "inject-a", type: "inject", z: "tab-a" }],
    configs: [],
  });
});

test("buildDirectFlowUpdatePayload rejects members from other flows", () => {
  assert.throws(
    () =>
      buildDirectFlowUpdatePayload("tab-a", {
        nodes: [{ id: "inject-b", type: "inject", z: "tab-b" }],
        configs: [],
      }),
    /belongs to flow/
  );

  assert.throws(
    () =>
      buildDirectFlowUpdatePayload("tab-a", {
        nodes: [],
        configs: [{ id: "cfg-b", type: "mqtt-broker", z: "tab-b" }],
      }),
    /belongs to flow/
  );
});

test("replaceFlowInCompleteFlows keeps tab order and replaces flow members", () => {
  const flows = [
    { id: "tab-a", type: "tab", label: "A" },
    { id: "tab-b", type: "tab", label: "B" },
    { id: "old-a", type: "inject", z: "tab-a" },
    { id: "keep-b", type: "debug", z: "tab-b" },
  ];

  const result = replaceFlowInCompleteFlows(flows, "tab-a", {
    id: "tab-a",
    label: "A updated",
    nodes: [{ id: "new-a", type: "inject" }],
    configs: [{ id: "cfg-a", type: "mqtt-broker" }],
  });

  assert.deepEqual(
    result.filter((node) => node.type === "tab").map((node) => node.id),
    ["tab-a", "tab-b"]
  );
  assert.equal(result.find((node) => node.id === "tab-a").label, "A updated");
  assert.equal(result.some((node) => node.id === "old-a"), false);
  assert.equal(result.find((node) => node.id === "new-a").z, "tab-a");
  assert.equal(result.some((node) => node.id === "keep-b"), true);
});

test("replaceFlowInCompleteFlows rejects payload id mismatches", () => {
  assert.throws(
    () =>
      replaceFlowInCompleteFlows(
        [{ id: "tab-a", type: "tab", label: "A" }],
        "tab-a",
        { id: "tab-b", nodes: [], configs: [] }
      ),
    /Flow id mismatch/
  );
});

test("replaceFlowInCompleteFlows rejects duplicate ids outside the replaced flow", () => {
  assert.throws(
    () =>
      replaceFlowInCompleteFlows(
        [
          { id: "tab-a", type: "tab", label: "A" },
          { id: "tab-b", type: "tab", label: "B" },
          { id: "keep-b", type: "debug", z: "tab-b" },
        ],
        "tab-a",
        {
          id: "tab-a",
          nodes: [{ id: "keep-b", type: "inject" }],
          configs: [],
        }
      ),
    /Duplicate node id/
  );
});
