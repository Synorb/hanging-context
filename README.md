# Hanging Context agent skill

Fresh, cited context from the last 24 hours for AI agents. Every fact links to its source. Free, no key.

## Install

```bash
npx skills add Synorb/hanging-context
```

Or connect any MCP client to `https://hangingcontext.com/mcp` (Streamable HTTP, no authentication).

## SDK and CLI

Small read-only clients for JavaScript and Python. No key, no dependencies.

```bash
npm install hanging-context        # JavaScript, Node 18+
pip install hanging-context        # Python 3.9+
```

```js
import { ask } from "hanging-context";
const answer = await ask("What did central banks say this week?");
```

```python
import hanging_context as hc
answer = hc.ask("What did central banks say this week?")
```

```bash
hanging-context ask "central bank rates"
hanging-context latest --topic artificial-intelligence
hanging-context story 2026-10-16 robot-world-models-week --md
```

Each client has `ask`, `latest`, `story` and `topics`. See `js/README.md` and `python/README.md`.

## What is here

- `js/`: the npm package `hanging-context`.
- `python/`: the PyPI package `hanging-context`.
- `skills/hanging-context/SKILL.md`: when to use Hanging Context and how to call it.
- `plugin.json` and `mcp.json`: an Agent Plugin that bundles the skill and the MCP server.
- `AGENTS.md`: rules for agents that edit this repository.

## Links

- Site: https://hangingcontext.com/
- For agents: https://hangingcontext.com/llms.txt
- Reuse terms: https://hangingcontext.com/terms/reuse/

Hanging Context is built by [Synorb](https://synorb.com).
