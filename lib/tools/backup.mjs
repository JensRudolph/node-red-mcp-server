/**
 * MCP tools for Node-RED flow backups and restore.
 * Uses the Node-RED Admin API for local and remote Node-RED instances.
 */

import { z } from "zod";
import {
  callNodeRed,
  getFlowsWithRevision,
  jsonResponse,
  postFlowsWithRevision,
  runTool,
  textResponse,
} from "../utils.mjs";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import os from "os";
import vm from "vm";
import { createFlowDiff, formatFlowDiffSummary } from "../flow-diff.mjs";
import {
  deleteValueAtPath,
  evaluateMutationConfirmation,
  filterNodes,
  getValueAtPath,
  limitedList,
  selectFlows,
  setValueAtPath,
  shapeNodeForResponse,
  shapeNodesForResponse,
  shapeValueForResponse,
} from "../flow-analysis.mjs";

const DEFAULTS = {
  maxBackups: 10,
  autoCleanup: true,
  backupDir: ".mcp-backups",
  metadataFile: "backup_metadata.json",
};

const responseShapeArgs = {
  includeFullValues: z
    .boolean()
    .optional()
    .describe("Return complete string values instead of truncating long fields"),
  maxStringLength: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Maximum string length in the response; defaults to MCP_MAX_STRING_LENGTH"),
};

const nodeProjectionArgs = {
  ...responseShapeArgs,
  fields: z
    .array(z.string())
    .optional()
    .describe("Only include these node fields/paths plus id/type/name/label/z/g"),
  omitFields: z
    .array(z.string())
    .optional()
    .describe("Omit these node fields/paths from the response"),
};

const deriveBackupOperationSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("patch_node"),
    nodeId: z.string().describe("Node id to patch"),
    patches: z
      .record(z.any())
      .describe("Field/path values to set on the node"),
  }),
  z.object({
    op: z.literal("replace_node_field"),
    nodeId: z.string().describe("Node id to edit"),
    field: z.string().describe("Field/path containing a string"),
    search: z.string().describe("Literal string or regex pattern to replace"),
    replacement: z.string().optional().describe("Replacement string"),
    regex: z.boolean().optional().describe("Treat search as a regex pattern"),
    flags: z.string().optional().describe("Regex flags; defaults to g"),
  }),
  z.object({
    op: z.literal("delete_node_field"),
    nodeId: z.string().describe("Node id to edit"),
    field: z.string().describe("Field/path to delete"),
  }),
]);

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function responseShapeOptions(args = {}, config = {}) {
  return {
    ...args,
    defaultMaxStringLength: config.maxStringLength,
  };
}

function shapeFlowSelectionForResponse(selection, args, config) {
  const options = responseShapeOptions(args, config);
  if (Array.isArray(selection)) {
    return shapeNodesForResponse(selection, options);
  }

  return {
    ...selection,
    flows: shapeNodesForResponse(selection.flows, options),
  };
}

function tabLabelsById(flows) {
  return new Map(
    flows
      .filter((node) => node?.type === "tab")
      .map((tab) => [tab.id, tab.label || tab.name || ""])
  );
}

function nodeMetadata(node, flows, source = {}) {
  const labels = tabLabelsById(flows);
  return {
    ...source,
    id: node.id,
    type: node.type || "",
    name: node.name || node.label || "",
    flowId: node.z || null,
    flowLabel: node.z ? labels.get(node.z) || null : null,
  };
}

function findNodeBySelection(flows, args = {}) {
  if (args.id || args.nodeId) {
    const id = args.id || args.nodeId;
    const node = flows.find((item) => item.id === id);
    if (!node) {
      throw new Error(`Node '${id}' was not found`);
    }
    return node;
  }

  const candidates = filterNodes(flows, {
    flowId: args.flowId,
    flowLabel: args.flowLabel,
    nodeType: args.nodeType,
    name: args.name,
    includeTabs: args.includeTabs,
  });

  if (candidates.length === 0) {
    throw new Error("No node matched the selection");
  }

  if (candidates.length > 1) {
    throw new Error(`Selection matched ${candidates.length} nodes; refine by id`);
  }

  return candidates[0];
}

function isBackupEnabled(config) {
  return config.backup?.enabled !== false;
}

function expandHome(inputPath) {
  if (!inputPath) {
    return undefined;
  }

  const value = String(inputPath);
  if (value === "~") {
    return os.homedir();
  }

  if (value.startsWith("~/") || value.startsWith("~\\")) {
    return path.join(os.homedir(), value.slice(2));
  }

  return value;
}

function getMaxBackups(config) {
  return config.backup?.maxBackups || DEFAULTS.maxBackups;
}

function getAutoCleanup(config) {
  return config.backup?.autoCleanup ?? DEFAULTS.autoCleanup;
}

/**
 * Get Node-RED directory and backup paths.
 */
export function getPaths(config) {
  const nodeRedDir =
    expandHome(process.env.NODE_RED_USER_DIR) ||
    expandHome(config.nodeRedDir) ||
    path.join(os.homedir(), ".node-red");

  const backupPath = expandHome(config.backup?.backupPath) || nodeRedDir;
  const backupDir = path.join(backupPath, DEFAULTS.backupDir);
  const flowsPath = path.join(nodeRedDir, "flows.json");
  const metadataPath = path.join(backupDir, DEFAULTS.metadataFile);

  return { nodeRedDir, backupDir, flowsPath, metadataPath };
}

