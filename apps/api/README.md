# Sherpa API

Backend surface for the Sherpa Guardrails product.

Run locally:

```bash
pnpm --filter @sherpa/api dev
```

Routes:

```text
GET  /health
GET  /policy/demo
POST /policy/evaluate
POST /simulate/demo
POST /simulate
POST /x402/guard
```

The API is intentionally lightweight for the hackathon sprint. It exposes the
same policy and simulation logic used by the demo and can be replaced with a
Fastify/Railway service when the live deployment is ready.
