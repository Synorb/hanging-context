# Hanging Context: News For Agents (MCP server)

A free, remote MCP server that gives AI agents fresh, cited context from the last 24 hours. Every fact links to its source. No key, no sign-up.

- **Endpoint:** `https://hangingcontext.com/mcp`
- **Transport:** Streamable HTTP
- **Authentication:** none

## Connect

```json
{
  "mcpServers": {
    "hanging-context": {
      "type": "streamable-http",
      "url": "https://hangingcontext.com/mcp"
    }
  }
}
```

The same config is in [`../mcp.json`](../mcp.json).

## Tools

| Tool | What it does |
|------|--------------|
| `hc_ask` | Answer a question in plain words with facts copied word for word from stories. Each fact lists its Manifest ids. |
| `hc_get_story` | Read a whole story by its slug. |
| `hc_sources` | List the Manifest ids and source links behind a story. |
| `hc_since` | Get only the stories that are new since your last `cursor`. |
| `hc_latest` | Browse the newest stories, optionally by topic. |
| `hc_search` | Search stories. |
| `hc_topics` | List the topic ids. |
| `hc_about` | Describe the server and how to use it. |

## Also an agent skill

For hosts that load skills, see [`../skills/hanging-context/SKILL.md`](../skills/hanging-context/SKILL.md).

Built on [Synorb](https://synorb.com).
