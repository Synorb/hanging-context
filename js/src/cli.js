import { ask, latest, story, topics, HangingContextError, VERSION } from "./index.js";

const HELP = `hanging-context ${VERSION}
Stories for AI agents, with cited sources. Free. No key. https://hangingcontext.com

Usage:
  hanging-context ask "question" [--topic SLUG] [--days N] [--limit N] [--json]
  hanging-context latest [--topic SLUG] [--json]
  hanging-context story <date> <slug> [--md]
  hanging-context topics [--json]
  hanging-context --help | --version

Hanging Context, with provenance by Synorb.
`;

function parse(argv) {
  const pos = [];
  const flags = {};
  const withValue = new Set(["topic", "days", "limit"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      const k = eq === -1 ? a.slice(2) : a.slice(2, eq);
      if (withValue.has(k)) {
        const v = eq === -1 ? argv[++i] : a.slice(eq + 1);
        if (v === undefined) throw new Error(`--${k} needs a value.`);
        flags[k] = v;
      } else flags[k] = true;
    } else pos.push(a);
  }
  return { pos, flags };
}

/** Run the CLI. `write` receives each output line (defaults to stdout). */
export async function main(argv, { fetch: f, write } = {}) {
  const out = write || ((s) => process.stdout.write(s.endsWith("\n") ? s : s + "\n"));
  const asJson = (o) => out(JSON.stringify(o, null, 2));
  const { pos, flags } = parse(argv);
  const [cmd, ...rest] = pos;
  if (flags.version) return out(VERSION);
  if (flags.help || !cmd || cmd === "help") return out(HELP);
  const opts = {};
  if (f) opts.fetch = f;
  if (process.env.HC_BASE_URL) opts.baseUrl = process.env.HC_BASE_URL;

  if (cmd === "ask") {
    const o = { ...opts };
    if (flags.topic) o.topic = flags.topic;
    if (flags.days) o.days = Number(flags.days);
    if (flags.limit) o.limit = Number(flags.limit);
    const r = await ask(rest.join(" "), o);
    if (flags.json) return asJson(r);
    if (r.no_match || !(r.results || []).length) return out("No match in recent stories.");
    for (const x of r.results) {
      out(`- ${x.name}`);
      out(`  ${x.description}`);
      out(`  ${x.url}`);
      if ((x.manifest_ids || []).length) out(`  Manifests: ${x.manifest_ids.join(", ")}`);
    }
  } else if (cmd === "latest") {
    const r = await latest({ ...opts, ...(flags.topic ? { topic: flags.topic } : {}) });
    if (flags.json) return asJson(r);
    for (const s of r.stories || []) {
      out(`- ${s.headline}`);
      if (s.dek) out(`  ${s.dek}`);
      out(`  ${s.url}  (${s.source_count ?? "?"} sources)`);
    }
  } else if (cmd === "story") {
    if (rest.length !== 2) throw new Error("Usage: hanging-context story <date> <slug> [--md]");
    const r = await story(rest[0], rest[1], { ...opts, format: flags.md ? "md" : "json" });
    return flags.md ? out(r) : asJson(r);
  } else if (cmd === "topics") {
    const r = await topics(opts);
    if (flags.json) return asJson(r);
    for (const t of r) out(`${t.id}  ${t.title}`);
  } else {
    throw new Error(`Unknown command "${cmd}". Run hanging-context --help.`);
  }
}

export function reportError(err) {
  if (err instanceof HangingContextError) {
    process.stderr.write(`Error: ${err.message}${err.code ? ` (${err.code})` : ""}\n`);
    if (err.nextStep) process.stderr.write(`${err.nextStep}\n`);
  } else {
    process.stderr.write(`Error: ${err.message}\n`);
  }
}
