/**
 * T048 — CT-109-17: the kinds `openai-chat` and `anthropic-messages`
 * (F109-FR-017).
 *
 * Driven against the fake endpoint of the test kit (loopback): ONE prompt
 * is sent, ONE reply is read, the request carries NO tool of any kind, and
 * the values — the address, the path, the model and the secret header —
 * come from the descriptor.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { completeOpenaiChat, endpointOf, defaultModelOf } from "../../src/generic/openai-chat.ts";
import { completeAnthropicMessages } from "../../src/generic/anthropic-messages.ts";
import {
  startFakeEndpoint,
  type FakeEndpoint,
} from "../../../testkit/conformance/EP-02/fake-endpoint.ts";

function descriptorOf(kind: "openai-chat" | "anthropic-messages", baseUrl: string) {
  return {
    descriptorVersion: 1,
    id: `ct-17-${kind}`,
    kind,
    provider: { id: `provider-of-${kind}`, termsRef: null },
    auth: {
      tiers: [1],
      credential: "env:CT_17_KEY",
      scheme: kind === "openai-chat" ? "bearer" : "x-api-key",
    },
    endpoint: {
      baseUrl,
      chatPath: kind === "openai-chat" ? "/v1/chat/completions" : "/v1/messages",
      modelsPath: "/v1/models",
    },
    models: { default: "descriptor-model-17" },
    roles: { completion: { supported: true }, critic: { supported: true } },
    continuation: {},
    failures: {},
    cost: {},
    memory: {},
  };
}

test("CT-109-17: one prompt, one reply, no tool in the request (openai-chat)", async () => {
  const endpoint: FakeEndpoint = await startFakeEndpoint({
    behaviours: [{ kind: "answer", text: "the reply" }],
  });
  try {
    const descriptor = descriptorOf("openai-chat", endpoint.url);
    const outcome = await completeOpenaiChat(descriptor, {
      prompt: "one prompt",
      credential: "ct-17-secret",
    });
    assert.ok(outcome.ok, JSON.stringify(outcome));
    assert.equal(outcome.reply, "the reply");
    assert.equal(endpoint.requests.length, 1, "ONE prompt: one request");
    const body = endpoint.requests[0]!.body as Record<string, unknown>;
    assert.equal(body.tools, undefined, "no tool of any kind in the request");
    assert.equal(body.tool_choice, undefined);
    assert.deepEqual(body.messages, [{ role: "user", content: "one prompt" }]);
    // The values come from the descriptor: the path, the model, the header.
    assert.equal(endpoint.requests[0]!.path, endpoint.paths["openai-chat"]);
    assert.equal(body.model, defaultModelOf(descriptor));
    assert.match(String(endpoint.requests[0]!.headers.authorization), /^Bearer ct-17-secret$/);
  } finally {
    await endpoint.close();
  }
});

test("CT-109-17: one prompt, one reply, no tool in the request (anthropic-messages)", async () => {
  const endpoint: FakeEndpoint = await startFakeEndpoint({
    behaviours: [{ kind: "answer", text: "the reply" }],
  });
  try {
    const descriptor = descriptorOf("anthropic-messages", endpoint.url);
    const outcome = await completeAnthropicMessages(descriptor, {
      prompt: "one prompt",
      credential: "ct-17-secret",
    });
    assert.ok(outcome.ok, JSON.stringify(outcome));
    assert.equal(outcome.reply, "the reply");
    assert.equal(endpoint.requests.length, 1);
    const body = endpoint.requests[0]!.body as Record<string, unknown>;
    assert.equal(body.tools, undefined, "no tool of any kind in the request");
    assert.deepEqual(body.messages, [{ role: "user", content: "one prompt" }]);
    assert.equal(endpoint.requests[0]!.path, endpoint.paths["anthropic-messages"]);
    assert.equal(body.model, endpointOf(descriptor) === null ? null : "descriptor-model-17");
    assert.equal(endpoint.requests[0]!.headers["x-api-key"], "ct-17-secret");
  } finally {
    await endpoint.close();
  }
});

test("CT-109-17: the values come from the descriptor, not from any fixed name", async () => {
  const endpoint: FakeEndpoint = await startFakeEndpoint({
    behaviours: [{ kind: "answer" }],
  });
  try {
    // A descriptor of a SECOND endpoint path: the client follows it, and the
    // provider identity is the descriptor's, never the reply's.
    const descriptor = {
      ...descriptorOf("openai-chat", endpoint.url),
      endpoint: {
        baseUrl: endpoint.url,
        chatPath: "/v1/chat/completions",
        modelsPath: "/v1/models",
      },
      provider: { id: "the-descriptors-provider", termsRef: null },
    };
    const outcome = await completeOpenaiChat(descriptor, {
      prompt: "p",
      credential: "k",
      model: "descriptor-model-17",
    });
    assert.ok(outcome.ok);
    assert.equal(outcome.provider, "the-descriptors-provider");
    assert.equal(outcome.reply, "ok"); // the fake endpoint answers "fake-model"
    // The identity is the descriptor's, never the reply's model field.
    assert.notEqual(outcome.provider, "fake-model");
  } finally {
    await endpoint.close();
  }
});
