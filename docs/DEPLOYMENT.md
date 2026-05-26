# Deployment

## Arc Testnet

Set the required environment values:

```bash
cp .env.example .env
```

Required values:

```text
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
DEPLOYER_PRIVATE_KEY=...
AGENT_ADDRESS=...
COUNTERPARTY_ADDRESS=...
```

Check RPC connectivity:

```bash
pnpm arc:check
```

Deploy:

```bash
forge script packages/contracts/script/DeployArc.s.sol:DeployArc \
  --root packages/contracts \
  --rpc-url arc_testnet \
  --broadcast
```

The script deploys:

- `SpendAccountFactory`
- one `SpendAccount`
- default caps:
  - `10_000_000` base units per transaction = `10 USDC`
  - `50_000_000` base units per day = `50 USDC`

After deployment, fund the `SpendAccount` with Arc testnet USDC and allowlist demo counterparties before running the demo agent.

Configure caps and the demo counterparty:

```bash
SPEND_ACCOUNT_ADDRESS=0x... \
COUNTERPARTY_ADDRESS=0x... \
forge script packages/contracts/script/ConfigureDemo.s.sol:ConfigureDemo \
  --root packages/contracts \
  --rpc-url arc_testnet \
  --broadcast
```

Optional cap overrides are expressed in USDC base units:

```text
SPEND_PER_TX_CAP_BASE_UNITS=10000000
SPEND_DAILY_CAP_BASE_UNITS=50000000
COUNTERPARTY_DAILY_CAP_BASE_UNITS=20000000
```

Fund the account for the live demo:

```bash
SPEND_ACCOUNT_ADDRESS=0x... \
DEMO_FUND_AMOUNT_BASE_UNITS=50000000 \
forge script packages/contracts/script/FundSpendAccount.s.sol:FundSpendAccount \
  --root packages/contracts \
  --rpc-url arc_testnet \
  --broadcast
```

Run the live agent:

```bash
SPEND_ACCOUNT_ADDRESS=0x... \
AGENT_PRIVATE_KEY=0x... \
COUNTERPARTY_ADDRESS=0x... \
pnpm --filter sherpa-demo-agent start
```

Run the live dashboard:

```bash
VITE_SPEND_ACCOUNT_ADDRESS=0x... \
VITE_COUNTERPARTY_ADDRESS=0x... \
VITE_FROM_BLOCK=44000000 \
pnpm --filter sherpa-dashboard dev
```

## Vercel Dashboard Preview

The root `vercel.json` deploys only the dashboard app from the monorepo:

```text
Build command: pnpm --filter sherpa-dashboard build
Output: apps/dashboard/dist
```

Without `VITE_SPEND_ACCOUNT_ADDRESS`, the dashboard runs in preview mode. After
Arc deployment, add these Vercel environment variables and redeploy:

```text
VITE_ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
VITE_SPEND_ACCOUNT_ADDRESS=0x...
VITE_COUNTERPARTY_ADDRESS=0x...
VITE_FROM_BLOCK=...
```
