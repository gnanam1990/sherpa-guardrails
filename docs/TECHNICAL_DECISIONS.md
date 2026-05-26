# Technical Decisions

## Product Naming

- Public product: `Sherpa Guardrails`
- Contract: `SpendAccount`
- Factory: `SpendAccountFactory`
- SDK package target: `@sherpa/guardrails`

## Rejection Logging

A reverted transaction cannot preserve emitted event logs. For the hackathon dashboard, the agent-facing method is non-reverting:

```solidity
requestSpend(address counterparty, uint256 amount, bytes32 action)
```

If the request violates policy, the contract emits `SpendRejected`, moves no funds, and returns the rejection reason. If the request passes, it transfers USDC and emits `SpendExecuted`.

This still enforces limits at the contract level because no off-chain code can make an over-limit transfer settle.

## Amount Units

All budget amounts are stored in ERC-20 USDC base units. On Arc, the USDC ERC-20 interface uses 6 decimals. The SDK should accept human USDC amounts and convert to base units exactly once.

## Stage 1 Contract Surface

- `setCaps(perTxCap, dailyCap)`
- `setCounterparty(counterparty, allowed, dailyCap)`
- `pause()`
- `unpause()`
- `revokeAgent()`
- `withdraw(to, amount)`
- `canSpend(counterparty, amount)`
- `requestSpend(counterparty, amount, action)`
