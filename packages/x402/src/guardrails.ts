import {
  evaluateSpendPolicy,
  type SpendAttempt,
} from "@sherpa/policy";
import type {
  X402GuardrailDecision,
  X402GuardrailRequest,
  X402PaymentRequirement,
} from "./types.js";

export function guardX402Payment(
  request: X402GuardrailRequest,
): X402GuardrailDecision {
  const action = request.action ?? actionFromRequirement(request.requirement);
  const attempt = toSpendAttempt(request.requirement, action);

  return {
    requirement: request.requirement,
    action,
    decision: evaluateSpendPolicy(request.policy, attempt),
  };
}

export function toSpendAttempt(
  requirement: X402PaymentRequirement,
  action = actionFromRequirement(requirement),
): SpendAttempt {
  return {
    counterparty: requirement.payTo,
    amountBaseUnits: requirement.amountBaseUnits,
    action,
  };
}

export function actionFromRequirement(requirement: X402PaymentRequirement) {
  const resource = requirement.resource.replaceAll(/[^a-zA-Z0-9:_-]/g, "_");
  return `x402:${resource}`.slice(0, 64);
}
