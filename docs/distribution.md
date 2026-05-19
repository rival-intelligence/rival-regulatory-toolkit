# Distribution Plan

The goal is for agents and developers to find the toolkit through the places they already search: package registries, MCP registries, GitHub, docs crawlers, and agent setup examples.

## Required Before Registry Submission

1. Keep `package.json` `mcpName` aligned with `server.json` `name`.
2. Keep `server.json` version aligned with `package.json` version.
3. Confirm the source install can run with:

   ```sh
   RIVAL_FIXTURE_MODE=true npx -y github:rival-intelligence/rival-regulatory-toolkit mcp
   ```

4. Publish the npm package as `@rival-intelligence/regulatory-toolkit` when npm org access is available.
5. Confirm the package can run with:

   ```sh
   npx -y @rival-intelligence/regulatory-toolkit mcp
   ```

## Primary Channels

### npm

Publish the package publicly:

```sh
npm publish --access public
```

This makes the server installable by most MCP clients through `npx`.

### Official MCP Registry

The official registry is the canonical metadata layer for public MCP servers. It requires:

- a public package or public remote server
- `mcpName` in `package.json` for npm verification
- `server.json` in the repo

Publish with `mcp-publisher` after the npm package exists.

### GitHub Topics

Use topics that agents and directories can crawl:

- `mcp`
- `model-context-protocol`
- `ai-agents`
- `regulatory-compliance`
- `regtech`
- `cfr`
- `federal-register`
- `energy`
- `critical-infrastructure`

### MCP Aggregators

Submit the GitHub repo to major aggregators after npm is live:

- Glama
- Smithery
- PulseMCP
- MCP Find

Aggregators index tool names, descriptions, input schemas, package metadata, and repository quality signals.

## Website Updates

Update `tryrival.ai/for-agents` to include:

- GitHub repo link
- `npx -y @rival-intelligence/regulatory-toolkit mcp`
- fixture-mode example
- safety boundary: read-only source retrieval, managed API access for production

Update `tryrival.ai/llms.txt` to include:

- the repo URL
- tool names
- public install command
- API access status

## Launch Checklist

- [ ] Publish npm package.
- [ ] Create GitHub release `v0.1.0`.
- [ ] Publish to official MCP Registry.
- [ ] Submit to Glama.
- [ ] Submit to Smithery.
- [ ] Add repo link to `/for-agents`.
- [ ] Add repo link to `llms.txt`.
- [ ] Post concise launch note with the fixture-mode command.
