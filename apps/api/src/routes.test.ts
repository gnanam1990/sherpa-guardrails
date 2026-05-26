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
});
