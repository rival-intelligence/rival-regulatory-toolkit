# Rival Regulatory Toolkit

Open-source SDK, CLI, MCP server, and schemas for connecting AI agents to Rival's source-grounded regulatory retrieval API.

- Public site: https://tryrival.ai
- Agent access: https://tryrival.ai/for-agents
- Managed API default: `https://api.tryrival.ai`

This repository is the developer and agent connectivity layer for Rival. It is intentionally read-only in its first release: agents can search, retrieve source text, trace citations, list authorities, and inspect recent filings. Workspace actions, document review, evidence requests, filings, and task creation remain behind managed Rival access and human review gates.

## What Is Included

- OpenAPI contract for Rival's read-only regulatory retrieval API.
- JSON Schemas for source documents, search results, citations, authorities, and recent filings.
- TypeScript client for server-side applications and internal tools.
- CLI for shell usage and automation.
- MCP server for agent clients that support Model Context Protocol.
- Fixture mode so teams can evaluate the integration without a Rival API key.
- Dockerfile for running the MCP server in controlled team environments.

## Install

```sh
npm install @rival-intelligence/regulatory-toolkit
```

For local development from source:

```sh
npm install
npm run build
```

## Environment

```sh
export RIVAL_API_KEY="rv_live_..."
export RIVAL_API_BASE_URL="https://api.tryrival.ai"
```

For local evaluation without API access:

```sh
export RIVAL_FIXTURE_MODE=true
```

## TypeScript Client

```ts
import { RivalRegulatoryClient } from '@rival-intelligence/regulatory-toolkit';

const rival = new RivalRegulatoryClient({
  apiKey: process.env.RIVAL_API_KEY,
});

const results = await rival.searchRegulatoryCorpus({
  query: '49 CFR 195.573',
  limit: 5,
});

console.log(results.results[0]?.source.citation);
```

## CLI

```sh
rival-regulatory search "49 CFR 195.573"
rival-regulatory source "cfr-49-195-573"
rival-regulatory trace "49 CFR 195.573"
rival-regulatory authorities
```

Fixture mode:

```sh
rival-regulatory search "pipeline corrosion" --fixture
```

## MCP Server

Run directly:

```sh
npx @rival-intelligence/regulatory-toolkit mcp
```

Claude Desktop example:

```json
{
  "mcpServers": {
    "rival-regulatory": {
      "command": "npx",
  "args": ["-y", "@rival-intelligence/regulatory-toolkit", "mcp"],
      "env": {
        "RIVAL_API_KEY": "rv_live_...",
        "RIVAL_API_BASE_URL": "https://api.tryrival.ai"
      }
    }
  }
}
```

Available MCP tools:

- `search_regulatory_corpus`
- `retrieve_source_text`
- `trace_citation`
- `list_authorities`
- `get_recent_filings`

## Docker

Docker belongs in this repository because many compliance, legal, consulting, energy, and infrastructure teams will run agent tools inside controlled environments. The image runs the MCP server and reads credentials from environment variables.

```sh
docker build -t rival-regulatory-toolkit .
docker run --rm -i \
  -e RIVAL_API_KEY="$RIVAL_API_KEY" \
  -e RIVAL_API_BASE_URL="https://api.tryrival.ai" \
  rival-regulatory-toolkit
```

Fixture mode:

```sh
docker run --rm -i -e RIVAL_FIXTURE_MODE=true rival-regulatory-toolkit
```

See [docs/self-hosting.md](docs/self-hosting.md) for deployment notes.

## API Contract

The API contract starts with five read-only endpoints:

- `GET /api/v1/search`
- `GET /api/v1/sources/{source_id}`
- `GET /api/v1/citations/trace`
- `GET /api/v1/authorities`
- `GET /api/v1/filings/recent`

The contract lives in [openapi/rival-regulatory-api.yaml](openapi/rival-regulatory-api.yaml).

## Safety Boundary

This toolkit does not submit filings, alter compliance records, close corrective actions, delete evidence, or take workspace actions. It is a source retrieval and citation layer for agents and developer systems. Regulated work still requires qualified human review.

This toolkit is not legal, engineering, environmental, safety, or compliance advice. Teams are responsible for validating applicability, obligations, filings, and operational decisions with qualified professionals.

## Development

```sh
npm install
npm run build
npm test
```

## License

Apache-2.0
