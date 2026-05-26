# Threat Model

## Assets

- USDC held by `SpendAccount`
- operator key
- agent spender key
- counterparty allowlist
- audit trail integrity
- dashboard/API deployment credentials

## Trust Assumptions

- The operator key is controlled by the account owner.
- The agent key may be exposed to agent runtime risk.
- The contract is the final spend authority.
- Off-chain API simulations are advisory, not settlement authority.

## Threats And Controls

| Threat | Control |
| --- | --- |
| Prompt-injected agent attempts runaway spend | per-transaction and daily caps |
| Agent sends funds to unknown address | counterparty allowlist |
| Agent key is compromised | pause and revoke controls |
| App-layer policy is bypassed | contract-level enforcement |
| Rejected spend disappears from UX | non-reverting `SpendRejected` event |
| Operator needs to recover funds | operator-only withdraw |
| API makes unsafe mutation | keep API read/simulation-only until wallet auth |

## Known Gaps

- No formal audit yet
- No multisig operator flow yet
- No session-key rotation UI yet
- No production monitoring or alerting yet
- Dashboard operator actions are visual only until wallet-connected

## Demo Safety Position

Use Arc Testnet only. The product demo should show real contract behavior but
not imply mainnet readiness.
