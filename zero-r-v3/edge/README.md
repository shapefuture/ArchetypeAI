# Cloudflare edge

Deploy from repository root with Wrangler after configuring the Cloudflare account. The Worker serves `dist/` via the Assets binding and exposes:

- `GET /health`
- `POST /api/sync`

`/api/sync` stores bounded event batches in a SQLite-backed Durable Object. The browser sends these events asynchronously; local state remains authoritative for immediate interaction.
