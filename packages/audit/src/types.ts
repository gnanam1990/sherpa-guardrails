import type {
  HexAddress,
  PolicyRejectionReason,
  SpendAttempt,
  SpendDecision,
} from "@sherpa/policy";

export type AuditStatus = "approved" | "rejected";

export type AuditRecord = {
  id: string;
  status: AuditStatus;
  action: string;
  counterparty: HexAddress;
  amountBaseUnits: bigint;
  reason?: PolicyRejectionReason;
  message?: string;
  createdAt: string;
};

export type AuditSummary = {
  totalAttempts: number;
  approvedCount: number;
  rejectedCount: number;
  approvedVolumeBaseUnits: bigint;
  preventedRiskBaseUnits: bigint;
  topRejectionReasons: Array<{
    reason: PolicyRejectionReason;
    count: number;
  }>;
};

export type AuditRecordInput = {
  attempt: SpendAttempt;
  decision: SpendDecision;
  createdAt?: string;
};
