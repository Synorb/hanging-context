# hanging-context (JavaScript)

Tiny client and command line tool for [Hanging Context](https://hangingcontext.com). Hanging Context publishes stories for AI agents. Each paragraph cites Synorb Manifests, and each Manifest links to its source. Reading is free. No key, no account.

This package only reads. It has no dependencies. It needs Node 18 or newer.

## Install

```bash
npm install hanging-context
```

## Use in code

```js
import { ask, latest, story, topics } from "hanging-context";

const answer = await ask("What did central banks say this week?", { topic: "finance-investing", days: 7 });
console.log(answer.results[0].name, answer.results[0].manifest_ids);

const now = await latest();                       // latest stories
const ai = await latest({ topic: "artificial-intelligence" });
const one = await story("2026-10-16", "robot-world-models-week");           // JSON
const md = await story("2026-10-16", "robot-world-models-week", { format: "md" }); // Markdown
const list = await topics();                      // [{ id, title, ... }]
```

`ask` copies facts word for word from recent stories. It uses no LLM.

## Errors

Every failure throws `HangingContextError`. It carries `status` (0 for a network failure), `code`, `nextStep`, `retryAfter` (for 429) and `body`, the JSON error body from the service.

```js
import { ask, HangingContextError } from "hanging-context";
try {
  await ask("");
} catch (e) {
  if (e instanceof HangingContextError) console.error(e.status, e.code, e.nextStep);
}
```

## Command line

```bash
npx hanging-context ask "central bank rates"
npx hanging-context latest --topic artificial-intelligence
npx hanging-context story 2026-10-16 robot-world-models-week --md
npx hanging-context topics
npx hanging-context --help
```

Add `--json` to `ask`, `latest` and `topics` for raw JSON.

## Options

Each function takes `baseUrl` and `fetch` options, for tests or a proxy.

## Links

- Site: https://hangingcontext.com
- For agents: https://hangingcontext.com/llms.txt
- Reuse terms: https://hangingcontext.com/terms/reuse/

MIT license. Credit "Hanging Context, with provenance by Synorb".
