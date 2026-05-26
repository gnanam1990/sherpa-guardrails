# Dashboard

The dashboard is the public audit surface for Sherpa Guardrails.

Current checkpoint mode:

- Shows the $50/day cap story clearly.
- Shows one approved spend and one rejected overrun.
- Labels itself as preview mode until a live `SpendAccount` is deployed.
- Switches to live Arc mode when `VITE_SPEND_ACCOUNT_ADDRESS` is set.

Run locally:

```bash
pnpm --filter sherpa-dashboard dev
```

Live mode:

```bash
VITE_SPEND_ACCOUNT_ADDRESS=0x... \
VITE_COUNTERPARTY_ADDRESS=0x... \
VITE_FROM_BLOCK=44000000 \
pnpm --filter sherpa-dashboard dev
```

Optional environment:

```text
VITE_ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
VITE_SPEND_ACCOUNT_ADDRESS=0x...
VITE_COUNTERPARTY_ADDRESS=0x...
VITE_FROM_BLOCK=...
```

Next stage:

- Add direct explorer links for transactions and the account address.
- Add chart history and event refresh polling.
