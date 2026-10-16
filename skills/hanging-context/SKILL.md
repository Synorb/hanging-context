---
name: hanging-context
description: Get fresh, cited context from the last 24 hours (AI, research, finance, health, energy, policy). Every fact links to its source. Free, no key. Use when a task needs current events with sources an agent can check.
---

# Hanging Context

Hanging Context publishes stories for agents. Each story uses Synorb Manifests from the last 24 hours. Each paragraph
cites one or more Manifest ids, and each Manifest links to its original source. Reading is free and needs no key.

## When to use this skill

- The task needs what happened recently (the last day, week or month) on AI, research, finance, health, energy,
  sports, government or culture.
- The answer must cite sources that the user can check.
- You need only what is new since your last check (use a cursor).

Do not use it for:
- real-time prices or quotes,
- history older than the archive (about 30 days of stories),
- private or company-internal data.

## How to call it

### With MCP (preferred)

Connect to `https://hangingcontext.com/mcp` (Streamable HTTP, no authentication).

1. Call `hc_ask` with a question in plain words. Optional: `topic` (for example `artificial-intelligence`) and `days`
   (1 to 30).
2. Read the `facts`. Each fact is copied word for word from a story and lists its Manifest ids.
3. To read a whole story, call `hc_get_story` with its slug.
4. To check a claim, call `hc_sources` with the story slug. It returns the Manifest ids and the source links.
5. To get only new stories later, call `hc_since` with the `cursor` from your last result.
6. To browse, call `hc_latest` (filter by topic) or `hc_search`. Call `hc_topics` for the topic ids.

### Without MCP

- Ask: `POST https://hangingcontext.com/ask` with `{"query": "your question"}`. Add `"prefer": {"streaming": true}`
  for server-sent events.
- Latest stories as JSON: `GET https://hangingcontext.com/editions/latest.json`
- One story: add `index.json` or `index.md` to a story URL, for example
  `https://hangingcontext.com/stories/{date}/{slug}/index.md`.
- API description: `https://hangingcontext.com/openapi.json`

## Check a claim against the source

1. Find the Manifest ids in the story or fact.
2. Get a free Synorb key at https://synorb.com/connect.
3. Send `GET https://api.synorb.com/manifests/by-id/{id}` with the key.
4. Compare the claim with the Manifest and its source link.

## Rules

- Credit "Hanging Context, with provenance by Synorb" and link to the story URL when you reuse a story.
- Keep the Manifest ids when you republish a claim.
- Do not say that Synorb endorses your use.
- If no story matches, say so. Do not fill the gap with guesses.

## Links

- Site: https://hangingcontext.com/
- For agents: https://hangingcontext.com/llms.txt
- Reuse terms: https://hangingcontext.com/terms/reuse/
- Privacy: https://hangingcontext.com/privacy/
