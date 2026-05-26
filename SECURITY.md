# Security Policy

Sherpa Guardrails is experimental hackathon software. Do not use it with
mainnet funds without review, testing, and audit.

## Supported Scope

- Arc Testnet
- Test USDC
- Single-agent `SpendAccount`
- Operator-controlled caps and allowlists

## Reporting

Open a private security issue or contact the maintainer before disclosing:

- contract bypasses
- incorrect rejection logic
- private key exposure
- unauthorized spend paths
- API routes that mutate state without operator approval

## Current Safety Boundary

The agent never receives unrestricted custody of the operator budget. Funds sit
inside `SpendAccount`, and the agent can only request spend through contract
policy checks.
