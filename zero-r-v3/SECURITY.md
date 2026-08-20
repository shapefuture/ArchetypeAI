# Security

- No remote script dependencies.
- CSP is included in the app shell.
- Private reflections are stored locally.
- Network synchronization is asynchronous and optional.
- Only application-owned immutable assets should be promoted to shared caches.
- Irreversible/privileged effects are not represented in this MVP.
- Cloudflare Durable Object synchronization is idempotent at the event-batch layer; production deployments should add authenticated session IDs and retention policies.
