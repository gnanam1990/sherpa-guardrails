# Demo Script

## 90-Second Walkthrough

### 0-10s: Problem

AI agents are starting to move money, but most teams still protect agent spend
with normal wallet permissions or app-layer budget checks. That is risky once an
agent is autonomous.

### 10-25s: Product

Sherpa Guardrails is a corporate-card-style spend manager for agents. The
operator funds a USDC spend account, sets hard caps, and gives the agent only a
limited spender key.

### 25-45s: Contract Proof

Show the contract tests passing. Explain that the contract enforces:

- 10 USDC per-transaction cap
- 50 USDC daily cap
- per-counterparty daily cap
- pause and revoke controls
- typed rejection reasons

### 45-65s: Agent Demo

Run the demo agent. It receives plain-English payment intents, parses each one
into amount/counterparty/action, then checks Sherpa policy. The first request
spends 8 USDC and is approved. The second tries 60 USDC and is rejected. The
third tries an unknown vendor and is blocked.

```bash
pnpm --filter sherpa-demo-agent start -- --dry-run
```

### 65-80s: Dashboard

Show the dashboard. It displays the budget state, the approved spend, the
rejected overrun, and the target Arc Testnet account details.

```bash
pnpm --filter sherpa-dashboard dev
```

### 80-90s: Close

Sherpa is not just telling the agent to behave. It makes the budget the
settlement rule. If the spend violates policy, the USDC transfer cannot happen.

## Live Demo Commands

```bash
pnpm arc:check
pnpm contracts:test
pnpm --filter @sherpa/guardrails test
pnpm --filter sherpa-demo-agent start -- --dry-run
pnpm --filter sherpa-dashboard dev
```

After Arc deployment:

```bash
SPEND_ACCOUNT_ADDRESS=0x... \
COUNTERPARTY_ADDRESS=0x... \
forge script packages/contracts/script/ConfigureDemo.s.sol:ConfigureDemo \
  --root packages/contracts \
  --rpc-url arc_testnet \
  --broadcast

SPEND_ACCOUNT_ADDRESS=0x... \
DEMO_FUND_AMOUNT_BASE_UNITS=50000000 \
forge script packages/contracts/script/FundSpendAccount.s.sol:FundSpendAccount \
  --root packages/contracts \
  --rpc-url arc_testnet \
  --broadcast

SPEND_ACCOUNT_ADDRESS=0x... \
AGENT_PRIVATE_KEY=0x... \
COUNTERPARTY_ADDRESS=0x... \
pnpm --filter sherpa-demo-agent start
```
