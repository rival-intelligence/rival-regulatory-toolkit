# API Contract

The public contract is intentionally small and read-only.

## Source Model

Every response is grounded in a `RegulatorySource`:

- `id`
- `citation`
- `title`
- `sourceType`
- `url`
- `jurisdiction`
- `authority`
- optional corpus metadata such as `authoritySlug`, `sourceFamily`, `publicationDate`, and `effectiveDate`

## Endpoints

- `GET /api/v1/search`
- `GET /api/v1/sources/{source_id}`
- `GET /api/v1/citations/trace`
- `GET /api/v1/authorities`
- `GET /api/v1/filings/recent`

See [../openapi/rival-regulatory-api.yaml](../openapi/rival-regulatory-api.yaml).

## Why Read-Only First

Regulatory and compliance workflows should not start with autonomous mutation. The first public surface lets agents find sources, retrieve text, trace citations, and prepare reviewed work. Workspace actions stay behind managed Rival access and human gates.
