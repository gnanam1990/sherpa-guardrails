import type { HexAddress, SpendDecision, SpendPolicy } from "@sherpa/policy";

export type X402PaymentRequirement = {
  resource: string;
  description?: string;
  amountBaseUnits: bigint;
  asset: "USDC";
  network: string;
  payTo: HexAddress;
  facilitatorUrl?: string;
};

export type SerializableX402PaymentRequirement = Omit<
  X402PaymentRequirement,
  "amountBaseUnits"
> & {
  amountBaseUnits: string;
};

export type X402GuardrailRequest = {
  policy: SpendPolicy;
  requirement: X402PaymentRequirement;
  action?: string;
};

export type X402GuardrailDecision = {
  requirement: X402PaymentRequirement;
  action: string;
  decision: SpendDecision;
};
