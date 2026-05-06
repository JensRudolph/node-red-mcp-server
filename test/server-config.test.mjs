import assert from "node:assert/strict";
import test from "node:test";

import { normalizeConfig } from "../lib/server.mjs";

test("normalizeConfig enables automatic mutation backups by default", () => {
  const previous = process.env.MCP_AUTO_BACKUP;
  delete process.env.MCP_AUTO_BACKUP;

  try {
    const config = normalizeConfig({});
    assert.equal(config.backup.autoBeforeMutations, true);
  } finally {
    if (previous === undefined) {
      delete process.env.MCP_AUTO_BACKUP;
    } else {
      process.env.MCP_AUTO_BACKUP = previous;
    }
  }
});

test("normalizeConfig honors explicit MCP_AUTO_BACKUP=false", () => {
  const previous = process.env.MCP_AUTO_BACKUP;
  process.env.MCP_AUTO_BACKUP = "false";

  try {
    const config = normalizeConfig({});
    assert.equal(config.backup.autoBeforeMutations, false);
  } finally {
    if (previous === undefined) {
      delete process.env.MCP_AUTO_BACKUP;
    } else {
      process.env.MCP_AUTO_BACKUP = previous;
    }
  }
});
