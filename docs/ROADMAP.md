# Roadmap

## Stage 1: Hackathon MVP

Status: implemented locally.

- SpendAccount contract
- Foundry test suite
- TypeScript SDK
- Demo agent
- Operator dashboard
- Policy/audit/simulator packages
- API simulation surface

## Stage 2: Live Arc Demo

Status: next.

- Deploy `SpendAccountFactory` and demo `SpendAccount` on Arc Testnet
- Configure caps and allowlisted counterparty
- Fund account with test USDC
- Run one approved spend and one rejected overrun
- Point dashboard live mode at deployed account

## Stage 3: Operator Console

Status: planned.

- Wallet connection
- Set caps from UI
- Pause/unpause
- Revoke agent key
- Withdraw funds
- Refreshing audit feed

## Stage 4: Agent Integrations

Status: planned.

- x402 payment adapter
- OpenAI Agents SDK example
- LangGraph/LangChain example
- MCP tool wrapper

## Stage 5: Production Hardening

Status: planned.

- multisig operator mode
- signed policy changes
- monitoring and alerting
- formal audit prep
- mainnet readiness review
