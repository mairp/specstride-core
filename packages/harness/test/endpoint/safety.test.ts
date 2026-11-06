/**
 * T050 — CT-109-18: the endpoint guard (F109-FR-018).
 *
 * A secret goes to its bound host only. A plain address is refused unless
 * it is loopback. A redirect is refused. The model list is a read request
 * that ends within 3 seconds. A secret never appears in an argument list.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_MODEL_LIST_MS,
  guardAddress,
  guardCredentialHost,
  guardRedirect,
  guardSecretOutOfArguments,
  listModels,
} from "../../src/endpoint/guard.ts";
import { completeOpenaiChat } from "../../src/generic/openai-chat.ts";
import {
  startFakeEndpoint,
  type FakeEndpoint,
} from "../../../testkit/conformance/EP-02/fake-endpoint.ts";

function descriptorAt(baseUrl: string, chatPath = "/v1/chat/completions") {
  return {
    descriptorVersion: 1,
    id: "ct-18-endpoint",
    kind: "openai-chat",
    provider: { id: "ct-18", termsRef: null },
    auth: { tiers: [1], credential: "env:CT_18_KEY", scheme: "bearer" },
    endpoint: { baseUrl, chatPath, modelsPath: "/v1/models" },
    models: { default: "m" },
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

test("CT-109-18: a secret goes to its bound host only", async () => {
  await withEndpoint([{ kind: "answer" }], async (endpoint) => {
    // Same host as the descriptor binds: the credential is attached.
    const same = await completeOpenaiChat(descriptorAt(endpoint.url), {
      prompt: "p",
      credential: "the-secret",
    });
    assert.ok(same.ok, JSON.stringify(same));
    assert.equal(endpoint.requests[0]!.headers.authorization, "Bearer the-secret");

    // A different host than the descriptor binds: refused BEFORE any send.
    const before = endpoint.requests.length;
    const cross = await completeOpenaiChat(descriptorAt("http://bound-host.invalid"), {
      prompt: "p",
      credential: "the-secret",
      endpointUrl: endpoint.url,
    });
    assert.equal(cross.ok, false);
    assert.ok(!cross.ok && cross.reason === "host-not-bound", JSON.stringify(cross));
    assert.equal(endpoint.requests.length, before, "nothing was sent to the other host");
    // Unit form, too: the guard refuses the crossing host on its own.
    assert.equal(guardCredentialHost("http://host-a:1", "http://host-b:2").ok, false);
    assert.equal(guardCredentialHost("http://host-a:1", "http://host-a:9").ok, true);
  });
});

test("CT-109-18: a plain address is refused unless it is loopback", () => {
  assert.equal(guardAddress("http://127.0.0.1:8080/v1").ok, true);
  assert.equal(guardAddress("http://[::1]:8080/v1").ok, true);
  assert.equal(guardAddress("http://localhost:8080/v1").ok, true);
  assert.equal(guardAddress("https://endpoint.example/v1").ok, true);
  const refused = guardAddress("http://10.1.2.3:8080/v1");
  assert.equal(refused.ok, false);
  assert.ok(!refused.ok && refused.reason === "plain-address");
});

test("CT-109-18: a redirect is refused", async () => {
  await withEndpoint(
    [{ kind: "redirect", location: "http://127.0.0.1:9/elsewhere" }],
    async (endpoint) => {
      const outcome = await completeOpenaiChat(descriptorAt(endpoint.url), {
        prompt: "p",
        credential: "the-secret",
      });
      assert.equal(outcome.ok, false);
      assert.ok(!outcome.ok && outcome.reason === "redirect", JSON.stringify(outcome));
      assert.equal(guardRedirect(302).ok, false);
      assert.equal(guardRedirect(307).ok, false);
      assert.equal(guardRedirect(200).ok, true);
    },
  );
});

test("CT-109-18: the model list is a read request of at most 3 seconds", async () => {
  await withEndpoint([{ kind: "answer", shape: "openai-chat" }], async (endpoint) => {
    const limit = Math.min(MAX_MODEL_LIST_MS, 3000);
    const result = await listModels({
      url: `${endpoint.url}/v1/models`,
      credential: "the-secret",
      scheme: "bearer",
      timeoutMs: limit,
    });
    assert.ok(result.ok, JSON.stringify(result));
    // A READ request: method GET.
    assert.equal(endpoint.requests[0]!.method, "GET");
    // The credential may ride along, and it ends within the limit.
    assert.ok(result.ok && result.tookMs <= limit);
    // The value of the list is handed to the caller only — here an array of
    // ids; it is never stored and never logged by the guard.
    assert.ok(result.ok && Array.isArray(result.models));
  });
});

test("CT-109-18: a model list that hangs ends inside the limit and is refused", async () => {
  await withEndpoint([{ kind: "hang" }], async (endpoint) => {
    const startedAt = Date.now();
    const result = await listModels({
      url: `${endpoint.url}/v1/models`,
      credential: "the-secret",
      timeoutMs: 100,
    });
    const took = Date.now() - startedAt;
    assert.equal(result.ok, false);
    assert.ok(!result.ok && result.reason === "model-list-timeout");
    assert.ok(took < 3000, `the read ended on its own after ${took} ms`);
  });
});

test("CT-109-18: no secret in an argument list", () => {
  assert.equal(guardSecretOutOfArguments("the-secret", ["--model", "m"]).ok, true);
  const refused = guardSecretOutOfArguments("the-secret", ["--key", "the-secret"]);
  assert.equal(refused.ok, false);
  assert.ok(!refused.ok && refused.reason === "secret-in-arguments");
  // The secret inside a value argument is refused too.
  assert.equal(guardSecretOutOfArguments("the-secret", ["--key=the-secret"]).ok, false);
});

test("CT-109-18: the 3-second limit is a ceiling, never raised", () => {
  assert.equal(MAX_MODEL_LIST_MS, 3000);
});
