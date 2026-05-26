import {
  ARC_TESTNET,
  createGuardrailsClient,
  formatUsdc,
  type HexAddress,
  type SpendResult,
} from "@sherpa/guardrails";
import { isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

type DemoStep = {
  label: string;
  counterparty: HexAddress;
  amountUsdc: string;
  action: string;
  expected: "approved" | "rejected";
};

const SAMPLE_COUNTERPARTY =
  "0x000000000000000000000000000000000000dEaD" as HexAddress;

const demoSteps: DemoStep[] = [
  {
    label: "Allowed x402-style API payment",
    counterparty: SAMPLE_COUNTERPARTY,
    amountUsdc: "8",
    action: "api_call",
    expected: "approved",
  },
  {
    label: "Deliberate overrun attempt",
    counterparty: SAMPLE_COUNTERPARTY,
    amountUsdc: "60",
    action: "api_call",
    expected: "rejected",
  },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run") || !process.env.AGENT_PRIVATE_KEY;

  printHeader(dryRun);

  if (dryRun) {
    runDryDemo();
    return;
  }

  const spendAccount = requireAddress("SPEND_ACCOUNT_ADDRESS");
  const counterparty =
    readAddress("COUNTERPARTY_ADDRESS") ?? SAMPLE_COUNTERPARTY;
  const agentAccount = privateKeyToAccount(
    process.env.AGENT_PRIVATE_KEY as HexAddress,
  );

  const client = createGuardrailsClient({
    accountAddress: spendAccount,
    account: agentAccount,
    rpcUrl: process.env.ARC_TESTNET_RPC_URL ?? ARC_TESTNET.rpcUrl,
  });

  const state = await client.state();
  console.log("Budget state");
  console.log(`  per tx cap:       ${formatUsdc(state.perTxCap)} USDC`);
  console.log(`  daily cap:        ${formatUsdc(state.dailyCap)} USDC`);
  console.log(`  spent today:      ${formatUsdc(state.daySpent)} USDC`);
  console.log(`  remaining today:  ${formatUsdc(state.remainingDailyCap)} USDC`);
  console.log("");

  for (const step of demoSteps) {
    const request = { ...step, counterparty };
    console.log(`Attempt: ${step.label}`);
    console.log(`  amount: ${step.amountUsdc} USDC`);
    console.log(`  counterparty: ${request.counterparty}`);

    const result = await client.spend(request);
    printSpendResult(result);
    console.log("");
  }
}

function printHeader(dryRun: boolean) {
  console.log("Sherpa Guardrails demo agent");
  console.log(`Target chain: Arc Testnet (${ARC_TESTNET.chainId})`);
  console.log(`Mode: ${dryRun ? "dry-run preview" : "live contract spend"}`);
  console.log("");
}

function runDryDemo() {
  console.log("No AGENT_PRIVATE_KEY detected, so this is a labeled dry-run.");
  console.log("Use real env vars for the live Arc Testnet demo.");
  console.log("");

  console.log("Budget state");
  console.log("  per tx cap:       10 USDC");
  console.log("  daily cap:        50 USDC");
  console.log("  spent today:      0 USDC");
  console.log("  remaining today:  50 USDC");
  console.log("");

  console.log("Attempt: Allowed x402-style API payment");
  console.log("  amount: 8 USDC");
  console.log(`  counterparty: ${SAMPLE_COUNTERPARTY}`);
  console.log("  result: APPROVED");
  console.log("  tx: dry-run-no-chain-tx");
  console.log("");

  console.log("Attempt: Deliberate overrun attempt");
  console.log("  amount: 60 USDC");
  console.log(`  counterparty: ${SAMPLE_COUNTERPARTY}`);
  console.log("  result: REJECTED");
  console.log("  reason: PER_TX_CAP_EXCEEDED");
  console.log("");
}

function printSpendResult(result: SpendResult) {
  if (result.ok) {
    console.log("  result: APPROVED");
    console.log(`  amount base units: ${result.amountBaseUnits}`);
    console.log(`  tx: ${result.txHash}`);
    return;
  }

  console.log("  result: REJECTED");
  console.log(`  amount base units: ${result.amountBaseUnits}`);
  console.log(`  reason: ${result.reason}`);
}

function requireAddress(name: string): HexAddress {
  const value = readAddress(name);
  if (!value) {
    throw new Error(`${name} must be set to a 0x address`);
  }
  return value;
}

function readAddress(name: string): HexAddress | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  if (!isAddress(value)) {
    throw new Error(`${name} must be a valid 0x address`);
  }
  return value;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
