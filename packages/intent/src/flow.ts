import {
  evaluateSpendPolicy,
  type SpendDecision,
  type SpendPolicy,
} from "@sherpa/policy";
import {
  defaultCounterparties,
  parsePaymentIntent,
  toSpendAttempt,
} from "./parser.js";
import type { CounterpartyAlias, IntentFlowResult } from "./types.js";

export function runIntentFlow(
  policy: SpendPolicy,
  input: string,
  counterparties: CounterpartyAlias[] = defaultCounterparties,
): IntentFlowResult {
  const intent = parsePaymentIntent(input, counterparties);
  const attempt = toSpendAttempt(intent);
  const decision = evaluateSpendPolicy(policy, attempt);

  return {
    input: intent.input,
    intent,
    attempt,
    decision,
    nextStep: nextStepForDecision(decision),
  };
}

export function nextStepForDecision(decision: SpendDecision): string {
  if (decision.ok) {
    return "Proceed to contract spend; the on-chain vault will enforce the same cap before settlement.";
  }

  switch (decision.reason) {
    case "COUNTERPARTY_BLOCKED":
      return "Do not pay. Ask the operator to allowlist this counterparty or choose a trusted vendor.";
    case "PER_TX_CAP_EXCEEDED":
      return "Do not pay. Split the request or ask the operator to raise the per-transaction cap.";
    case "DAILY_CAP_EXCEEDED":
      return "Do not pay. Wait for the next budget window or request operator approval.";
    case "COUNTERPARTY_CAP_EXCEEDED":
      return "Do not pay. This vendor has reached its daily counterparty limit.";
    case "INSUFFICIENT_BALANCE":
      return "Do not pay. The spend account needs more USDC before settlement.";
    case "AGENT_REVOKED":
      return "Do not pay. The operator revoked this agent key.";
    case "POLICY_PAUSED":
      return "Do not pay. The operator paused this spend account.";
    case "ZERO_AMOUNT":
      return "Do not pay. The request amount must be greater than zero.";
  }
}
