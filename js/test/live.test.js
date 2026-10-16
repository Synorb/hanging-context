import test from "node:test";
import assert from "node:assert/strict";
import { ask, latest, story, topics, HangingContextError } from "../src/index.js";

const live = process.env.HC_LIVE === "1" ? {} : { skip: "set HC_LIVE=1 to run against hangingcontext.com" };

test("live smoke", live, async () => {
  const l = await latest();
  assert.ok(l.stories.length > 0);
  const t = await topics();
  assert.ok(t.length > 0);
  const tl = await latest({ topic: t[0].id });
  assert.ok(Array.isArray(tl.stories));
  const first = l.stories[0];
  const date = first.url.match(/stories\/(\d{4}-\d{2}-\d{2})\//)[1];
  const s = await story(date, first.slug);
  assert.equal(s.slug, first.slug);
  const md = await story(date, first.slug, { format: "md" });
  assert.match(md, /^---/);
  const a = await ask("central bank rates", { days: 7 });
  assert.ok("results" in a);
  await assert.rejects(story("2000-01-01", "no-such-story"), (e) => e instanceof HangingContextError && e.status === 404);
});
