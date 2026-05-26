import type {
  HexAddress,
  SpendAttempt,
  SpendDecision,
} from "@sherpa/policy";

export type CounterpartyAlias = {
  label: string;
  address: HexAddress;
  aliases: string[];
  defaultAction: string;
};

export type PaymentIntent = {
  input: string;
  amountUsdc: string;
  amountBaseUnits: bigint;
  counterparty: HexAddress;
  counterpartyLabel: string;
  action: string;
  confidence: number;
  warnings: string[];
};

export type IntentFlowResult = {
  input: string;
  intent: PaymentIntent;
  attempt: SpendAttempt;
  decision: SpendDecision;
  nextStep: string;
};
