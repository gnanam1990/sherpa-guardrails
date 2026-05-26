# Product Brief: Sherpa Guardrails

## One-Line Pitch

Sherpa Guardrails gives AI agents USDC budgets with contract-enforced daily caps, counterparty limits, and on-chain audit logs.

## Problem

Autonomous agents are beginning to pay for APIs, compute, data, and other agent services. Today, operators either give an agent a normal wallet with too much authority or rely on app-layer budget checks running in the same process as the agent. If the agent is prompt-injected, loops, or has a compromised dependency, those checks can be bypassed.

## Solution

Sherpa Guardrails moves spend control into a smart contract. The operator deploys a `SpendAccount`, funds it with USDC, sets limits, and gives the agent only a spender key. Every request is checked by the contract before funds move.

## MVP Scope

- Arc Testnet only
- USDC only
- One spend account per agent
- Per-transaction cap
- Daily cap
- Per-counterparty daily cap
- Pause and revoke controls
- On-chain approved/rejected audit events
- TypeScript SDK
- Demo agent and public dashboard

## Out Of Scope For Sprint

- Mainnet deployment
- Multi-asset support
- Full x402 production integration
- Formal audit
- No-code operator console
- Cross-chain transfers

## Judging Demo

```text
Agent budget: $50/day
Spend attempt 1: $8 to API provider -> approved
Spend attempt 2: $60 to API provider -> rejected
Proof: Arc transaction log + dashboard audit feed
```
