<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ArchetypeAI

Angular frontend + Cloudflare Worker AI backend.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Start the frontend:
   `npm run dev`
3. Make sure `/api/ai` is available
   - In production this is served by `worker.ts`
   - For local AI access, run the worker with the required secrets below or proxy `/api/ai` to a deployed worker

## Worker Secrets

The AI router in [`worker.ts`](worker.ts) requires these Cloudflare secrets:

```text
GOOGLE_API_KEY
OPENROUTER_API_KEY
NVIDIA_API_KEY
OLLAMA_API_KEY
OPENROUTER_MODEL
```

Use `wrangler secret put <NAME>` for each secret in the Cloudflare environment.

## Verify

```bash
npm run build
npm test
```
