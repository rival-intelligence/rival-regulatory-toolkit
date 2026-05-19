# Contributing

Thanks for helping improve Rival Regulatory Toolkit.

## Local Setup

```sh
npm install
npm run build
npm test
```

## Pull Requests

- Keep the public contract read-only unless a maintainer explicitly approves a broader design.
- Add or update schemas when response shapes change.
- Add fixture coverage for new tool behavior.
- Do not include customer data, private source packs, credentials, or internal Rival workspace code.

## Design Principles

- Source-first: every useful response should point back to source material.
- Citation-aware: agent outputs should be traceable.
- Human-gated: this toolkit should not perform external regulatory actions.
- Deployment-friendly: teams should be able to run it in controlled environments.
