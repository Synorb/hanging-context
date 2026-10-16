import test from "node:test";
import assert from "node:assert/strict";
import { ask, latest, story, topics, HangingContextError } from "../src/index.js";
import { main } from "../src/cli.js";

function mock(status, body, calls = []) {
  const f = async (url, init) => {
    calls.push({ url, init });
    const text = typeof body === "string" ? body : JSON.stringify(body);
    return { ok: status >= 200 && status < 300, status, text: async () => text };
  };
  return f;
}

test("ask posts the question with topic and days", async () => {
  const calls = [];
  const r = await ask("rates", { topic: "finance-investing", days: 3, fetch: mock(200, { query: "rates", results: [] }, calls) });
  assert.equal(r.query, "rates");
  assert.equal(calls[0].url, "https://hangingcontext.com/ask");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { query: "rates", topic: "finance-investing", days: 3 });
});

test("ask rejects an empty question without a request", async () => {
  const calls = [];
  await assert.rejects(ask("  ", { fetch: mock(200, {}, calls) }), HangingContextError);
  assert.equal(calls.length, 0);
});

test("errors carry the JSON error body", async () => {
  const body = { error: "empty_question", message: "The question is empty.", next_step: "Send a question." };
  await assert.rejects(
    ask("x", { fetch: mock(400, body) }),
    (e) => e instanceof HangingContextError && e.status === 400 && e.code === "empty_question" &&
      e.nextStep === "Send a question." && e.body.error === "empty_question",
  );
});

test("429 keeps retry_after", async () => {
  await assert.rejects(
    ask("x", { fetch: mock(429, { error: "rate_limited", message: "Slow down.", retry_after: 30 }) }),
    (e) => e.status === 429 && e.retryAfter === 30,
  );
});

test("non-JSON error body is kept as text", async () => {
  await assert.rejects(latest({ fetch: mock(502, "<html>bad gateway</html>") }), (e) => e.status === 502 && e.body.includes("bad gateway"));
});

test("network failure becomes HangingContextError", async () => {
  const f = async () => { throw new Error("boom"); };
  await assert.rejects(latest({ fetch: f }), (e) => e instanceof HangingContextError && e.status === 0);
});

test("latest and topic urls", async () => {
  const calls = [];
  await latest({ fetch: mock(200, { stories: [] }, calls) });
  await latest({ topic: "artificial-intelligence", fetch: mock(200, { stories: [] }, calls) });
  assert.equal(calls[0].url, "https://hangingcontext.com/editions/latest.json");
  assert.equal(calls[1].url, "https://hangingcontext.com/n/artificial-intelligence/index.json");
});

test("latest rejects a bad topic slug", async () => {
  await assert.rejects(latest({ topic: "../etc", fetch: mock(200, {}) }), HangingContextError);
});

test("story json and md", async () => {
  const calls = [];
  const j = await story("2026-10-16", "a-b", { fetch: mock(200, { slug: "a-b" }, calls) });
  const m = await story("2026-10-16", "a-b", { format: "md", fetch: mock(200, "# hi", calls) });
  assert.equal(j.slug, "a-b");
  assert.equal(m, "# hi");
  assert.equal(calls[0].url, "https://hangingcontext.com/stories/2026-10-16/a-b/index.json");
  assert.equal(calls[1].url, "https://hangingcontext.com/stories/2026-10-16/a-b/index.md");
});

test("story validates date", async () => {
  await assert.rejects(story("yesterday", "a", { fetch: mock(200, {}) }), HangingContextError);
});

test("topics reads newsrooms", async () => {
  const t = await topics({ fetch: mock(200, { newsrooms: [{ id: "x", title: "X" }] }) });
  assert.deepEqual(t, [{ id: "x", title: "X" }]);
});

test("baseUrl override", async () => {
  const calls = [];
  await latest({ baseUrl: "http://localhost:9/", fetch: mock(200, {}, calls) });
  assert.equal(calls[0].url, "http://localhost:9/editions/latest.json");
});

test("cli topics and help", async () => {
  const lines = [];
  await main(["topics"], { fetch: mock(200, { newsrooms: [{ id: "ai", title: "AI" }] }), write: (s) => lines.push(s) });
  assert.equal(lines[0], "ai  AI");
  const h = [];
  await main(["--help"], { write: (s) => h.push(s) });
  assert.match(h[0], /Usage:/);
  const v = [];
  await main(["--version"], { write: (s) => v.push(s) });
  assert.equal(v[0], "0.1.0");
});

test("cli ask prints results", async () => {
  const lines = [];
  const body = { results: [{ name: "N", description: "D", url: "U", manifest_ids: ["1"] }] };
  await main(["ask", "central", "banks", "--days=2"], { fetch: mock(200, body), write: (s) => lines.push(s) });
  assert.deepEqual(lines, ["- N", "  D", "  U", "  Manifests: 1"]);
});

test("cli unknown command throws", async () => {
  await assert.rejects(main(["nope"], { write() {} }), /Unknown command/);
});
