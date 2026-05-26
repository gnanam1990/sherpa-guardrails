import {
  ARC_TESTNET,
  createGuardrailsClient,
  formatUsdc,
  type HexAddress,
  type SpendResult,
} from "@sherpa/guardrails";
import {
  demoPaymentIntents,
  parsePaymentIntent,
  runIntentFlow,
} from "@sherpa/intent";
import { createDemoPolicy } from "@sherpa/policy";
import { isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const SAMPLE_COUNTERPARTY =
  "0x000000000000000000000000000000000000dEaD" as HexAddress;

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

  for (const input of demoPaymentIntents) {
    const intent = parsePaymentIntent(input);

    const request = {
      counterparty:
        intent.counterparty === SAMPLE_COUNTERPARTY
          ? counterparty
          : intent.counterparty,
      amountUsdc: intent.amountUsdc,
      action: intent.action,
      recordRejection: true,
    };

    console.log(`Intent: ${intent.input}`);
    console.log(`  parsed amount: ${intent.amountUsdc} USDC`);
    console.log(`  parsed counterparty: ${intent.counterpartyLabel}`);
    console.log(`  settlement counterparty: ${request.counterparty}`);
    console.log(`  action: ${request.action}`);

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
  console.log("No AGENT_PRIVATE_KEY detected, so this is an agent-flow dry-run.");
  console.log("Use real env vars for the live Arc Testnet settlement path.");
  console.log("");

  console.log("Budget state");
  console.log("  per tx cap:       10 USDC");
  console.log("  daily cap:        50 USDC");
  console.log("  spent today:      0 USDC");
  console.log("  remaining today:  50 USDC");
  console.log("");

  const policy = createDemoPolicy();
  for (const input of demoPaymentIntents) {
    const flow = runIntentFlow(policy, input);
    console.log(`Intent: ${flow.input}`);
    console.log(
      `  agent parsed: ${flow.intent.amountUsdc} USDC -> ${flow.intent.counterpartyLabel}`,
    );
    console.log(`  counterparty: ${flow.intent.counterparty}`);
    console.log(`  action: ${flow.intent.action}`);
    if (flow.intent.warnings.length > 0) {
      console.log(`  parser warning: ${flow.intent.warnings.join(" ")}`);
    }
    if (flow.decision.ok) {
      console.log("  policy result: APPROVED");
      console.log("  tx: dry-run-no-chain-tx");
    } else {
      console.log("  policy result: REJECTED");
      console.log(`  reason: ${flow.decision.reason}`);
      console.log(`  next step: ${flow.nextStep}`);
    }
    console.log("");
  }
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
  if (result.txHash) {
    console.log(`  rejection tx: ${result.txHash}`);
  }
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
