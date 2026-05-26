import { describe, expect, it } from "vitest";
import { createDemoPolicy, evaluateSpendPolicy, usdc } from "@sherpa/policy";
import { createAuditRecord, summarizeAudit } from "./index.js";

describe("audit summary", () => {
  it("separates settled volume from prevented risk", () => {
    const policy = createDemoPolicy();
    const approvedAttempt = {
      counterparty: "0x000000000000000000000000000000000000dEaD" as const,
      amountBaseUnits: usdc(8),
      action: "x402_api_call",
    };
    const rejectedAttempt = {
      counterparty: "0x000000000000000000000000000000000000dEaD" as const,
      amountBaseUnits: usdc(60),
      action: "runaway_loop",
    };

    const records = [
      createAuditRecord({
        attempt: approvedAttempt,
        decision: evaluateSpendPolicy(policy, approvedAttempt),
      }),
      createAuditRecord({
        attempt: rejectedAttempt,
        decision: evaluateSpendPolicy(policy, rejectedAttempt),
      }),
    ];

    expect(summarizeAudit(records)).toMatchObject({
      totalAttempts: 2,
      approvedCount: 1,
      rejectedCount: 1,
      approvedVolumeBaseUnits: usdc(8),
      preventedRiskBaseUnits: usdc(60),
    });
  });
});
