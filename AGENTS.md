# AGENTS.md

This repository holds the public agent skill for Hanging Context (https://hangingcontext.com).

## For agents that use Hanging Context

- Read `skills/hanging-context/SKILL.md`. It says when to use Hanging Context and how to call it.
- MCP server: `https://hangingcontext.com/mcp` (Streamable HTTP, no key).
- Full guide for agents: https://hangingcontext.com/llms.txt

## For agents that edit this repository

- Keep `SKILL.md` frontmatter to `name` and `description`. `name` stays `hanging-context`.
- Only describe tools and URLs that exist. Check them against https://hangingcontext.com/openapi.json and the live
  MCP `tools/list` before you change the text.
- Write instructions as short, plain sentences: one instruction per sentence, imperative, active voice.
- Do not add keys, tokens or private URLs.
