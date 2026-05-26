import type {
  SerializableX402PaymentRequirement,
  X402PaymentRequirement,
} from "./types.js";

export const PAYMENT_REQUIRED_HEADER = "PAYMENT-REQUIRED";
export const SHERPA_POLICY_HEADER = "X-SHERPA-POLICY";

export function encodePaymentRequiredHeader(
  requirement: X402PaymentRequirement,
): string {
  return Buffer.from(JSON.stringify(toSerializable(requirement))).toString(
    "base64url",
  );
}

export function parsePaymentRequiredHeader(
  header: string | null,
): X402PaymentRequirement {
  if (!header) throw new Error(`${PAYMENT_REQUIRED_HEADER} header is missing`);

  const decoded = Buffer.from(header, "base64url").toString("utf8");
  const parsed = JSON.parse(decoded) as SerializableX402PaymentRequirement;

  return {
    ...parsed,
    amountBaseUnits: BigInt(parsed.amountBaseUnits),
  };
}

export function toSerializable(
  requirement: X402PaymentRequirement,
): SerializableX402PaymentRequirement {
  return {
    ...requirement,
    amountBaseUnits: requirement.amountBaseUnits.toString(),
  };
}
