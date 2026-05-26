import { createDemoPolicy, usdc } from "@sherpa/policy";
import { describe, expect, it } from "vitest";
import {
  parsePaymentIntent,
  parseUsdcAmount,
  runIntentFlow,
} from "./index.js";

describe("@sherpa/intent", () => {
  it("parses an allowed x402 payment from plain English", () => {
    const intent = parsePaymentIntent(
      "Pay 8 USDC to the x402 API provider for vector search",
    );

    expect(intent).toMatchObject({
      amountUsdc: "8",
      amountBaseUnits: usdc(8),
      counterparty: "0x000000000000000000000000000000000000dEaD",
      counterpartyLabel: "x402 API Provider",
      action: "x402_vector_search",
    });
  });

  it("runs intent text through the policy guard", () => {
    const flow = runIntentFlow(
      createDemoPolicy(),
      "Try to pay 60 USDC to the x402 API provider for premium data",
    );

    expect(flow.decision).toMatchObject({
      ok: false,
      reason: "PER_TX_CAP_EXCEEDED",
    });
    expect(flow.nextStep).toContain("per-transaction cap");
  });

  it("routes unknown vendors into the blocked counterparty path", () => {
    const flow = runIntentFlow(
      createDemoPolicy(),
      "Pay 5 USDC to the unknown vendor for a scraped lead list",
    );

    expect(flow.intent.counterpartyLabel).toBe("Unknown vendor");
    expect(flow.decision).toMatchObject({
      ok: false,
      reason: "COUNTERPARTY_BLOCKED",
    });
  });

  it("parses USDC decimals exactly", () => {
    expect(parseUsdcAmount("8.123456")).toBe(8_123_456n);
    expect(() => parseUsdcAmount("8.1234567")).toThrow(
      "up to 6 decimal places",
    );
  });

  it("requires a payment amount", () => {
    expect(() => parsePaymentIntent("Pay the x402 API provider")).toThrow(
      "USDC amount",
    );
  });
});
