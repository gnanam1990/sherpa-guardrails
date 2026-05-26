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
