import { describe, expect, it } from "vitest";
import { handleApiRequest } from "./routes.js";

describe("handleApiRequest", () => {
  it("evaluates demo policy spend requests", () => {
    const response = handleApiRequest("POST", "/policy/evaluate", {
      attempt: {
        counterparty: "0x000000000000000000000000000000000000dEaD",
        amountBaseUnits: "60000000",
        action: "runaway_loop",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      decision: {
        ok: false,
        reason: "PER_TX_CAP_EXCEEDED",
      },
    });
  });

  it("returns demo simulation summary", () => {
    const response = handleApiRequest("POST", "/simulate/demo", undefined);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      summary: {
        totalAttempts: 3,
        approvedCount: 1,
        rejectedCount: 2,
      },
    });
  });

  it("guards x402 payment requirements", () => {
    const response = handleApiRequest("POST", "/x402/guard", {
      requirement: {
        resource: "https://api.example.test/vector-search",
        amountBaseUnits: "8000000",
        asset: "USDC",
        network: "arc-testnet",
        payTo: "0x000000000000000000000000000000000000dEaD",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      decision: {
        ok: true,
        reason: "NONE",
      },
    });
  });

  it("evaluates natural-language payment intents", () => {
    const response = handleApiRequest("POST", "/intent/evaluate", {
      input: "Pay 8 USDC to the x402 API provider for vector search",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      intent: {
        amountUsdc: "8",
        counterpartyLabel: "x402 API Provider",
        action: "x402_vector_search",
      },
      decision: {
        ok: true,
        reason: "NONE",
      },
    });
  });

  it("returns a full intent demo flow", () => {
    const response = handleApiRequest("POST", "/intent/demo", undefined);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      flows: [
        { decision: { ok: true, reason: "NONE" } },
        { decision: { ok: false, reason: "PER_TX_CAP_EXCEEDED" } },
        { decision: { ok: false, reason: "COUNTERPARTY_BLOCKED" } },
      ],
    });
  });
});