function getBackupFallbackFiles(backupName, config, primaryFile) {
  const entries = [
    config.backup?.fallbackPath,
    ...(Array.isArray(config.backup?.fallbackPaths)
      ? config.backup.fallbackPaths
      : []),
  ].filter(Boolean);
  const seen = new Set([path.resolve(primaryFile)]);
  const files = [];

  for (const entry of entries) {
    const fallbackPath = expandHome(entry);
    if (!fallbackPath) {
      continue;
    }

    const candidates = fallbackPath.endsWith(".json")
      ? [fallbackPath]
      : [
          path.join(fallbackPath, `${backupName}.json`),
          path.join(fallbackPath, DEFAULTS.backupDir, `${backupName}.json`),
        ];

    for (const candidate of candidates) {
      const resolved = path.resolve(candidate);
      if (!seen.has(resolved)) {
        seen.add(resolved);
        files.push(candidate);
      }
    }
  }

  return files;
}

async function atomicWriteJson(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(value, null, 2));
  await fs.rename(tempPath, filePath);
}

/**
 * Ensure backup directory exists and initialize metadata.
 */
export async function ensureBackupDirectory(config) {
  if (!isBackupEnabled(config)) {
    throw new Error("Backup system is disabled");
  }

  const { backupDir, metadataPath } = getPaths(config);

  await fs.mkdir(backupDir, { recursive: true });

  try {
    await fs.access(metadataPath);
  } catch {
    const initialMetadata = {
      version: "1.0",
      config: {
        maxBackups: getMaxBackups(config),
        autoCleanup: getAutoCleanup(config),
      },
      backups: [],
    };
    await atomicWriteJson(metadataPath, initialMetadata);
  }
}

async function readMetadata(config) {
  await ensureBackupDirectory(config);
  const { metadataPath } = getPaths(config);
  const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("Backup metadata must be an object");
  }

  if (!Array.isArray(metadata.backups)) {
    throw new Error("Backup metadata is missing a backups array");
  }

  metadata.config = {
    maxBackups: getMaxBackups(config),
    autoCleanup: getAutoCleanup(config),
  };

  return metadata;
}

function validateBackupName(name) {
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(name)) {
    throw new Error(
      "Backup name must be 1-50 characters, letters/numbers/underscores/hyphens only"
    );
  }
}

/**
 * Generate backup name and validate it.
 */
export function createBackupName(name, timestamp) {
  if (name) {
    validateBackupName(name);
    if (["latest", "current", "temp", "backup"].includes(name.toLowerCase())) {
      throw new Error(`'${name}' is a reserved name`);
    }
    return name;
  }

  return `backup_${timestamp
    .replace(/[-:.]/g, "")
    .replace("T", "_")
    .substring(0, 15)}`;
}

