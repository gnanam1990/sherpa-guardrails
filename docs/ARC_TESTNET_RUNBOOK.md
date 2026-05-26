# Arc Testnet Runbook

This is the live Sherpa path for the hackathon demo.

## Goal

Deploy one `SpendAccount` on Arc Testnet, fund it with testnet USDC, allowlist
one x402-style counterparty, then run the demo agent against real contract
policy.

## Testnet Facts

```text
Chain: Arc Testnet
Chain ID: 5042002
RPC: https://rpc.testnet.arc.network
Explorer: https://testnet.arcscan.app
USDC ERC-20 interface: 0x3600000000000000000000000000000000000000
Native gas token: USDC, 18 decimals
ERC-20 USDC interface: 6 decimals
```

Sherpa uses the ERC-20 interface for spend accounting and transfers. The deployer
also needs native USDC on Arc to pay gas.

## 1. Create Local Wallets

```bash
pnpm wallets:demo
```

Copy the generated values into `.env`. Do not commit `.env`.

## 2. Fund The Deployer

Fund the printed `OPERATOR_ADDRESS` with Arc Testnet USDC. This address pays gas
and funds the demo spend account.

## 3. Check Status

```bash
pnpm testnet:status
```

This checks RPC connectivity, chain ID, deployer/agent env values, native gas
balance, ERC-20 USDC balance, deployed spend account state, and live demo
readiness.

## 4. Deploy

```bash
pnpm testnet:deploy
```

Copy the printed `SpendAccount` into `.env`:

```text
SPEND_ACCOUNT_ADDRESS=0x...
```

## 5. Configure

```bash
pnpm testnet:configure
```

Defaults:

```text
Per transaction cap: 10 USDC
Daily cap: 50 USDC
Counterparty daily cap: 20 USDC
```

## 6. Fund The Spend Account

```bash
pnpm testnet:fund
```

Default funding:

```text
50 USDC in `.env.example`
```

For faucet-funded demos, set `DEMO_FUND_AMOUNT_BASE_UNITS=10000000` in `.env`
to fund 10 USDC. The live demo only needs 8 USDC for the approved spend; the
over-cap and blocked-vendor attempts are rejected before funds move.

## 7. Run The Agent

```bash
pnpm testnet:agent
```

Expected demo:

```text
Pay 8 USDC to x402 provider -> approved on-chain
Pay 60 USDC to x402 provider -> rejected on-chain before settlement
Pay unknown vendor -> blocked on-chain by policy
```

## 8. Run The Dashboard

```bash
pnpm testnet:dashboard
```

For Vercel, set:

```text
VITE_ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
VITE_SPEND_ACCOUNT_ADDRESS=0x...
VITE_COUNTERPARTY_ADDRESS=0x...
VITE_FROM_BLOCK=...
```

## Demo Proof Checklist

- ArcScan contract address visible.
- `SpendExecuted` event visible for the approved 8 USDC spend.
- `SpendRejected` event visible for the 60 USDC overrun.
- Dashboard shows live mode instead of preview mode.
- `pnpm testnet:status` shows funded account and ready agent signer.
