/**
 * T047 — CT-109-104: characterization of the two completion clients as
 * extracted from Lisa at `363e6a3` (F109-FR-017).
 *
 * What the extraction must have kept: the request and reply shapes of the
 * two endpoint kinds. What it must have removed: every machine-specific
 * name and every fixed variable name — the address, the model and the
 * secret reference come from the descriptor now. What it must have fixed:
 * usage is NULL where the endpoint reports none, and no longer zero.
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
const SOURCES = {
  "openai-chat": readFileSync(join(HERE, "..", "..", "src", "generic", "openai-chat.ts"), "utf8"),
  "anthropic-messages": readFileSync(
    join(HERE, "..", "..", "src", "generic", "anthropic-messages.ts"),
    "utf8",
  ),
};

function descriptorOf(kind: "openai-chat" | "anthropic-messages", baseUrl: string) {
  return {
    descriptorVersion: 1,
    id: "ct-104-endpoint",
    kind,
    provider: { id: "ct-104-provider", termsRef: null },
    auth: {
      tiers: [1],
      credential: "env:CT_104_KEY",
      scheme: kind === "openai-chat" ? "bearer" : "x-api-key",
    },
    endpoint: {
      baseUrl,
      chatPath: kind === "openai-chat" ? "/v1/chat/completions" : "/v1/messages",
    },
    models: { default: "descriptor-model-104" },
    roles: { completion: { supported: true } },
    continuation: {},
    failures: {},
    cost: {},
    memory: {},
  };
}

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

test("CT-109-104: the request and reply shapes are the ones Lisa's clients kept", async () => {
  await withEndpoint([{ kind: "answer", text: "shape reply" }], async (endpoint) => {
    const openai = await completeOpenaiChat(descriptorOf("openai-chat", endpoint.url), {
      prompt: "the prompt",
      credential: "k",
    });
    assert.ok(openai.ok, JSON.stringify(openai));
    const openaiBody = endpoint.requests[0]!.body as Record<string, unknown>;
    // Request shape: one user message, no stream, nothing else of a tool.
    assert.deepEqual(openaiBody.messages, [{ role: "user", content: "the prompt" }]);
    assert.equal(openaiBody.stream, false);
    // Reply shape: the first choice's message content is the reply.
    assert.equal(openai.reply, "shape reply");
    // Usage from the endpoint's own accounting.
    assert.deepEqual(openai.usage, { inputTokens: 1, outputTokens: 1 });

    const anthropic = await completeAnthropicMessages(
      descriptorOf("anthropic-messages", endpoint.url),
      { prompt: "the prompt", credential: "k" },
    );
    assert.ok(anthropic.ok, JSON.stringify(anthropic));
    const anthropicBody = endpoint.requests[1]!.body as Record<string, unknown>;
    assert.deepEqual(anthropicBody.messages, [{ role: "user", content: "the prompt" }]);
    assert.equal(anthropicBody.stream, false);
    assert.equal(anthropic.reply, "shape reply");
    assert.deepEqual(anthropic.usage, { inputTokens: 1, outputTokens: 1 });
  });
});

test("CT-109-104: no machine-specific name and no fixed variable name", () => {
  // The clients read NO fixed variable name: the environment of the
  // consumer reaches a call only through the allow-list of the seam. And
  // they hold no name of a machine, a gateway or a model.
  for (const [kind, source] of Object.entries(SOURCES)) {
    assert.ok(!source.includes("process.env"), `${kind} reads a fixed variable name`);
  }
  const machineSpecific = [
    "api.openai.com",
    "api.anthropic.com",
    "localhost:",
    "127.0.0.1:",
    "0.0.0.0",
    "gpt-4",
    "gpt-5",
    "claude-3",
    "claude-sonnet",
    "sk-ant",
    "sk-proj",
  ];
  for (const [kind, source] of Object.entries(SOURCES)) {
    // Comments may cite the source commit; the code may name no machine.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
    for (const name of machineSpecific) {
      assert.ok(!code.includes(name), `${kind} names ${name}`);
    }
  }
});

test("CT-109-104: usage is null where the endpoint reports none", async () => {
  await withEndpoint(
    [
      { kind: "answer", omitUsage: true },
      { kind: "answer", omitUsage: true },
    ],
    async (endpoint) => {
      const openai = await completeOpenaiChat(descriptorOf("openai-chat", endpoint.url), {
        prompt: "p",
        credential: "k",
      });
      assert.ok(openai.ok);
      assert.equal(openai.usage, null, "usage is null, not zero, where none is reported");

      const anthropic = await completeAnthropicMessages(
        descriptorOf("anthropic-messages", endpoint.url),
        { prompt: "p", credential: "k" },
      );
      assert.ok(anthropic.ok);
      assert.equal(anthropic.usage, null, "usage is null, not zero, where none is reported");
    },
  );
});
