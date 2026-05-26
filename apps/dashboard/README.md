# Dashboard

The dashboard is the public audit surface for Sherpa Guardrails.

Current checkpoint mode:

- Shows the operator control plane for an agent spend account.
- Shows policy health, budget usage, counterparty state, and audit events.
- Shows approved spend, over-cap rejection, and blocked counterparty examples.
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

- Add wallet-connected operator actions for pause, revoke, and cap changes.
- Add chart history and event refresh polling.
