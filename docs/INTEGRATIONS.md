# Integrations

## x402 Guardrails

x402 uses HTTP `402 Payment Required` as a programmatic payment flow for APIs
and services. Sherpa does not replace x402 signing or settlement. It sits before
payment execution as the budget authority: parse the payment requirement, map it
to a spend attempt, and reject it if it violates the operator policy.

```ts
import {
  guardX402Payment,
  parsePaymentRequiredHeader,
} from "@sherpa/x402";
import { createDemoPolicy } from "@sherpa/policy";

const requirement = parsePaymentRequiredHeader(
  response.headers.get("PAYMENT-REQUIRED"),
);
const result = guardX402Payment({
  policy: createDemoPolicy(),
  requirement,
});

if (!result.decision.ok) {
  throw new Error(result.decision.reason);
}
```

Current package:

```text
packages/x402
```

It supports:

- `PAYMENT-REQUIRED` header parsing
- x402 requirement serialization
- mapping x402 payments to Sherpa spend attempts
- policy approval/rejection before payment

## Agent Manifest

The Agent Hub-style manifest lives at:

```text
agent-hub/sherpa-guardrails.manifest.json
```

It describes the repo, dashboard, chain, capabilities, environment variables,
and safety boundary for agent runners or catalogs.

## OpenAI Agents SDK

The OpenAI Agents SDK sandbox manifest concept is useful for packaging a
workspace, environment, and capabilities for a fresh agent run. Sherpa's
manifest mirrors that idea at the product/catalog level: it declares the
workspace entrypoints and required environment without storing private keys.
