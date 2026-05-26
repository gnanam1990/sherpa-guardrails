# Live Arc Testnet Proof

Sherpa Guardrails has been deployed and exercised on Arc Testnet.

## Deployment

```text
Chain: Arc Testnet
Chain ID: 5042002
SpendAccount: 0x78E7F4a3e06997D5f2EEF35db20bD85C626EC60A
Operator: 0x9a821e8Ba19a784415EB66a35dBAeaaada83ecce
Agent: 0xEB4eDD9918D39604FcF2F14fa56362824f4BE476
Counterparty: 0x3b672B92efE7b381eaf87B7e64C90627D2776447
USDC: 0x3600000000000000000000000000000000000000
```

## Funding

```text
Faucet funding tx:
0x523d3c417338bbe35c97f66d1da23de8780ad771362cbbb79a4c11af246e0777

SpendAccount funding tx:
0x21ea8ff7fc52ef63cd6c19cd8962fb9be34af6fa491fd28ae3ba16eb7adc8b00
```

## Agent Run

```text
Approved spend:
8 USDC
0x5549b9682b76b2069d462c06aab99b0521cd75835cefab15886f031b3323f5d0

Rejected overrun:
60 USDC
PER_TX_CAP_EXCEEDED
0x08a950e7461c1862ea97b4e3825348e2767e27b5fdd8fc5fdd7303c65e88cfaf

Rejected blocked vendor:
5 USDC
COUNTERPARTY_BLOCKED
0x8960173ed5f6a82cb49ca44377650219ec11c9de5b9be77a9b685b844d2e6da3
```

## Dashboard

```text
Production dashboard:
https://sherpa-guardrails.vercel.app

Immutable production deployment:
https://sherpa-guardrails-9kt69m16k-gnanam1990s-projects.vercel.app

Preview deployment:
https://sherpa-guardrails-lcs8i8g5g-gnanam1990s-projects.vercel.app
```

The dashboard build is configured with:

```text
VITE_SPEND_ACCOUNT_ADDRESS=0x78E7F4a3e06997D5f2EEF35db20bD85C626EC60A
VITE_COUNTERPARTY_ADDRESS=0x3b672B92efE7b381eaf87B7e64C90627D2776447
VITE_FROM_BLOCK=44090700
```

## Verification Command

```bash
pnpm testnet:status
```

Expected live state after the proof run:

```text
Spent today: 8 USDC
Remaining today: 42 USDC
Counterparty remaining: 12 USDC
Demo liquidity: 2 USDC balance + 8 USDC spent
```
