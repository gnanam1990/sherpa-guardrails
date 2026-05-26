import type {
  CounterpartyPolicy,
  HexAddress,
  PolicyRejectionReason,
  SpendAttempt,
  SpendDecision,
  SpendPolicy,
  SpendRejection,
} from "./types.js";

export const USDC_DECIMALS = 6n;
export const USDC_BASE = 10n ** USDC_DECIMALS;

export function usdc(amount: number): bigint {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("USDC amount must be a non-negative finite number");
  }

  return BigInt(Math.round(amount * Number(USDC_BASE)));
}

export function evaluateSpendPolicy(
  policy: SpendPolicy,
  attempt: SpendAttempt,
): SpendDecision {
  const counterparty = findCounterparty(policy, attempt.counterparty);

  if (policy.paused) return reject("POLICY_PAUSED");
  if (policy.revoked) return reject("AGENT_REVOKED");
  if (!counterparty?.allowed) return reject("COUNTERPARTY_BLOCKED");
  if (attempt.amountBaseUnits === 0n) return reject("ZERO_AMOUNT");
  if (attempt.amountBaseUnits > policy.perTxCapBaseUnits) {
    return reject("PER_TX_CAP_EXCEEDED");
  }
  if (policy.spentTodayBaseUnits + attempt.amountBaseUnits > policy.dailyCapBaseUnits) {
    return reject("DAILY_CAP_EXCEEDED");
  }
  if (
    counterparty.spentTodayBaseUnits + attempt.amountBaseUnits >
    counterparty.dailyCapBaseUnits
  ) {
    return reject("COUNTERPARTY_CAP_EXCEEDED");
  }
  if (policy.balanceBaseUnits < attempt.amountBaseUnits) {
    return reject("INSUFFICIENT_BALANCE");
  }

  return {
    ok: true,
    reason: "NONE",
    remainingDailyCapBaseUnits:
      policy.dailyCapBaseUnits - policy.spentTodayBaseUnits - attempt.amountBaseUnits,
    remainingCounterpartyCapBaseUnits:
      counterparty.dailyCapBaseUnits -
      counterparty.spentTodayBaseUnits -
      attempt.amountBaseUnits,
  };
}

export function applyApprovedSpend(
  policy: SpendPolicy,
  attempt: SpendAttempt,
): SpendPolicy {
  const decision = evaluateSpendPolicy(policy, attempt);
  if (!decision.ok) return policy;

  return {
    ...policy,
    balanceBaseUnits: policy.balanceBaseUnits - attempt.amountBaseUnits,
    spentTodayBaseUnits: policy.spentTodayBaseUnits + attempt.amountBaseUnits,
    counterparties: policy.counterparties.map((counterparty) =>
      sameAddress(counterparty.address, attempt.counterparty)
        ? {
            ...counterparty,
            spentTodayBaseUnits:
              counterparty.spentTodayBaseUnits + attempt.amountBaseUnits,
          }
        : counterparty,
    ),
  };
}

export function createDemoPolicy(): SpendPolicy {
  return {
    agent: "0x000000000000000000000000000000000000aA01",
    paused: false,
    revoked: false,
    balanceBaseUnits: usdc(50),
    perTxCapBaseUnits: usdc(10),
    dailyCapBaseUnits: usdc(50),
    spentTodayBaseUnits: 0n,
    counterparties: [
      {
        address: "0x000000000000000000000000000000000000dEaD",
        label: "x402 API Provider",
        allowed: true,
        dailyCapBaseUnits: usdc(20),
        spentTodayBaseUnits: 0n,
      },
      {
        address: "0x000000000000000000000000000000000000bEEF",
        label: "Unknown vendor",
        allowed: false,
        dailyCapBaseUnits: usdc(0),
        spentTodayBaseUnits: 0n,
      },
    ],
  };
}

export function findCounterparty(
  policy: SpendPolicy,
  address: HexAddress,
): CounterpartyPolicy | undefined {
  return policy.counterparties.find((counterparty) =>
    sameAddress(counterparty.address, address),
  );
}

export function sameAddress(left: HexAddress, right: HexAddress): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function reject(
  reason: Exclude<PolicyRejectionReason, "NONE">,
): SpendRejection {
  return {
    ok: false,
    reason,
    message: rejectionMessage(reason),
  };
}

function rejectionMessage(reason: Exclude<PolicyRejectionReason, "NONE">) {
  switch (reason) {
    case "AGENT_REVOKED":
      return "The agent key has been revoked by the operator.";
    case "POLICY_PAUSED":
      return "The spend account is paused.";
    case "COUNTERPARTY_BLOCKED":
      return "The counterparty is not allowlisted.";
    case "ZERO_AMOUNT":
      return "Spend amount must be greater than zero.";
    case "PER_TX_CAP_EXCEEDED":
      return "The request exceeds the per-transaction cap.";
    case "DAILY_CAP_EXCEEDED":
      return "The request exceeds the remaining daily budget.";
    case "COUNTERPARTY_CAP_EXCEEDED":
      return "The request exceeds the counterparty daily cap.";
    case "INSUFFICIENT_BALANCE":
      return "The spend account does not hold enough USDC.";
  }
}
