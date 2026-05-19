# Self-Hosting The MCP Server

The toolkit ships a Docker image for teams that need to run agent tools inside controlled environments.

## Runtime Modes

Production mode:

```sh
docker run --rm -i \
  -e RIVAL_API_KEY="$RIVAL_API_KEY" \
  -e RIVAL_API_BASE_URL="https://api.tryrival.ai" \
  rival-regulatory-toolkit
```

Fixture mode:

```sh
docker run --rm -i \
  -e RIVAL_FIXTURE_MODE=true \
  rival-regulatory-toolkit
```

## Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `RIVAL_API_KEY` | Production | Managed Rival API key. |
| `RIVAL_API_BASE_URL` | No | Defaults to `https://api.tryrival.ai`. |
| `RIVAL_FIXTURE_MODE` | No | Set to `true` to use local fixtures. |
| `RIVAL_FIXTURE_PATH` | No | Path to a JSONL fixture corpus. |

## Network Notes

The MCP server only needs outbound HTTPS access to `api.tryrival.ai` in production mode. It does not require inbound network access when used over stdio by local agent clients.

## Security Boundary

The first release is read-only. The MCP server does not submit filings, write workspace records, delete evidence, or take external regulatory actions.
