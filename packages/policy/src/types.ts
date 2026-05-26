export type HexAddress = `0x${string}`;

export type PolicyRejectionReason =
  | "NONE"
  | "AGENT_REVOKED"
  | "POLICY_PAUSED"
  | "COUNTERPARTY_BLOCKED"
  | "ZERO_AMOUNT"
  | "PER_TX_CAP_EXCEEDED"
  | "DAILY_CAP_EXCEEDED"
  | "COUNTERPARTY_CAP_EXCEEDED"
  | "INSUFFICIENT_BALANCE";

export type CounterpartyPolicy = {
  address: HexAddress;
  label: string;
  allowed: boolean;
  dailyCapBaseUnits: bigint;
  spentTodayBaseUnits: bigint;
};

export type SpendPolicy = {
  agent: HexAddress;
  paused: boolean;
  revoked: boolean;
  balanceBaseUnits: bigint;
  perTxCapBaseUnits: bigint;
  dailyCapBaseUnits: bigint;
  spentTodayBaseUnits: bigint;
  counterparties: CounterpartyPolicy[];
};

export type SpendAttempt = {
  counterparty: HexAddress;
  amountBaseUnits: bigint;
  action: string;
};

export type SpendApproval = {
  ok: true;
  reason: "NONE";
  remainingDailyCapBaseUnits: bigint;
  remainingCounterpartyCapBaseUnits: bigint;
};

export type SpendRejection = {
  ok: false;
  reason: Exclude<PolicyRejectionReason, "NONE">;
  message: string;
};

export type SpendDecision = SpendApproval | SpendRejection;