async function backupFileExists(backupDir, filename) {
  try {
    await fs.access(path.join(backupDir, filename));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function createAvailableBackupName(name, timestamp, metadata, backupDir) {
  const backupName = createBackupName(name, timestamp);
  const existingNames = new Set(metadata.backups.map((backup) => backup.name));

  if (name) {
    if (existingNames.has(backupName)) {
      throw new Error(`Backup '${backupName}' already exists`);
    }
    await assertBackupFileDoesNotExist(backupDir, `${backupName}.json`, backupName);
    return backupName;
  }

  if (
    !existingNames.has(backupName) &&
    !(await backupFileExists(backupDir, `${backupName}.json`))
  ) {
    return backupName;
  }

  for (let index = 1; index <= 999; index += 1) {
    const candidate = `${backupName}_${String(index).padStart(3, "0")}`;
    validateBackupName(candidate);
    if (
      !existingNames.has(candidate) &&
      !(await backupFileExists(backupDir, `${candidate}.json`))
    ) {
      return candidate;
    }
  }

  throw new Error(`Could not create a unique backup name for '${backupName}'`);
}

/**
 * Calculate checksum and flow statistics.
 */
export function analyzeFlows(flows) {
  if (!Array.isArray(flows)) {
    throw new Error("Node-RED flows response does not contain a flow array");
  }

  const serialized = JSON.stringify(flows);
  return {
    checksum: crypto.createHash("sha256").update(serialized).digest("hex"),
    flowsCount: flows.filter((f) => f.type === "tab").length,
    nodesCount: flows.filter(
      (f) => f.type && f.type !== "tab" && f.type !== "subflow"
    ).length,
    size: serialized.length,
  };
}

/**
 * Create a new backup from the current Node-RED flows.
 */
export async function createBackup(name, reason, config) {
  if (!isBackupEnabled(config)) {
    throw new Error("Backup system is disabled");
  }

  const flows = await callNodeRed("get", "/flows", null, config);
  const timestamp = new Date().toISOString();
  const analysis = analyzeFlows(flows);
  const metadata = await readMetadata(config);
  const { backupDir, metadataPath } = getPaths(config);
  const backupName = await createAvailableBackupName(
    name,
    timestamp,
    metadata,
    backupDir
  );

  const backupCountBefore = metadata.backups.length;
  const filename = `${backupName}.json`;
  const backupPath = path.join(backupDir, filename);
  const retention = {
    autoCleanup: metadata.config.autoCleanup,
    maxBackups: metadata.config.maxBackups,
    backupCountBefore,
    backupCountAfter: backupCountBefore + 1,
    cleanupTriggered: false,
    deletedBackups: [],
    deleteErrors: [],
  };

  const backupData = {
    metadata: {
      name: backupName,
      timestamp,
      reason: reason || "Manual backup",
      checksum: analysis.checksum,
      flowsCount: analysis.flowsCount,
      nodesCount: analysis.nodesCount,
      size: analysis.size,
    },
    flows,
  };

  await atomicWriteJson(backupPath, backupData);

  metadata.backups.push({
    ...backupData.metadata,
    filename,
  });

  if (
    metadata.config.autoCleanup &&
    metadata.backups.length > metadata.config.maxBackups
  ) {
    retention.cleanupTriggered = true;
    const sortedBackups = [...metadata.backups].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    const toDelete = sortedBackups.slice(metadata.config.maxBackups);

    for (const backup of toDelete) {
      retention.deletedBackups.push({
        name: backup.name,
        timestamp: backup.timestamp,
        reason: backup.reason,
        filename: backup.filename,
      });
      try {
        await fs.unlink(path.join(backupDir, backup.filename));
      } catch (error) {
        retention.deleteErrors.push({
          name: backup.name,
          filename: backup.filename,
          message: error instanceof Error ? error.message : String(error),
        });
        // Health checks report missing files later.
      }
    }

    metadata.backups = sortedBackups.slice(0, metadata.config.maxBackups);
  }

  retention.backupCountAfter = metadata.backups.length;

  await atomicWriteJson(metadataPath, metadata);

  return {
    ...backupData.metadata,
    filename,
    backupPath,
    backupDir,
    metadataPath,
    retention,
  };
}

export async function createMutationBackup(config, reason) {
  if (!isBackupEnabled(config)) {
    throw new Error(
      "Mutation blocked: backups are required before mutating tools, but the backup system is disabled."
    );
  }

  if (config.backup?.autoBeforeMutations !== true) {
    throw new Error(
      "Mutation blocked: backups are required before mutating tools. Enable MCP_AUTO_BACKUP=true or use --auto-backup."
    );
  }

  try {
    return await createBackup(undefined, reason, config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Mutation blocked: required backup could not be created before the change. ${message}`
    );
  }
}

export async function createBackupDiff(backupName, config, afterFlows) {
  validateBackupName(backupName);

  const backup = await getBackupFlows(backupName, config);
  const flowsAfter =
    afterFlows || (await callNodeRed("get", "/flows", null, config));
  const afterAnalysis = analyzeFlows(flowsAfter);
  const { backupDir, metadataPath } = getPaths(config);
  const filename = `${backupName}.diff.json`;
  const diff = createFlowDiff(backup.flows, flowsAfter, {
    backupName,
    backupTimestamp: backup.metadata.timestamp,
    backupReason: backup.metadata.reason,
    filename,
    beforeChecksum: backup.metadata.checksum,
    afterChecksum: afterAnalysis.checksum,
  });

  await atomicWriteJson(path.join(backupDir, filename), diff);

  const metadata = await readMetadata(config);
  const entry = metadata.backups.find((item) => item.name === backupName);
  if (entry) {
    entry.diffFilename = filename;
    entry.diffTimestamp = diff.metadata.createdAt;
    entry.diffSummary = diff.summary;
    await atomicWriteJson(metadataPath, metadata);
  }

  return diff;
}

export async function getBackupDiff(backupName, config, { refresh = false } = {}) {
  validateBackupName(backupName);
  const metadata = await readMetadata(config);
  const entry = metadata.backups.find((item) => item.name === backupName);

  if (!entry) {
    throw new Error(`Backup '${backupName}' not found`);
  }

  const { backupDir } = getPaths(config);
  if (!refresh && entry.diffFilename) {
    try {
      return JSON.parse(
        await fs.readFile(path.join(backupDir, entry.diffFilename), "utf8")
      );
    } catch {
      // Fall through and regenerate below.
    }
  }

  return createBackupDiff(backupName, config);
}

export async function runMutationWithBackup(config, reason, mutationFn) {
  const backup = await createMutationBackup(config, reason);
  const result = await mutationFn(backup);
  let diff = null;
  let diffError = null;

  try {
    diff = await createBackupDiff(backup.name, config);
  } catch (error) {
    diffError = error instanceof Error ? error.message : String(error);
  }

  return { result, backup, diff, diffError };
}

export function formatMutationAudit(audit) {
  const lines = ["", `Backup: ${audit.backup.name}`];

  if (audit.diff) {
    lines.push(
      `Diff: ${audit.diff.metadata.filename}`,
      `Diff summary: +${audit.diff.summary.added} ~${audit.diff.summary.modified} -${audit.diff.summary.removed}`
    );
  } else if (audit.diffError) {
    lines.push(`Diff warning: ${audit.diffError}`);
  }

  return lines.join("\n");
}

export function formatMutationAuditObject(audit) {
  return {
    backup: audit.backup,
    diff: audit.diff
      ? {
          filename: audit.diff.metadata?.filename,
          summary: audit.diff.summary,
        }
      : null,
    diffError: audit.diffError || null,
  };
}

/**
 * Get flows from a specific backup.
 */
export async function getBackupFlows(backupName, config) {
  validateBackupName(backupName);
  await ensureBackupDirectory(config);

  const { backupDir } = getPaths(config);
  const backupFile = path.join(backupDir, `${backupName}.json`);
  const candidates = [
    backupFile,
    ...getBackupFallbackFiles(backupName, config, backupFile),
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];

    try {
      const backupData = JSON.parse(await fs.readFile(candidate, "utf8"));

      if (!Array.isArray(backupData.flows)) {
        throw new Error("Backup file is invalid: missing flows array");
      }

      if (!backupData.metadata?.checksum) {
        throw new Error("Backup file is invalid: missing checksum");
      }

      const currentChecksum = analyzeFlows(backupData.flows).checksum;
      if (currentChecksum !== backupData.metadata.checksum) {
        throw new Error("Backup file is corrupted: checksum mismatch");
      }

      return {
        metadata: backupData.metadata,
        flows: backupData.flows,
      };
    } catch (err) {
      if (err.code === "ENOENT") {
        continue;
      }

      if (index === 0) {
        throw err;
      }

      throw new Error(
        `Backup '${backupName}' fallback '${candidate}' is invalid: ${err.message}`
      );
    }
  }

  throw new Error(`Backup '${backupName}' not found`);
}

function applyDerivedBackupOperation(flows, operation, index) {
  const node = flows.find((item) => item.id === operation.nodeId);
  if (!node) {
    throw new Error(`Operation ${index}: node '${operation.nodeId}' was not found`);
  }

  if (operation.op === "patch_node") {
    const changes = [];
    for (const [field, value] of Object.entries(operation.patches || {})) {
      const before = getValueAtPath(node, field);
      const after = cloneJson(value);
      if (JSON.stringify(before) === JSON.stringify(after)) {
        continue;
      }
      setValueAtPath(node, field, after);
      changes.push({
        operation: operation.op,
        operationIndex: index,
        nodeId: node.id,
        field,
        before,
        after,
      });
    }
    return changes;
  }

  if (operation.op === "replace_node_field") {
    const before = getValueAtPath(node, operation.field);
    if (typeof before !== "string") {
      throw new Error(
        `Operation ${index}: field '${operation.field}' on node '${node.id}' is not a string`
      );
    }

    if (operation.search === "") {
      throw new Error(`Operation ${index}: search must not be empty`);
    }

    let replacements = 0;
    let after;
    if (operation.regex) {
      const regex = new RegExp(operation.search, operation.flags || "g");
      after = before.replace(regex, (...args) => {
        replacements += 1;
        return operation.replacement ?? "";
      });
    } else {
      replacements = before.split(operation.search).length - 1;
      after = before.split(operation.search).join(operation.replacement ?? "");
    }

    if (before === after) {
      return [];
    }

    setValueAtPath(node, operation.field, after);
    return [
      {
        operation: operation.op,
        operationIndex: index,
        nodeId: node.id,
        field: operation.field,
        replacements,
        before,
        after,
      },
    ];
  }

  if (operation.op === "delete_node_field") {
    const before = getValueAtPath(node, operation.field);
    if (before === undefined) {
      return [];
    }

    deleteValueAtPath(node, operation.field);
    return [
      {
        operation: operation.op,
        operationIndex: index,
        nodeId: node.id,
        field: operation.field,
        before,
        after: undefined,
      },
    ];
  }

  throw new Error(`Operation ${index}: unsupported operation '${operation.op}'`);
}

async function assertBackupFileDoesNotExist(backupDir, filename, backupName) {
  try {
    await fs.access(path.join(backupDir, filename));
    throw new Error(`Backup '${backupName}' already exists`);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function createDerivedBackup(
  sourceName,
  targetName,
  reason,
  operations,
  config
) {
  if (!isBackupEnabled(config)) {
    throw new Error("Backup system is disabled");
  }

  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error("Provide at least one derive operation");
  }

  const source = await getBackupFlows(sourceName, config);
  const timestamp = new Date().toISOString();
  const backupName = createBackupName(targetName, timestamp);
  const metadata = await readMetadata(config);
  const { backupDir, metadataPath } = getPaths(config);
  const filename = `${backupName}.json`;

  if (metadata.backups.some((backup) => backup.name === backupName)) {
    throw new Error(`Backup '${backupName}' already exists`);
  }
  await assertBackupFileDoesNotExist(backupDir, filename, backupName);

  const flows = cloneJson(source.flows);
  const changes = [];
  operations.forEach((operation, index) => {
    changes.push(...applyDerivedBackupOperation(flows, operation, index));
  });

  const analysis = analyzeFlows(flows);
  const backupData = {
    metadata: {
      name: backupName,
      timestamp,
      reason: reason || `Derived from backup ${sourceName}`,
      sourceBackup: sourceName,
      sourceChecksum: source.metadata.checksum,
      checksum: analysis.checksum,
      flowsCount: analysis.flowsCount,
      nodesCount: analysis.nodesCount,
      size: analysis.size,
    },
    flows,
  };

  await atomicWriteJson(path.join(backupDir, filename), backupData);
  metadata.backups.push({
    ...backupData.metadata,
    filename,
  });
  await atomicWriteJson(metadataPath, metadata);

  const diff = createFlowDiff(source.flows, flows, {
    operation: "derive-backup",
    sourceBackup: sourceName,
    targetBackup: backupName,
    beforeChecksum: source.metadata.checksum,
    afterChecksum: analysis.checksum,
  });

  return {
    metadata: backupData.metadata,
    changes,
    diff,
  };
}

function normalizeEntityStates(states = {}) {
  if (!isObject(states)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(states).map(([entityId, value]) => {
      if (isObject(value) && Object.hasOwn(value, "state")) {
        return [entityId, value];
      }

      return [
        entityId,
        {
          state: value === undefined || value === null ? "" : String(value),
          attributes: {},
        },
      ];
    })
  );
}

function createContextStore(initial = {}) {
  const store = new Map(Object.entries(isObject(initial) ? cloneJson(initial) : {}));

  return {
    store,
    api: {
      get(key) {
        if (Array.isArray(key)) {
          return key.map((item) => store.get(item));
        }
        return store.get(key);
      },
      set(key, value) {
        if (Array.isArray(key)) {
          key.forEach((item, index) => {
            store.set(item, Array.isArray(value) ? value[index] : value);
          });
          return;
        }
        store.set(key, value);
      },
      keys() {
        return [...store.keys()];
      },
    },
  };
}

function buildFunctionSandbox(args = {}) {
  const flowStore = createContextStore(args.flowContext || {});
  const globalStore = createContextStore(args.globalContext || {});
  const states = normalizeEntityStates(args.states || {});
  if (Object.keys(states).length > 0 && !globalStore.store.has("homeassistant")) {
    globalStore.store.set("homeassistant", {
      homeAssistant: { states },
    });
  }

  const statuses = [];
  const warnings = [];
  const errors = [];
  const sent = [];
  let nextTimerId = 1;

  const sandboxNode = {
    status(value) {
      statuses.push(cloneJson(value));
    },
    warn(value) {
      warnings.push(value instanceof Error ? value.message : cloneJson(value));
    },
    error(value) {
      errors.push(value instanceof Error ? value.message : cloneJson(value));
    },
    send(value) {
      sent.push(cloneJson(value));
    },
    done(value) {
      if (value) {
        errors.push(value instanceof Error ? value.message : cloneJson(value));
      }
    },
  };
  const sandboxSetTimeout = (callback, _delay, ...values) => {
    const id = nextTimerId++;
    if (typeof callback === "function") {
      try {
        callback(...values);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    return id;
  };
  const sandboxClearTimeout = () => {};

  return {
    flowStore,
    globalStore,
    statuses,
    warnings,
    errors,
    sent,
    sandbox: {
      msg: cloneJson(args.msg || {}),
      context: flowStore.api,
      flow: flowStore.api,
      global: globalStore.api,
      node: sandboxNode,
      setTimeout: sandboxSetTimeout,
      clearTimeout: sandboxClearTimeout,
      console,
      Buffer,
      Date,
      Number,
      String,
      Boolean,
      Array,
      Object,
      RegExp,
      JSON,
      Set,
      Map,
      Math,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
    },
  };
}

function contextStoreToObject(contextStore) {
  return Object.fromEntries(contextStore.store.entries());
}

export async function simulateFunctionNodeFromBackup(backupName, config, args = {}) {
  const backup = await getBackupFlows(backupName, config);
  const node = findNodeBySelection(backup.flows, {
    ...args,
    nodeType: "function",
  });
  if (typeof node.func !== "string") {
    throw new Error(`Node '${node.id}' does not have a string func field`);
  }

  const execution = buildFunctionSandbox(args);
  let result;
  try {
    result = vm.runInNewContext(
      `(function () {\n${node.func}\n})()`,
      execution.sandbox,
      { timeout: args.timeoutMs ?? 1000 }
    );
  } catch (error) {
    execution.errors.push(error instanceof Error ? error.message : String(error));
    result = undefined;
  }

  const output = {
    node: nodeMetadata(node, backup.flows, {
      source: "backup",
      backupName,
    }),
    result: result === undefined ? null : cloneJson(result),
    sent: execution.sent,
    msg: execution.sandbox.msg,
    flowContext: contextStoreToObject(execution.flowStore),
    globalContext: contextStoreToObject(execution.globalStore),
    statuses: execution.statuses,
    warnings: execution.warnings,
    errors: execution.errors,
  };
  const shaped = shapeValueForResponse(
    output,
    responseShapeOptions(args, config)
  );

  return {
    ...shaped.value,
    truncations: shaped.truncations,
  };
}

/**
 * List all available backups.
 */
export async function listBackups(detailed, config) {
  const metadata = await readMetadata(config);
  const sortedBackups = [...metadata.backups].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return sortedBackups.map((backup, index) => ({
    name: backup.name,
    timestamp: backup.timestamp,
    reason: backup.reason,
    isLatest: index === 0,
    ...(detailed && {
      flowsCount: backup.flowsCount,
      nodesCount: backup.nodesCount,
      size: backup.size,
      diffFilename: backup.diffFilename,
      diffTimestamp: backup.diffTimestamp,
      diffSummary: backup.diffSummary,
    }),
  }));
}

export async function getLatestMutationBackup(config) {
  const backups = await listBackups(true, config);
  return backups.find((backup) => String(backup.reason || "").startsWith("Before "));
}

function getMutationConfirmationThreshold(config) {
  return config.mutationConfirmationThreshold ?? 50;
}

function countDiffAffected(diff) {
  const summary = diff?.summary || {};
  return (summary.added || 0) + (summary.modified || 0) + (summary.removed || 0);
}

async function createRestorePreview(backupName, config) {
  const backup = await getBackupFlows(backupName, config);
  const currentFlows = await callNodeRed("get", "/flows", null, config);
  const diff = createFlowDiff(currentFlows, backup.flows, {
    operation: "restore-preview",
    backupName,
    backupTimestamp: backup.metadata.timestamp,
    backupReason: backup.metadata.reason,
  });

  return {
    backup: backup.metadata,
    diff,
    affectedCount: countDiffAffected(diff),
  };
}

function evaluateRestoreConfirmation(preview, config, confirmToken) {
  return evaluateMutationConfirmation({
    operation: "restore-backup-flows",
    scope: preview.backup.name,
    affectedCount: preview.affectedCount,
    deletedCount: preview.diff.summary.removed || 0,
    threshold: getMutationConfirmationThreshold(config),
    confirmToken,
  });
}

export async function restoreBackupFlows(
  backupName,
  config
) {
  if (config.readOnly) {
    throw new Error("restore-backup-flows is not available in read-only mode");
  }

  const backup = await getBackupFlows(backupName, config);

  const audit = await runMutationWithBackup(
    config,
    `Before restore-backup-flows ${backupName}`,
    async () => {
      const current = await getFlowsWithRevision(config);
      return postFlowsWithRevision(current, backup.flows, config, "full");
    }
  );

  return {
    restored: backup.metadata,
    newRevision: audit.result?.rev,
    audit,
  };
}

/**
 * Check backup system health.
 */
export async function checkBackupHealth(config) {
  const { backupDir } = getPaths(config);

  const health = {
    healthy: true,
    count: 0,
    totalSize: 0,
    latestAgeMinutes: null,
    location: backupDir,
    issues: [],
  };

  try {
    await ensureBackupDirectory(config);
    const metadata = await readMetadata(config);
    health.count = metadata.backups.length;

    if (health.count === 0) {
      health.healthy = false;
      health.issues.push("No backups found. Create your first backup.");
      return health;
    }

    let corruptedCount = 0;
    for (const backup of metadata.backups) {
      try {
        const backupFile = path.join(backupDir, backup.filename);
        const stats = await fs.stat(backupFile);
        health.totalSize += stats.size;

        const backupData = JSON.parse(await fs.readFile(backupFile, "utf8"));
        const checksum = analyzeFlows(backupData.flows).checksum;

        if (checksum !== backup.checksum) {
          corruptedCount++;
        }
      } catch {
        corruptedCount++;
      }
    }

    const latestBackup = [...metadata.backups].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
    if (latestBackup) {
      health.latestAgeMinutes = Math.round(
        (Date.now() - new Date(latestBackup.timestamp).getTime()) / (1000 * 60)
      );
    }

    if (corruptedCount > 0) {
      health.healthy = false;
      health.issues.push(`Found ${corruptedCount} corrupted backup(s)`);
    }

    if (health.latestAgeMinutes !== null && health.latestAgeMinutes > 24 * 60) {
      health.issues.push(
        "Latest backup is over 24 hours old. Consider creating a new backup."
      );
    }

    if (health.count >= metadata.config.maxBackups * 0.9) {
      health.issues.push(
        `Backup count approaching limit (${health.count}/${metadata.config.maxBackups})`
      );
    }

    if (health.totalSize > 100 * 1024 * 1024) {
      health.issues.push(
        "Backup files are using significant disk space. Consider cleanup."
      );
    }
  } catch {
    health.healthy = false;
    health.issues.push(
      "Backup system initialization failed. Check path permissions and metadata."
    );
  }

  return health;
}

function formatBackupCreatedResponse(metadata) {
  return {
    ok: true,
    message: "Backup created successfully.",
    backup: {
      name: metadata.name,
      timestamp: metadata.timestamp,
      reason: metadata.reason,
      checksum: metadata.checksum,
      flowsCount: metadata.flowsCount,
      nodesCount: metadata.nodesCount,
      sizeBytes: metadata.size,
      sizeKb: Math.round(metadata.size / 1024),
    },
    files: {
      filename: metadata.filename,
      backupPath: metadata.backupPath,
      backupDir: metadata.backupDir,
      metadataPath: metadata.metadataPath,
    },
    retention: metadata.retention,
  };
}

/**
 * Registers backup-related tools in the MCP server.
 * @param {Object} server - MCP server instance
 * @param {Object} config - Server configuration
 */
export default function registerBackupTools(server, config) {
  if (!isBackupEnabled(config)) {
    server.tool(
      "backup-health",
      "Check backup system health and provide recommendations",
      {},
      async () => textResponse("Backup system is disabled by configuration.")
    );
    return;
  }

  server.tool(
    "backup-flows",
    "Create a named backup of current Node-RED flows with optional reason",
    {
      name: z
        .string()
        .optional()
        .describe("Backup name/label (optional, auto-generated if omitted)"),
      reason: z
        .string()
        .optional()
        .describe("Optional reason/description for creating this backup"),
    },
    async ({ name, reason }) => runTool("Create backup", async () => {
      const metadata = await createBackup(name, reason, config);
      return jsonResponse(formatBackupCreatedResponse(metadata));
    })
  );

  server.tool(
    "list-backups",
    "List all available flow backups with details",
    {
      detailed: z
        .boolean()
        .optional()
        .describe("Show detailed backup information"),
    },
    async ({ detailed }) => runTool("List backups", async () => {
      const backups = await listBackups(detailed, config);

      if (backups.length === 0) {
        return textResponse("No backups found. Create your first backup with backup-flows.");
      }

      let output = `Found ${backups.length} backup(s):\n\n`;

      backups.forEach((backup, index) => {
        const activeMarker = backup.isLatest ? " [LATEST]" : "";
        output += `${index + 1}. ${backup.name}${activeMarker}\n`;
        output += `   Created: ${new Date(backup.timestamp).toLocaleString()}\n`;
        output += `   Reason: ${backup.reason}\n`;

        if (detailed) {
          output += `   Flows: ${backup.flowsCount} tabs, ${backup.nodesCount} nodes\n`;
          output += `   Size: ${Math.round(backup.size / 1024)}KB\n`;
          if (backup.diffFilename) {
            const diff = backup.diffSummary || {};
            output += `   Diff: ${backup.diffFilename} (+${diff.added || 0} ~${diff.modified || 0} -${diff.removed || 0})\n`;
          }
        }
        output += "\n";
      });

      return textResponse(output.trim());
    })
  );

  server.tool(
    "get-backup-flows",
    "Get the specific flows content from a backup by name",
    {
      name: z.string().describe("Backup name to retrieve flows from"),
      summaryOnly: z.boolean().optional().describe("Return only backup metadata and flow statistics"),
      includeTabs: z.boolean().optional().describe("Include tab nodes in selective output"),
      includeConfigNodes: z.boolean().optional().describe("Include global/config nodes in selective output"),
      flowId: z.string().optional().describe("Limit output to one flow id"),
      flowLabel: z.string().optional().describe("Limit output to one flow label"),
      types: z.array(z.string()).optional().describe("Limit output to node types"),
      limit: z.number().int().nonnegative().optional().describe("Maximum objects to return"),
      offset: z.number().int().nonnegative().optional().describe("Objects to skip"),
      ...nodeProjectionArgs,
    },
    async (args) => runTool("Get backup flows", async () => {
      const { name } = args;
      const backupFlows = await getBackupFlows(name, config);
      if (args.summaryOnly) {
        return jsonResponse({
          metadata: backupFlows.metadata,
          analysis: analyzeFlows(backupFlows.flows),
        });
      }

      const selected = selectFlows(backupFlows.flows, args);
      const shaped = shapeFlowSelectionForResponse(selected, args, config);
      return jsonResponse(
        Array.isArray(shaped)
          ? shaped
          : {
              metadata: backupFlows.metadata,
              ...shaped,
            }
      );
    })
  );

  server.tool(
    "get-backup-node",
    "Retrieve one node from a named backup by id or selector, with optional field projection and string truncation.",
    {
      name: z.string().describe("Backup name to retrieve from"),
      id: z.string().optional().describe("Node id to retrieve"),
      flowId: z.string().optional().describe("Limit selector to one flow id"),
      flowLabel: z.string().optional().describe("Limit selector to one flow label"),
      nodeType: z.string().optional().describe("Limit selector to one node type"),
      nodeName: z.string().optional().describe("Limit selector to node names containing this text"),
      includeTabs: z.boolean().optional().describe("Allow tab nodes in selector"),
      ...nodeProjectionArgs,
    },
    async (args) => runTool("Get backup node", async () => {
      const backupFlows = await getBackupFlows(args.name, config);
      const node = findNodeBySelection(backupFlows.flows, {
        id: args.id,
        flowId: args.flowId,
        flowLabel: args.flowLabel,
        nodeType: args.nodeType,
        name: args.nodeName,
        includeTabs: args.includeTabs,
      });

      return jsonResponse({
        metadata: nodeMetadata(node, backupFlows.flows, {
          source: "backup",
          backupName: args.name,
        }),
        node: shapeNodeForResponse(node, responseShapeOptions(args, config)),
      });
    })
  );

  server.tool(
    "derive-backup",
    "Create a new local backup by applying node-level patches/replacements to an existing backup without touching live Node-RED.",
    {
      sourceName: z.string().describe("Existing backup name to derive from"),
      targetName: z
        .string()
        .optional()
        .describe("New backup name; auto-generated if omitted"),
      reason: z.string().optional().describe("Reason stored in backup metadata"),
      operations: z
        .array(deriveBackupOperationSchema)
        .min(1)
        .describe("Node-level operations to apply to the source backup"),
      includeChanges: z
        .boolean()
        .optional()
        .describe("Include change details; default true"),
      includeDiff: z
        .boolean()
        .optional()
        .describe("Include full structured diff; default false"),
      limitChanges: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe("Maximum change details to return"),
      ...responseShapeArgs,
    },
    async (args) => runTool("Derive backup", async () => {
      const result = await createDerivedBackup(
        args.sourceName,
        args.targetName,
        args.reason,
        args.operations,
        config
      );
      const changes = limitedList(result.changes, {
        include: args.includeChanges ?? true,
        limit: args.limitChanges ?? config.maxResponseItems ?? 100,
      });
      const shapedChanges = shapeValueForResponse(
        changes,
        responseShapeOptions(args, config)
      );
      const shapedDiff = args.includeDiff
        ? shapeValueForResponse(result.diff, responseShapeOptions(args, config)).value
        : { summary: result.diff.summary };

      return jsonResponse({
        metadata: result.metadata,
        changes: shapedChanges.value,
        changeTruncations: shapedChanges.truncations,
        diff: shapedDiff,
      });
    })
  );

  server.tool(
    "simulate-function-node",
    "Run a function node from a named backup in a local sandbox with supplied msg, flow/global context, and Home Assistant state fixtures.",
    {
      name: z.string().describe("Backup name to read from"),
      id: z.string().optional().describe("Function node id"),
      flowId: z.string().optional().describe("Limit selector to one flow id"),
      flowLabel: z.string().optional().describe("Limit selector to one flow label"),
      nodeName: z.string().optional().describe("Limit selector to function node names containing this text"),
      msg: z.record(z.any()).optional().describe("Input msg object"),
      states: z
        .record(z.any())
        .optional()
        .describe("Home Assistant states keyed by entity id"),
      flowContext: z.record(z.any()).optional().describe("Initial flow context"),
      globalContext: z.record(z.any()).optional().describe("Initial global context"),
      timeoutMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Sandbox execution timeout in milliseconds; default 1000"),
      ...responseShapeArgs,
    },
    async (args) => runTool("Simulate function node", async () => {
      return jsonResponse(
        await simulateFunctionNodeFromBackup(args.name, config, {
          id: args.id,
          flowId: args.flowId,
          flowLabel: args.flowLabel,
          name: args.nodeName,
          msg: args.msg,
          states: args.states,
          flowContext: args.flowContext,
          globalContext: args.globalContext,
          timeoutMs: args.timeoutMs,
          includeFullValues: args.includeFullValues,
          maxStringLength: args.maxStringLength,
        })
      );
    })
  );

  server.tool(
    "get-backup-diff",
    "Get the stored diff for a backup, or generate one by comparing that backup to the current Node-RED flows.",
    {
      name: z.string().describe("Backup name to retrieve diff for"),
      refresh: z
        .boolean()
        .optional()
        .describe("Recompute the diff against current flows even if a stored diff exists"),
      format: z
        .enum(["summary", "json"])
        .optional()
        .describe("Return a compact text summary or the full structured JSON diff"),
    },
    async ({ name, refresh, format }) => runTool("Get backup diff", async () => {
      const diff = await getBackupDiff(name, config, {
        refresh: refresh ?? false,
      });

      if (format === "json") {
        return jsonResponse(diff);
      }

      return textResponse(formatFlowDiffSummary(diff));
    })
  );

  if (!config.readOnly) {
    server.tool(
      "restore-backup-flows",
      "Preview or restore Node-RED flows from a named backup using optimistic locking",
      {
        name: z.string().describe("Backup name to restore"),
        dryRun: z
          .boolean()
          .optional()
          .describe("Default true. Set false to restore."),
        confirmToken: z
          .string()
          .optional()
          .describe("Confirmation token required for large restores"),
      },
      async ({ name, dryRun, confirmToken }) => runTool("Restore backup flows", async () => {
        const preview = await createRestorePreview(name, config);
        const confirmation = evaluateRestoreConfirmation(
          preview,
          config,
          confirmToken
        );

        if (dryRun ?? true) {
          return jsonResponse({
            dryRun: true,
            wouldWrite: false,
            backup: preview.backup,
            diff: { summary: preview.diff.summary },
            confirmation,
          });
        }

        if (confirmation.required && !confirmation.confirmed) {
          return jsonResponse({
            requiresConfirmation: true,
            wouldWrite: false,
            backup: preview.backup,
            diff: { summary: preview.diff.summary },
            confirmation,
          });
        }

        const result = await restoreBackupFlows(name, config);
        return jsonResponse({
          restored: result.restored,
          newRevision: result.newRevision || null,
          confirmation,
          audit: formatMutationAuditObject(result.audit),
        });
      })
    );

    server.tool(
      "undo-last-mutation",
      "Finds the latest automatic mutation backup and previews or restores it. Dry-run is default.",
      {
        dryRun: z
          .boolean()
          .optional()
          .describe("Default true. Set false to restore the latest mutation backup."),
        confirmToken: z
          .string()
          .optional()
          .describe("Confirmation token required for large restores"),
      },
      async ({ dryRun, confirmToken }) => runTool("Undo last mutation", async () => {
        const backup = await getLatestMutationBackup(config);
        if (!backup) {
          return jsonResponse({
            found: false,
            message: "No automatic mutation backup was found.",
          });
        }

        const preview = await createRestorePreview(backup.name, config);
        const confirmation = evaluateRestoreConfirmation(
          preview,
          config,
          confirmToken
        );

        if (dryRun ?? true) {
          return jsonResponse({
            dryRun: true,
            wouldWrite: false,
            backup: preview.backup,
            diff: { summary: preview.diff.summary },
            confirmation,
          });
        }

        if (confirmation.required && !confirmation.confirmed) {
          return jsonResponse({
            requiresConfirmation: true,
            wouldWrite: false,
            backup: preview.backup,
            diff: { summary: preview.diff.summary },
            confirmation,
          });
        }

        const result = await restoreBackupFlows(backup.name, config);

        return jsonResponse({
          restored: result.restored,
          newRevision: result.newRevision || null,
          confirmation,
          audit: formatMutationAuditObject(result.audit),
        });
      })
    );
  }

  server.tool(
    "backup-health",
    "Check backup system health and provide recommendations",
    {},
    async () => runTool("Check backup health", async () => {
      const health = await checkBackupHealth(config);

      let output = `Backup System Health Report\n\n`;
      output += `Overall Status: ${
        health.healthy ? "HEALTHY" : "ISSUES DETECTED"
      }\n`;
      output += `Total Backups: ${health.count}\n`;
      output += `Total Size: ${Math.round(health.totalSize / 1024)}KB\n`;

      if (health.latestAgeMinutes !== null) {
        output += `Latest Backup: ${health.latestAgeMinutes}m ago\n`;
      }

      output += `Storage Location: ${health.location}\n`;

      if (health.issues.length > 0) {
        output += `\nIssues & Recommendations:\n`;
        health.issues.forEach((issue, index) => {
          output += `${index + 1}. ${issue}\n`;
        });
      }

      return textResponse(output);
    })
  );
}
