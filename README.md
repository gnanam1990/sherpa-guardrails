# Sherpa Guardrails

Smart spend controls for autonomous AI agents.

Sherpa Guardrails is a smart-contract-backed spend manager on Arc Testnet. Operators fund an agent spend account with USDC, set hard caps, and hand the agent a limited spender key. The agent can request payments only through the contract. Valid spend executes; over-budget spend is rejected by the contract and logged on-chain.

## Pitch

Sherpa Guardrails is a corporate card for autonomous agents: USDC budgets, daily caps, per-counterparty limits, and public audit logs enforced by smart contracts, not app-layer checks.

## Product Status

Stage 1 is a working hackathon MVP. Stage 2 is the live Arc Testnet demo.

| Stage | Scope | Status |
| --- | --- | --- |
| Stage 1 | Contracts, SDK, intent parser, demo agent, dashboard, API simulator | Built locally |
| Stage 2 | Arc Testnet deployment and live spend proof | Next |
| Stage 3 | Wallet-connected operator console | Planned |
| Stage 4 | x402 and agent-framework adapters | Planned |
| Stage 5 | Production hardening and audit prep | Planned |

## Sprint Deliverables

- `SpendAccount` contract on Arc Testnet
- `SpendAccountFactory` for creating agent spend accounts
- TypeScript SDK any agent framework can use
- Natural-language payment intent parser for agent flows
- Demo agent operating under a `$50/day` cap
- Public dashboard showing approved and rejected spend events
- API for policy evaluation and simulations
- Policy, audit, and simulator packages for product logic
- x402-compatible wrapper as a stretch goal

## Why Arc

Arc Testnet is Circle's stablecoin-native EVM chain. It uses USDC as the gas token, supports Solidity tooling, and exposes public RPC/explorer endpoints for contract deployment and testing.

Useful constants:

```text
Chain: Arc Testnet
Chain ID: 5042002
RPC: https://rpc.testnet.arc.network
Explorer: https://testnet.arcscan.app
USDC ERC-20: 0x3600000000000000000000000000000000000000
```

## Monorepo

```text
packages/contracts  Solidity contracts and Foundry tests
packages/sdk        TypeScript SDK
packages/policy     Off-chain policy mirror and decision engine
packages/intent     Natural-language payment intent parser and guard flow
packages/audit      Audit records and prevented-risk summaries
packages/simulator  Scenario runner for demos and tests
packages/x402       x402 payment requirement guardrails
apps/api            HTTP API for policy evaluation and simulations
apps/agent          Demo autonomous spending agent
apps/dashboard      Public audit dashboard
docs                Product, threat model, and demo notes
```

## Hackathon Checkpoint

- Full PRD: `docs/SHERPA_PRD_v1.md`
- Product brief: `docs/PRODUCT_BRIEF.md`
- Wednesday package: `docs/WEDNESDAY_CHECKPOINT.md`
- Demo script: `docs/DEMO_SCRIPT.md`
- Agent payment flow: `docs/AGENT_PAYMENT_FLOW.md`
- Arc testnet runbook: `docs/ARC_TESTNET_RUNBOOK.md`
- Live Arc proof: `docs/LIVE_ARC_PROOF.md`
- Architecture: `docs/ARCHITECTURE.md`
- Threat model: `docs/THREAT_MODEL.md`
- Roadmap: `docs/ROADMAP.md`
- Integrations: `docs/INTEGRATIONS.md`
- Deployment runbook: `docs/DEPLOYMENT.md`

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm contracts:build
pnpm contracts:test
pnpm testnet:status
pnpm --filter @sherpa/api dev
```

## Arc Testnet Commands

```bash
pnpm wallets:demo
pnpm testnet:status
pnpm testnet:deploy
pnpm testnet:configure
pnpm testnet:fund
pnpm testnet:agent
pnpm testnet:dashboard
```

Full runbook: `docs/ARC_TESTNET_RUNBOOK.md`.

## Preview Deploy

The repository includes `vercel.json` for a dashboard-only preview deploy:

```bash
pnpm --filter sherpa-dashboard build
```

Vercel output directory: `apps/dashboard/dist`.

Current preview:

```text
https://sherpa-guardrails-j3x8jgrop-gnanam1990s-projects.vercel.app
```

## Core Demo

```text
Operator creates a SpendAccount
-> funds it with testnet USDC
-> sets $50/day and $10/counterparty caps
-> agent receives "Pay 8 USDC to the x402 API provider"
-> Sherpa parses it into a spend attempt
-> contract executes and logs the approved spend
-> agent tries "Pay 60 USDC"
-> policy and contract reject the overrun
-> dashboard shows both events
```

## Safety Boundary

The agent never receives unrestricted custody over the budget. Funds live in `SpendAccount`; the agent can only call `requestSpend`, and the contract enforces every cap before moving USDC.
