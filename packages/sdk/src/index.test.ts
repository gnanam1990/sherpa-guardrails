import { describe, expect, it } from "vitest";
import {
  actionToBytes32,
  decodeRejectionReason,
  formatUsdc,
  parseUsdc,
} from "./index.js";

describe("USDC helpers", () => {
  it("parses whole and fractional USDC into 6-decimal base units", () => {
    expect(parseUsdc("50")).toBe(50_000_000n);
    expect(parseUsdc("0.5")).toBe(500_000n);
    expect(parseUsdc("1.000001")).toBe(1_000_001n);
  });

  it("formats 6-decimal USDC base units", () => {
    expect(formatUsdc(50_000_000n)).toBe("50");
    expect(formatUsdc(500_000n)).toBe("0.5");
    expect(formatUsdc(1_000_001n)).toBe("1.000001");
  });

  it("rejects over-precision amounts", () => {
    expect(() => parseUsdc("0.0000001")).toThrow();
  });
});

describe("contract mappings", () => {
  it("maps contract enum values to SDK reasons", () => {
    expect(decodeRejectionReason(0)).toBe("NONE");
    expect(decodeRejectionReason(7)).toBe("DAILY_CAP_EXCEEDED");
    expect(decodeRejectionReason(8)).toBe("COUNTERPARTY_CAP_EXCEEDED");
  });

  it("hashes human action labels to bytes32 tags", () => {
    expect(actionToBytes32("api_call")).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
