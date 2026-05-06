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
import { createFlowDiff, formatFlowDiffSummary } from "../flow-diff.mjs";

const DEFAULTS = {
  maxBackups: 10,
  autoCleanup: true,
  backupDir: ".mcp-backups",
  metadataFile: "backup_metadata.json",
};

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
  const backupName = createBackupName(name, timestamp);
  const analysis = analyzeFlows(flows);
  const metadata = await readMetadata(config);
  const { backupDir, metadataPath } = getPaths(config);

  if (metadata.backups.some((b) => b.name === backupName)) {
    throw new Error(`Backup '${backupName}' already exists`);
  }

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

  const filename = `${backupName}.json`;
  await atomicWriteJson(path.join(backupDir, filename), backupData);

  metadata.backups.push({
    ...backupData.metadata,
    filename,
  });

  if (
    metadata.config.autoCleanup &&
    metadata.backups.length > metadata.config.maxBackups
  ) {
    const sortedBackups = [...metadata.backups].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    const toDelete = sortedBackups.slice(metadata.config.maxBackups);

    for (const backup of toDelete) {
      try {
        await fs.unlink(path.join(backupDir, backup.filename));
      } catch {
        // Health checks report missing files later.
      }
    }

    metadata.backups = sortedBackups.slice(0, metadata.config.maxBackups);
  }

  await atomicWriteJson(metadataPath, metadata);

  return backupData.metadata;
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

/**
 * Get flows from a specific backup.
 */
export async function getBackupFlows(backupName, config) {
  validateBackupName(backupName);
  await ensureBackupDirectory(config);

  const { backupDir } = getPaths(config);
  const backupFile = path.join(backupDir, `${backupName}.json`);

  try {
    const backupData = JSON.parse(await fs.readFile(backupFile, "utf8"));

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
      throw new Error(`Backup '${backupName}' not found`);
    }
    throw err;
  }
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

export async function restoreBackupFlows(
  backupName,
  config,
  { createSafetyBackup = true } = {}
) {
  if (config.readOnly) {
    throw new Error("restore-backup-flows is not available in read-only mode");
  }

  if (!createSafetyBackup) {
    throw new Error(
      "restore-backup-flows cannot run without a safety backup. Backups are required before mutating tools."
    );
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

function formatBackupMetadata(metadata) {
  return `Backup created successfully.

Name: ${metadata.name}
Timestamp: ${metadata.timestamp}
Reason: ${metadata.reason}
Flows: ${metadata.flowsCount} tabs, ${metadata.nodesCount} nodes
Size: ${Math.round(metadata.size / 1024)}KB`;
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
      return textResponse(formatBackupMetadata(metadata));
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
    },
    async ({ name }) => runTool("Get backup flows", async () => {
      const backupFlows = await getBackupFlows(name, config);
      return jsonResponse(backupFlows.flows);
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
      "Restore Node-RED flows from a named backup using optimistic locking",
      {
        name: z.string().describe("Backup name to restore"),
        createSafetyBackup: z
          .boolean()
          .optional()
          .describe(
            "Create a backup of current flows before restoring. Must not be false because mutating tools require backups."
          ),
      },
      async ({ name, createSafetyBackup }) => runTool("Restore backup flows", async () => {
        const result = await restoreBackupFlows(name, config, {
          createSafetyBackup: createSafetyBackup ?? true,
        });
        const revText = result.newRevision
          ? `\nNew revision: ${result.newRevision}`
          : "";
        return textResponse(
          `Restored backup '${result.restored.name}' from ${result.restored.timestamp}.${revText}${formatMutationAudit(result.audit)}`
        );
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
