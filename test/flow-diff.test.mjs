import assert from "node:assert/strict";
import test from "node:test";

import { createFlowDiff, formatFlowDiffSummary } from "../lib/flow-diff.mjs";

test("createFlowDiff reports added removed and modified nodes by tab", () => {
  const before = [
    { id: "tab-a", type: "tab", label: "Flow A" },
    { id: "node-a", type: "inject", z: "tab-a", name: "Before" },
    { id: "node-remove", type: "debug", z: "tab-a" },
  ];
  const after = [
    { id: "tab-a", type: "tab", label: "Flow A" },
    { id: "node-a", type: "inject", z: "tab-a", name: "After" },
    { id: "node-add", type: "debug", z: "tab-a" },
  ];

  const diff = createFlowDiff(before, after, { backupName: "backup_test" });

  assert.equal(diff.summary.added, 1);
  assert.equal(diff.summary.removed, 1);
  assert.equal(diff.summary.modified, 1);
  assert.deepEqual(diff.summary.byTab["Flow A"], {
    added: 1,
    removed: 1,
    modified: 1,
  });
  assert.equal(diff.added[0].id, "node-add");
  assert.equal(diff.removed[0].id, "node-remove");
  assert.equal(diff.modified[0].changes[0].key, "name");
});

test("formatFlowDiffSummary includes backup and summary counts", () => {
  const diff = createFlowDiff([], [{ id: "tab-a", type: "tab", label: "A" }], {
    backupName: "backup_test",
    filename: "backup_test.diff.json",
  });

  const summary = formatFlowDiffSummary(diff);

  assert.match(summary, /Backup: backup_test/);
  assert.match(summary, /Added: 1/);
  assert.match(summary, /Diff file: backup_test\.diff\.json/);
});
