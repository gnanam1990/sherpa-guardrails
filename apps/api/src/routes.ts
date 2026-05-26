import {
  demoPaymentIntents,
  parsePaymentIntent,
  runIntentFlow,
} from "@sherpa/intent";
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
import {
  guardX402Payment,
  type X402PaymentRequirement,
} from "@sherpa/x402";

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

type X402Body = {
  policy?: SerializableSpendPolicy;
  requirement?: {
    resource?: string;
    description?: string;
    amountBaseUnits?: string;
    asset?: string;
    network?: string;
    payTo?: string;
    facilitatorUrl?: string;
  };
  action?: string;
};

type IntentBody = {
  policy?: SerializableSpendPolicy;
  input?: string;
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

    if (method === "POST" && pathname === "/intent/parse") {
      const payload = asIntentBody(body);
      const input = readIntentInput(payload);

      return ok(parsePaymentIntent(input));
    }

    if (method === "POST" && pathname === "/intent/evaluate") {
      const payload = asIntentBody(body);
      const input = readIntentInput(payload);
      const policy = payload.policy
        ? fromSerializablePolicy(payload.policy)
        : createDemoPolicy();

      return ok(runIntentFlow(policy, input));
    }

    if (method === "POST" && pathname === "/intent/demo") {
      const payload = asIntentBody(body);
      const policy = payload.policy
        ? fromSerializablePolicy(payload.policy)
        : createDemoPolicy();

      return ok({
        flows: demoPaymentIntents.map((input) => runIntentFlow(policy, input)),
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

    if (method === "POST" && pathname === "/x402/guard") {
      const payload = asX402Body(body);
      const policy = payload.policy
        ? fromSerializablePolicy(payload.policy)
        : createDemoPolicy();
      const requirement = readX402Requirement(payload.requirement);

      return ok(
        guardX402Payment({
          policy,
          requirement,
          action: payload.action,
        }),
      );
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

function asX402Body(body: unknown): X402Body {
  if (!isRecord(body)) return {};
  return body as X402Body;
}

function asIntentBody(body: unknown): IntentBody {
  if (!isRecord(body)) return {};
  return body as IntentBody;
}

function readIntentInput(payload: IntentBody): string {
  if (!payload.input?.trim()) {
    throw new Error("input is required");
  }
  return payload.input;
}

function readX402Requirement(input: X402Body["requirement"]): X402PaymentRequirement {
  if (!input) throw new Error("requirement is required");
  if (!input.resource) throw new Error("requirement.resource is required");
  if (!input.amountBaseUnits) {
    throw new Error("requirement.amountBaseUnits is required");
  }
  if (input.asset !== "USDC") {
    throw new Error("requirement.asset must be USDC");
  }
  if (!input.network) throw new Error("requirement.network is required");
  if (!input.payTo?.startsWith("0x")) {
    throw new Error("requirement.payTo must be a 0x address");
  }

  return {
    resource: input.resource,
    description: input.description,
    amountBaseUnits: BigInt(input.amountBaseUnits),
    asset: "USDC",
    network: input.network,
    payTo: input.payTo as HexAddress,
    facilitatorUrl: input.facilitatorUrl,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
