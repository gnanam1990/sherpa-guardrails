# Demo Agent

The demo agent shows the core Sherpa Guardrails story:

```text
Spend 8 USDC -> approved
Spend 60 USDC -> rejected by cap
```

Run a labeled dry-run preview:

```bash
pnpm --filter sherpa-demo-agent start -- --dry-run
```

Run against a live Arc Testnet `SpendAccount`:

```bash
SPEND_ACCOUNT_ADDRESS=0x... \
AGENT_PRIVATE_KEY=0x... \
COUNTERPARTY_ADDRESS=0x... \
pnpm --filter sherpa-demo-agent start
```

The live mode calls `requestSpend` through the TypeScript SDK. Over-limit
payments return a typed rejection and move no funds.
