import { describe, expect, it } from "vitest";
import { usdc } from "@sherpa/policy";
import { runDemoSimulation } from "./index.js";

describe("runDemoSimulation", () => {
  it("shows one settled spend and two blocked risks", () => {
    const result = runDemoSimulation();

    expect(result.summary.approvedVolumeBaseUnits).toBe(usdc(8));
    expect(result.summary.preventedRiskBaseUnits).toBe(usdc(65));
    expect(result.records.map((record) => record.status)).toEqual([
      "approved",
      "rejected",
      "rejected",
    ]);
  });
});
