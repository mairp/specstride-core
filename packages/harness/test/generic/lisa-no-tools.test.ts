/**
 * T046 — CT-109-103: characterization of Lisa's completion call (F109-FR-017).
 *
 * Lisa's completion call sent no tools and ran through no shell: the body
 * of a completion request carried no `tools` record of any kind, and the
 * call went straight over HTTP, never through a spawned shell. This test
 * pins that behavior in the extracted clients: whatever else changed in
 * the extraction, a completion call still carries no tool and no shell.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { completeOpenaiChat } from "../../src/generic/openai-chat.ts";
import { completeAnthropicMessages } from "../../src/generic/anthropic-messages.ts";
import {
  startFakeEndpoint,
  type FakeEndpoint,
} from "../../../testkit/conformance/EP-02/fake-endpoint.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const OPENAI_CHAT_SOURCE = readFileSync(
  join(HERE, "..", "..", "src", "generic", "openai-chat.ts"),
  "utf8",
);
const ANTHROPIC_SOURCE = readFileSync(
  join(HERE, "..", "..", "src", "generic", "anthropic-messages.ts"),
  "utf8",
);

const DESCRIPTOR = {
  descriptorVersion: 1,
  id: "ct-103-endpoint",
  kind: "openai-chat",
  provider: { id: "ct-103", termsRef: null },
  auth: { tiers: [1], credential: "env:CT_103", scheme: "bearer" },
  endpoint: { baseUrl: "placeholder", chatPath: "/v1/chat/completions" },
  models: { default: "descriptor-model" },
  roles: { completion: { supported: true } },
  continuation: {},
  failures: {},
  cost: {},
  memory: {},
};

async function withEndpoint(
  behaviours: Parameters<typeof startFakeEndpoint>[0]["behaviours"],
  run: (endpoint: FakeEndpoint) => Promise<void>,
): Promise<void> {
  const endpoint = await startFakeEndpoint({ behaviours });
  try {
    await run(endpoint);
  } finally {
    await endpoint.close();
  }
}

test("CT-109-103: a completion request carries no tools (openai-chat shape)", async () => {
  await withEndpoint([{ kind: "answer" }], async (endpoint) => {
    const outcome = await completeOpenaiChat(
      { ...DESCRIPTOR, endpoint: { ...DESCRIPTOR.endpoint, baseUrl: endpoint.url } },
      { prompt: "p", credential: "k" },
    );
    assert.ok(outcome.ok, JSON.stringify(outcome));
    const body = endpoint.requests[0]!.body as Record<string, unknown>;
    assert.equal(body.tools, undefined, "no tools in the request");
    assert.equal(body.tool_choice, undefined);
    assert.equal(body.functions, undefined);
    assert.equal(JSON.stringify(body).includes("tool"), false, "no tool of any kind");
  });
});

test("CT-109-103: a completion request carries no tools (anthropic-messages shape)", async () => {
  await withEndpoint([{ kind: "answer" }], async (endpoint) => {
    const outcome = await completeAnthropicMessages(
      {
        ...DESCRIPTOR,
        kind: "anthropic-messages",
        endpoint: { baseUrl: endpoint.url, chatPath: "/v1/messages" },
      },
      { prompt: "p", credential: "k" },
    );
    assert.ok(outcome.ok, JSON.stringify(outcome));
    const body = endpoint.requests[0]!.body as Record<string, unknown>;
    assert.equal(body.tools, undefined, "no tools in the request");
    assert.equal(JSON.stringify(body).includes("tool"), false, "no tool of any kind");
  });
});

test("CT-109-103: the completion call runs through no shell", () => {
  // Lisa's clients called the endpoint over HTTP from the process itself;
  // the extracted modules import no child-process module of any kind, so no
  // shell can be in the path of a completion call.
  for (const [name, source] of [
    ["openai-chat", OPENAI_CHAT_SOURCE],
    ["anthropic-messages", ANTHROPIC_SOURCE],
  ] as const) {
    for (const shell of [
      "node:child_process",
      "child_process",
      "node:spawn",
      "execSync",
      "spawnSync",
      "shell: true",
    ]) {
      assert.ok(
        !source.includes(shell),
        `${name} mentions ${shell}; a completion call runs through no shell`,
      );
    }
  }
});
