import {
  createDemoPolicy,
  evaluateSpendPolicy,
  fromSerializablePolicy,
  toSerializablePolicy,
  type HexAddress,
  type SerializableSpendPolicy,
  type SpendAttempt,
} from "@sherpa/policy";
import { runDemoSimulation, runSpendSimulation } from "@sherpa/simulator";

export type ApiResponse = {
  status: number;
  body: unknown;
};

type EvaluateBody = {
  policy?: SerializableSpendPolicy;
  attempt?: {
    counterparty?: string;
    amountBaseUnits?: string;
    action?: string;
  };
};

type SimulateBody = {
  policy?: SerializableSpendPolicy;
  attempts?: EvaluateBody["attempt"][];
};

export function handleApiRequest(
  method: string,
  pathname: string,
  body: unknown,
): ApiResponse {
  try {
    if (method === "GET" && pathname === "/health") {
      return ok({
        ok: true,
        service: "@sherpa/api",
        product: "Sherpa Guardrails",
      });
    }

    if (method === "GET" && pathname === "/policy/demo") {
      return ok(toSerializablePolicy(createDemoPolicy()));
    }

    if (method === "POST" && pathname === "/policy/evaluate") {
      const payload = asEvaluateBody(body);
      const policy = payload.policy
        ? fromSerializablePolicy(payload.policy)
        : createDemoPolicy();
      const attempt = readAttempt(payload.attempt);

      return ok({
        attempt,
        decision: evaluateSpendPolicy(policy, attempt),
      });
    }

    if (method === "POST" && pathname === "/simulate/demo") {
      return ok(runDemoSimulation());
    }

    if (method === "POST" && pathname === "/simulate") {
      const payload = asSimulateBody(body);
      const policy = payload.policy
        ? fromSerializablePolicy(payload.policy)
        : createDemoPolicy();
      const attempts = (payload.attempts ?? []).map(readAttempt);

      return ok(runSpendSimulation(policy, attempts));
    }

    return {
      status: 404,
      body: { error: "Route not found", method, pathname },
    };
  } catch (error) {
    return {
      status: 400,
      body: {
        error: error instanceof Error ? error.message : "Bad request",
      },
    };
  }
}

function ok(body: unknown): ApiResponse {
  return { status: 200, body };
}

function readAttempt(input: EvaluateBody["attempt"]): SpendAttempt {
  if (!input) throw new Error("attempt is required");
  if (!input.counterparty?.startsWith("0x")) {
    throw new Error("attempt.counterparty must be a 0x address");
  }
  if (!input.amountBaseUnits) {
    throw new Error("attempt.amountBaseUnits is required");
  }
  if (!input.action) {
    throw new Error("attempt.action is required");
  }

  return {
    counterparty: input.counterparty as HexAddress,
    amountBaseUnits: BigInt(input.amountBaseUnits),
    action: input.action,
  };
}

function asEvaluateBody(body: unknown): EvaluateBody {
  if (!isRecord(body)) return {};
  return body as EvaluateBody;
}

function asSimulateBody(body: unknown): SimulateBody {
  if (!isRecord(body)) return {};
  return body as SimulateBody;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
