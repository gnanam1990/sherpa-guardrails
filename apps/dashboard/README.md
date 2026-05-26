# Dashboard

The dashboard is the public audit surface for Sherpa Guardrails.

Current checkpoint mode:

- Shows the $50/day cap story clearly.
- Shows one approved spend and one rejected overrun.
- Labels itself as preview mode until a live `SpendAccount` is deployed.

Run locally:

```bash
pnpm --filter sherpa-dashboard dev
```

Next stage:

- Read `SpendExecuted` and `SpendRejected` from Arc Testnet.
- Replace preview data with live contract events.
- Add direct explorer links for transactions and the account address.
