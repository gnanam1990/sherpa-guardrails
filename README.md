# Sherpa Guardrails

Smart spend controls for autonomous AI agents.

Sherpa Guardrails is a smart-contract-backed spend manager on Arc Testnet. Operators fund an agent spend account with USDC, set hard caps, and hand the agent a limited spender key. The agent can request payments only through the contract. Valid spend executes; over-budget spend is rejected by the contract and logged on-chain.

## Pitch

Sherpa Guardrails is a corporate card for autonomous agents: USDC budgets, daily caps, per-counterparty limits, and public audit logs enforced by smart contracts, not app-layer checks.

## Sprint Deliverables

- `SpendAccount` contract on Arc Testnet
- `SpendAccountFactory` for creating agent spend accounts
- TypeScript SDK any agent framework can use
- Demo agent operating under a `$50/day` cap
- Public dashboard showing approved and rejected spend events
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
apps/agent          Demo autonomous spending agent
apps/dashboard      Public audit dashboard
docs                Product, threat model, and demo notes
```

## Hackathon Checkpoint

- Product brief: `docs/PRODUCT_BRIEF.md`
- Wednesday package: `docs/WEDNESDAY_CHECKPOINT.md`
- Demo script: `docs/DEMO_SCRIPT.md`
- Deployment runbook: `docs/DEPLOYMENT.md`

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm contracts:build
pnpm contracts:test
```

## Core Demo

```text
Operator creates a SpendAccount
-> funds it with testnet USDC
-> sets $50/day and $10/counterparty caps
-> agent requests $8 spend
-> contract executes and logs it
-> agent requests $60 spend
-> contract rejects and logs it
-> dashboard shows both events
```

## Safety Boundary

The agent never receives unrestricted custody over the budget. Funds live in `SpendAccount`; the agent can only call `requestSpend`, and the contract enforces every cap before moving USDC.
