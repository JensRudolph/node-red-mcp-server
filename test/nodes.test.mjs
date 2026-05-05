import assert from "node:assert/strict";
import test from "node:test";

import { extractAvailableNodesFromHtml } from "../lib/tools/nodes.mjs";

test("extractAvailableNodesFromHtml extracts multiple nodes from one module", () => {
  const html = `
<!-- --- [red-module:node-red/core] --- -->
<script type="text/javascript">
  RED.nodes.registerType('inject', {});
  RED.nodes.registerType("debug", {});
</script>
<script type="text/html" data-help-name="inject">
  <p>Inject help</p>
</script>
<script type="text/html" data-help-name="debug">
  <p>Debug help</p>
</script>
`;

  const nodes = extractAvailableNodesFromHtml(html);

  assert.deepEqual(
    nodes.map((node) => node.name),
    ["inject", "debug"]
  );
  assert.equal(nodes[0].module, "node-red/core");
  assert.match(nodes[0].help, /Inject help/);
  assert.match(nodes[1].help, /Debug help/);
});

test("extractAvailableNodesFromHtml falls back when module marker is absent", () => {
  const nodes = extractAvailableNodesFromHtml(`
<script>RED.nodes.registerType('custom-node', {});</script>
<script data-help-name="custom-node">Custom help</script>
`);

  assert.deepEqual(nodes, [
    { name: "custom-node", help: "Custom help", module: "" },
  ]);
});
