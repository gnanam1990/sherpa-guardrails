import { describe, expect, it } from "vitest";
import {
  applyApprovedSpend,
  createDemoPolicy,
  evaluateSpendPolicy,
  usdc,
} from "./index.js";

const counterparty = "0x000000000000000000000000000000000000dEaD";
const blocked = "0x000000000000000000000000000000000000bEEF";

describe("evaluateSpendPolicy", () => {
  it("approves a spend inside every limit", () => {
    const decision = evaluateSpendPolicy(createDemoPolicy(), {
      counterparty,
      amountBaseUnits: usdc(8),
      action: "x402_api_call",
    });

    expect(decision).toMatchObject({ ok: true, reason: "NONE" });
  });

  it("rejects over-cap spend before settlement", () => {
    const decision = evaluateSpendPolicy(createDemoPolicy(), {
      counterparty,
      amountBaseUnits: usdc(60),
      action: "runaway_loop",
    });

    expect(decision).toMatchObject({
      ok: false,
      reason: "PER_TX_CAP_EXCEEDED",
    });
  });

  it("rejects blocked counterparties", () => {
    const decision = evaluateSpendPolicy(createDemoPolicy(), {
      counterparty: blocked,
      amountBaseUnits: usdc(5),
      action: "unknown_vendor",
    });

    expect(decision).toMatchObject({
      ok: false,
      reason: "COUNTERPARTY_BLOCKED",
    });
  });

  it("applies approved spend to remaining policy state", () => {
    const nextPolicy = applyApprovedSpend(createDemoPolicy(), {
      counterparty,
      amountBaseUnits: usdc(8),
      action: "x402_api_call",
    });

    expect(nextPolicy.spentTodayBaseUnits).toBe(usdc(8));
    expect(nextPolicy.balanceBaseUnits).toBe(usdc(42));
  });
});
