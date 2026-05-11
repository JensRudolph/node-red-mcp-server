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

test("normalizeConfig disables full-flow writes by default", () => {
  const previous = process.env.MCP_ALLOW_FULL_FLOW_WRITES;
  delete process.env.MCP_ALLOW_FULL_FLOW_WRITES;

  try {
    const config = normalizeConfig({});
    assert.equal(config.allowFullFlowWrites, false);
  } finally {
    if (previous === undefined) {
      delete process.env.MCP_ALLOW_FULL_FLOW_WRITES;
    } else {
      process.env.MCP_ALLOW_FULL_FLOW_WRITES = previous;
    }
  }
});

test("normalizeConfig parses safety limits from environment", () => {
  const previousAllow = process.env.MCP_ALLOW_FULL_FLOW_WRITES;
  const previousThreshold = process.env.MCP_MUTATION_CONFIRM_THRESHOLD;
  const previousMax = process.env.MCP_MAX_RESPONSE_ITEMS;
  process.env.MCP_ALLOW_FULL_FLOW_WRITES = "true";
  process.env.MCP_MUTATION_CONFIRM_THRESHOLD = "12";
  process.env.MCP_MAX_RESPONSE_ITEMS = "34";

  try {
    const config = normalizeConfig({});
    assert.equal(config.allowFullFlowWrites, true);
    assert.equal(config.mutationConfirmationThreshold, 12);
    assert.equal(config.maxResponseItems, 34);
  } finally {
    if (previousAllow === undefined) {
      delete process.env.MCP_ALLOW_FULL_FLOW_WRITES;
    } else {
      process.env.MCP_ALLOW_FULL_FLOW_WRITES = previousAllow;
    }
    if (previousThreshold === undefined) {
      delete process.env.MCP_MUTATION_CONFIRM_THRESHOLD;
    } else {
      process.env.MCP_MUTATION_CONFIRM_THRESHOLD = previousThreshold;
    }
    if (previousMax === undefined) {
      delete process.env.MCP_MAX_RESPONSE_ITEMS;
    } else {
      process.env.MCP_MAX_RESPONSE_ITEMS = previousMax;
    }
  }
});
