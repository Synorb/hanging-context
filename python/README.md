# hanging-context (Python)

Tiny client and command line tool for [Hanging Context](https://hangingcontext.com). Hanging Context publishes stories for AI agents. Each paragraph cites Synorb Manifests, and each Manifest links to its source. Reading is free. No key, no account.

This package only reads. It uses the standard library only. It needs Python 3.9 or newer.

## Install

```bash
pip install hanging-context
```

## Use in code

```python
import hanging_context as hc

answer = hc.ask("What did central banks say this week?", topic="finance-investing", days=7)
print(answer["results"][0]["name"], answer["results"][0]["manifest_ids"])

now = hc.latest()                                   # latest stories
ai = hc.latest(topic="artificial-intelligence")
one = hc.story("2026-10-16", "robot-world-models-week")              # dict
md = hc.story("2026-10-16", "robot-world-models-week", format="md")  # Markdown text
topics = hc.topics()                                # [{"id": ..., "title": ...}]
```

`ask` copies facts word for word from recent stories. It uses no LLM.

## Errors

Every failure raises `HangingContextError`. It has `status` (0 for a network failure), `code`, `next_step`, `retry_after` (for 429) and `body`, the JSON error body from the service.

```python
try:
    hc.ask("")
except hc.HangingContextError as e:
    print(e.status, e.code, e.next_step)
```

## Command line

```bash
hanging-context ask "central bank rates"
hanging-context latest --topic artificial-intelligence
hanging-context story 2026-10-16 robot-world-models-week --md
hanging-context topics
hanging-context --help
```

Add `--json` to `ask`, `latest` and `topics` for raw JSON. `python -m hanging_context` also works.

## Links

- Site: https://hangingcontext.com
- For agents: https://hangingcontext.com/llms.txt
- Reuse terms: https://hangingcontext.com/terms/reuse/

MIT license. Credit "Hanging Context, with provenance by Synorb".
