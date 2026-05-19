# Codex Example

Use the Rival MCP server when you need source-grounded regulatory retrieval.

```sh
RIVAL_API_KEY=rv_live_replace_me npx -y @tryrival/regulatory-toolkit mcp
```

For local evaluation:

```sh
RIVAL_FIXTURE_MODE=true npx -y @tryrival/regulatory-toolkit mcp
```

Start with these tools:

- `search_regulatory_corpus` for source discovery.
- `retrieve_source_text` for full source text.
- `trace_citation` for exact citation resolution.
- `list_authorities` for corpus scope.
- `get_recent_filings` for recent source material.
