// Hanging Context client. Zero dependencies. Needs a global fetch (Node 18+ or any browser).
export const VERSION = "0.1.0";
export const DEFAULT_BASE_URL = "https://hangingcontext.com";

/** Thrown for any non-2xx reply, network failure or bad input. */
export class HangingContextError extends Error {
  constructor(message, { status = 0, code = "", nextStep = "", body = null, retryAfter } = {}) {
    super(message);
    this.name = "HangingContextError";
    this.status = status;
    this.code = code;
    this.nextStep = nextStep;
    this.body = body;
    if (retryAfter !== undefined) this.retryAfter = retryAfter;
  }
}

function resolve(opts = {}) {
  const f = opts.fetch || globalThis.fetch;
  if (typeof f !== "function") throw new HangingContextError("No fetch available. Use Node 18 or newer.");
  return { f, base: String(opts.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "") };
}

async function request(path, opts, init = {}, as = "json") {
  const { f, base } = resolve(opts);
  const headers = { "User-Agent": `hanging-context-js/${VERSION}`, ...(init.headers || {}) };
  let res;
  try {
    res = await f(base + path, { ...init, headers });
  } catch (err) {
    throw new HangingContextError(`Network error: ${err && err.message ? err.message : err}`);
  }
  const text = await res.text();
  if (!res.ok) {
    let body = null;
    try { body = JSON.parse(text); } catch { /* not JSON */ }
    const b = body && typeof body === "object" ? body : {};
    throw new HangingContextError(b.message || `HTTP ${res.status}`, {
      status: res.status,
      code: b.error || "",
      nextStep: b.next_step || "",
      retryAfter: b.retry_after,
      body: body ?? text,
    });
  }
  if (as === "text") return text;
  try {
    return JSON.parse(text);
  } catch {
    throw new HangingContextError("The reply was not valid JSON.", { status: res.status, body: text });
  }
}

const JSON_HEADERS = { Accept: "application/json" };
const SLUG = /^[a-z0-9-]+$/;

function checkSlug(name, value) {
  if (typeof value !== "string" || !SLUG.test(value)) {
    throw new HangingContextError(`${name} must be lowercase letters, digits and hyphens.`);
  }
}

/**
 * Ask a question. The answer copies facts word for word from recent stories.
 * @param {string} question
 * @param {{topic?: string, days?: number, limit?: number, baseUrl?: string, fetch?: Function}} [opts]
 */
export async function ask(question, opts = {}) {
  if (typeof question !== "string" || !question.trim()) {
    throw new HangingContextError("The question is empty.");
  }
  const body = { query: question };
  if (opts.topic !== undefined) { checkSlug("topic", opts.topic); body.topic = opts.topic; }
  if (opts.days !== undefined) body.days = opts.days;
  if (opts.limit !== undefined) body.limit = opts.limit;
  return request("/ask", opts, {
    method: "POST",
    headers: { ...JSON_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Get the latest stories, or the recent stories of one topic. */
export async function latest(opts = {}) {
  if (opts.topic !== undefined) {
    checkSlug("topic", opts.topic);
    return request(`/n/${opts.topic}/index.json`, opts, { headers: JSON_HEADERS });
  }
  return request("/editions/latest.json", opts, { headers: JSON_HEADERS });
}

/**
 * Get one story. format "json" (default) returns an object; "md" returns Markdown text.
 * @param {string} date YYYY-MM-DD (UTC)
 * @param {string} slug
 */
export async function story(date, slug, opts = {}) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HangingContextError("date must look like YYYY-MM-DD.");
  }
  checkSlug("slug", slug);
  const format = opts.format || "json";
  if (format === "md") {
    return request(`/stories/${date}/${slug}/index.md`, opts, { headers: { Accept: "text/markdown" } }, "text");
  }
  if (format !== "json") throw new HangingContextError('format must be "json" or "md".');
  return request(`/stories/${date}/${slug}/index.json`, opts, { headers: JSON_HEADERS });
}

/** List the topics: [{id, title, url, json, description, beats}]. */
export async function topics(opts = {}) {
  const data = await latest({ ...opts, topic: undefined });
  return Array.isArray(data.newsrooms) ? data.newsrooms : [];
}
