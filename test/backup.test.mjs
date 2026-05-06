import assert from "node:assert/strict";
import test from "node:test";
import os from "node:os";
import path from "node:path";

import { analyzeFlows, createBackupName, getPaths } from "../lib/tools/backup.mjs";

test("createBackupName validates names used as file names", () => {
  assert.equal(
    createBackupName("release_1", "2026-05-05T10:00:00.000Z"),
    "release_1"
  );
  assert.throws(
    () => createBackupName("../outside", "2026-05-05T10:00:00.000Z"),
    /Backup name/
  );
  assert.throws(
    () => createBackupName("latest", "2026-05-05T10:00:00.000Z"),
    /reserved/
  );
});

test("createBackupName generates stable timestamp-based names", () => {
  assert.equal(
    createBackupName(undefined, "2026-05-05T10:11:12.123Z"),
    "backup_20260505_101112"
  );
});

test("analyzeFlows returns checksums and basic flow stats", () => {
  const analysis = analyzeFlows([
    { id: "tab-a", type: "tab" },
    { id: "inject-a", type: "inject", z: "tab-a" },
    { id: "subflow-a", type: "subflow" },
  ]);

  assert.equal(analysis.flowsCount, 1);
  assert.equal(analysis.nodesCount, 1);
  assert.equal(analysis.checksum.length, 64);
});

test("getPaths expands backup paths under home directory", () => {
  const paths = getPaths({
    backup: { backupPath: "~/node-red-backups" },
  });

  assert.equal(
    paths.backupDir,
    path.join(os.homedir(), "node-red-backups", ".mcp-backups")
  );
});
