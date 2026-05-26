# Contributing

Sherpa Guardrails is in hackathon sprint mode. Keep changes small, tested, and
easy to demo.

## Local Checks

```bash
pnpm install
pnpm -r build
pnpm -r test
forge test --root packages/contracts
```

## Commit Style

Use focused commits:

```text
feat: add policy simulator
fix: correct counterparty cap math
docs: update deployment checklist
```

## Safety Rules

- Never commit private keys, RPC secrets, or funded wallet material.
- Keep smart contract changes covered by Foundry tests.
- Keep API changes covered by package tests.
- Treat live filing/spend automation as opt-in until the operator approves it.
