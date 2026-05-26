import { describe, expect, it } from "vitest";
import { createDemoPolicy, usdc } from "@sherpa/policy";
import {
  encodePaymentRequiredHeader,
  guardX402Payment,
  parsePaymentRequiredHeader,
  type X402PaymentRequirement,
} from "./index.js";

const requirement: X402PaymentRequirement = {
  resource: "https://api.example.test/vector-search",
  description: "Vector search API call",
  amountBaseUnits: usdc(8),
  asset: "USDC",
  network: "arc-testnet",
  payTo: "0x000000000000000000000000000000000000dEaD",
};

describe("@sherpa/x402", () => {
  it("round-trips PAYMENT-REQUIRED header payloads", () => {
    expect(parsePaymentRequiredHeader(encodePaymentRequiredHeader(requirement)))
      .toEqual(requirement);
  });

  it("approves x402 requirements inside policy limits", () => {
    expect(
      guardX402Payment({
        policy: createDemoPolicy(),
        requirement,
      }).decision,
    ).toMatchObject({ ok: true, reason: "NONE" });
  });

  it("rejects x402 requirements that exceed policy limits", () => {
    expect(
      guardX402Payment({
        policy: createDemoPolicy(),
        requirement: {
          ...requirement,
          amountBaseUnits: usdc(60),
        },
      }).decision,
    ).toMatchObject({ ok: false, reason: "PER_TX_CAP_EXCEEDED" });
  });
});
