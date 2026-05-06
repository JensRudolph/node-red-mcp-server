/**
 * Structured diff helpers for Node-RED flow snapshots.
 */

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function indexById(flows) {
  return new Map(flows.map((node) => [node.id, node]));
}

function getTabMaps(flows) {
  const tabs = flows.filter((node) => node.type === "tab");
  return new Map(tabs.map((tab) => [tab.id, tab]));
}

function getTabLabel(node, tabById) {
  if (node.type === "tab") {
    return node.label || node.name || "(unnamed tab)";
  }

  return tabById.get(node.z)?.label || tabById.get(node.z)?.name || "(global/unknown)";
}

function summarizeNode(node, tabById) {
  return {
    id: node.id,
    type: node.type || "",
    name: node.name || node.label || "",
    z: node.z || null,
    tab: getTabLabel(node, tabById),
  };
}

function shallowChanges(before, after) {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();

  return keys
    .filter((key) => stableStringify(before[key]) !== stableStringify(after[key]))
    .map((key) => ({
      key,
      before: before[key],
      after: after[key],
    }));
}

function tabOrder(flows) {
  return flows
    .filter((node) => node.type === "tab")
    .map((tab) => ({
      id: tab.id,
      label: tab.label || tab.name || "",
    }));
}

function incrementTabCounter(byTab, tab, kind) {
  byTab[tab] ||= { added: 0, removed: 0, modified: 0 };
  byTab[tab][kind] += 1;
}

export function createFlowDiff(beforeFlows, afterFlows, metadata = {}) {
  if (!Array.isArray(beforeFlows)) {
    throw new Error("beforeFlows must be an array");
  }

  if (!Array.isArray(afterFlows)) {
    throw new Error("afterFlows must be an array");
  }

  const beforeById = indexById(beforeFlows);
  const afterById = indexById(afterFlows);
  const beforeTabs = getTabMaps(beforeFlows);
  const afterTabs = getTabMaps(afterFlows);

  const addedNodes = afterFlows.filter((node) => !beforeById.has(node.id));
  const removedNodes = beforeFlows.filter((node) => !afterById.has(node.id));
  const modifiedNodes = afterFlows.filter((node) => {
    const before = beforeById.get(node.id);
    return before && stableStringify(before) !== stableStringify(node);
  });

  const byTab = {};
  for (const node of addedNodes) {
    incrementTabCounter(byTab, getTabLabel(node, afterTabs), "added");
  }
  for (const node of removedNodes) {
    incrementTabCounter(byTab, getTabLabel(node, beforeTabs), "removed");
  }
  for (const node of modifiedNodes) {
    incrementTabCounter(byTab, getTabLabel(node, afterTabs), "modified");
  }

  const beforeTabOrder = tabOrder(beforeFlows);
  const afterTabOrder = tabOrder(afterFlows);

  return {
    metadata: {
      createdAt: new Date().toISOString(),
      ...metadata,
    },
    summary: {
      beforeCount: beforeFlows.length,
      afterCount: afterFlows.length,
      added: addedNodes.length,
      removed: removedNodes.length,
      modified: modifiedNodes.length,
      byTab,
      tabOrderChanged:
        stableStringify(beforeTabOrder) !== stableStringify(afterTabOrder),
    },
    tabOrder: {
      before: beforeTabOrder,
      after: afterTabOrder,
    },
    added: addedNodes.map((node) => ({
      ...summarizeNode(node, afterTabs),
      node,
    })),
    removed: removedNodes.map((node) => ({
      ...summarizeNode(node, beforeTabs),
      node,
    })),
    modified: modifiedNodes.map((node) => {
      const before = beforeById.get(node.id);
      return {
        ...summarizeNode(node, afterTabs),
        changes: shallowChanges(before, node),
        before,
        after: node,
      };
    }),
  };
}

export function formatFlowDiffSummary(diff) {
  const summary = diff.summary || {};
  const lines = [
    `Backup: ${diff.metadata?.backupName || "(unknown)"}`,
    `Diff created: ${diff.metadata?.createdAt || "(unknown)"}`,
    `Before objects: ${summary.beforeCount ?? "?"}`,
    `After objects: ${summary.afterCount ?? "?"}`,
    `Added: ${summary.added ?? 0}`,
    `Removed: ${summary.removed ?? 0}`,
    `Modified: ${summary.modified ?? 0}`,
    `Tab order changed: ${summary.tabOrderChanged ? "yes" : "no"}`,
  ];

  const byTab = summary.byTab || {};
  const tabNames = Object.keys(byTab).sort();
  if (tabNames.length > 0) {
    lines.push("", "By tab:");
    for (const tab of tabNames) {
      const counts = byTab[tab];
      lines.push(
        `- ${tab}: +${counts.added || 0} ~${counts.modified || 0} -${counts.removed || 0}`
      );
    }
  }

  if (diff.metadata?.filename) {
    lines.push("", `Diff file: ${diff.metadata.filename}`);
  }

  return lines.join("\n");
}
