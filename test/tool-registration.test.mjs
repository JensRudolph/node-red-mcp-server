import assert from "node:assert/strict";
import test from "node:test";

import registerBackupTools from "../lib/tools/backup.mjs";
import registerFlowTools from "../lib/tools/flows.mjs";

function collectToolNames(register, config) {
  const names = [];
  const server = {
    tool(name) {
      names.push(name);
    },
  };

  register(server, config);
  return names;
}

test("read-only flow registration excludes mutating tools", () => {
  const names = collectToolNames(registerFlowTools, {
    readOnly: true,
    backup: { enabled: false },
  });

  assert.equal(names.includes("get-flows"), true);
  assert.equal(names.includes("get-flow"), true);
  assert.equal(names.includes("update-flows"), false);
  assert.equal(names.includes("update-flow"), false);
  assert.equal(names.includes("update-flow-full"), false);
  assert.equal(names.includes("create-flow"), false);
  assert.equal(names.includes("delete-flow"), false);
  assert.equal(names.includes("set-flows-state"), false);
});

test("writable flow registration includes direct and full update tools", () => {
  const names = collectToolNames(registerFlowTools, {
    readOnly: false,
    backup: { enabled: false },
  });

  assert.equal(names.includes("update-flow"), true);
  assert.equal(names.includes("update-flow-full"), true);
  assert.equal(names.includes("update-flows"), true);
});

test("read-only backup registration excludes restore tool", () => {
  const names = collectToolNames(registerBackupTools, {
    readOnly: true,
    backup: { enabled: true },
  });

  assert.equal(names.includes("backup-flows"), true);
  assert.equal(names.includes("get-backup-flows"), true);
  assert.equal(names.includes("restore-backup-flows"), false);
});

test("disabled backup registration exposes health only", () => {
  const names = collectToolNames(registerBackupTools, {
    readOnly: false,
    backup: { enabled: false },
  });

  assert.deepEqual(names, ["backup-health"]);
});
