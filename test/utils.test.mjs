import assert from "node:assert/strict";
import test from "node:test";

import {
  buildNodeRedApiUrl,
  buildNodeRedAuthHeaders,
  parsePositiveInteger,
  readStructuredOrJsonArgument,
} from "../lib/utils.mjs";

test("buildNodeRedAuthHeaders prefers explicit auth header", () => {
  assert.deepEqual(
    buildNodeRedAuthHeaders({
      nodeRedAuthHeader: "Token custom",
      nodeRedBasicUser: "user",
      nodeRedBasicPassword: "pass",
      nodeRedToken: "bearer-token",
    }),
    { Authorization: "Token custom" }
  );
});

test("buildNodeRedAuthHeaders supports basic auth", () => {
  assert.deepEqual(
    buildNodeRedAuthHeaders({
      nodeRedBasicUser: "user",
      nodeRedBasicPassword: "pass",
    }),
    { Authorization: "Basic dXNlcjpwYXNz" }
  );
});

test("buildNodeRedApiUrl normalizes slashes and prefixes", () => {
  assert.equal(
    buildNodeRedApiUrl(
      { nodeRedUrl: "http://localhost:1880/", apiPrefix: "/api/v1/" },
      "/flows"
    ),
    "http://localhost:1880/api/v1/flows"
  );
});

test("readStructuredOrJsonArgument prefers structured input", () => {
  assert.deepEqual(
    readStructuredOrJsonArgument(
      { flows: [{ id: "tab-a" }], flowsJson: "[]" },
      "flows",
      "flowsJson"
    ),
    [{ id: "tab-a" }]
  );
});

test("readStructuredOrJsonArgument parses fallback JSON input", () => {
  assert.deepEqual(
    readStructuredOrJsonArgument({ flowsJson: "[{\"id\":\"tab-a\"}]" }, "flows", "flowsJson"),
    [{ id: "tab-a" }]
  );
});

test("parsePositiveInteger rejects invalid values", () => {
  assert.throws(() => parsePositiveInteger("0", "count"), /positive integer/);
  assert.throws(() => parsePositiveInteger("1.5", "count"), /positive integer/);
});
