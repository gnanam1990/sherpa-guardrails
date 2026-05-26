import type { Account, Chain, Hex } from "viem";

export type HexAddress = `0x${string}`;

export type RejectionReason =
  | "NONE"
  | "NOT_AGENT"
  | "PAUSED"
  | "REVOKED"
  | "COUNTERPARTY_BLOCKED"
  | "ZERO_AMOUNT"
  | "PER_TX_CAP_EXCEEDED"
  | "DAILY_CAP_EXCEEDED"
  | "COUNTERPARTY_CAP_EXCEEDED"
  | "INSUFFICIENT_BALANCE";

export type GuardrailsClientConfig = {
  accountAddress: HexAddress;
  account?: Account;
  rpcUrl?: string;
  chain?: Chain;
};

export type SpendRequest = {
  counterparty: HexAddress;
  amountUsdc: string;
  action: string;
  recordRejection?: boolean;
};

export type SpendReceipt = {
  ok: true;
  txHash: Hex;
  counterparty: HexAddress;
  amountBaseUnits: bigint;
};

export type SpendRejection = {
  ok: false;
  reason: RejectionReason;
  counterparty: HexAddress;
  amountBaseUnits: bigint;
  txHash?: Hex;
};

export type SpendResult = SpendReceipt | SpendRejection;

export type BudgetState = {
  perTxCap: bigint;
  dailyCap: bigint;
  daySpent: bigint;
  remainingDailyCap: bigint;
  paused: boolean;
  revoked: boolean;
};

export type CounterpartyState = {
  counterparty: HexAddress;
  allowed: boolean;
  cap: bigint;
  spent: bigint;
  remaining: bigint;
};

export type AuditEventStatus = "approved" | "rejected";

export type AuditEvent = {
  id: string;
  status: AuditEventStatus;
  agent: HexAddress;
  counterparty: HexAddress;
  amountBaseUnits: bigint;
  action: Hex;
  reason?: RejectionReason;
  remainingDailyCap?: bigint;
  transactionHash: Hex;
  blockNumber: bigint;
  logIndex: number;
};

export type AuditEventQuery = {
  fromBlock?: bigint;
  toBlock?: bigint | "latest";
};
