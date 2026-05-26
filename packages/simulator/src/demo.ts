import { createDemoPolicy, usdc, type SpendAttempt } from "@sherpa/policy";
import { runSpendSimulation } from "./simulator.js";

export function runDemoSimulation() {
  return runSpendSimulation(createDemoPolicy(), demoAttempts());
}

export function demoAttempts(): SpendAttempt[] {
  return [
    {
      counterparty: "0x000000000000000000000000000000000000dEaD",
      amountBaseUnits: usdc(8),
      action: "x402_api_call",
    },
    {
      counterparty: "0x000000000000000000000000000000000000dEaD",
      amountBaseUnits: usdc(60),
      action: "runaway_loop",
    },
    {
      counterparty: "0x000000000000000000000000000000000000bEEF",
      amountBaseUnits: usdc(5),
      action: "unknown_vendor",
    },
  ];
}
