import type { PolicyRejectionReason } from "@sherpa/policy";
import type { AuditRecord, AuditRecordInput, AuditSummary } from "./types.js";

export function createAuditRecord(input: AuditRecordInput): AuditRecord {
  const { attempt, decision } = input;

  return {
    id: auditId(attempt.action, attempt.counterparty, input.createdAt),
    status: decision.ok ? "approved" : "rejected",
    action: attempt.action,
    counterparty: attempt.counterparty,
    amountBaseUnits: attempt.amountBaseUnits,
    reason: decision.reason,
    message: decision.ok ? undefined : decision.message,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function summarizeAudit(records: AuditRecord[]): AuditSummary {
  const approved = records.filter((record) => record.status === "approved");
  const rejected = records.filter((record) => record.status === "rejected");

  return {
    totalAttempts: records.length,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    approvedVolumeBaseUnits: sumAmounts(approved),
    preventedRiskBaseUnits: sumAmounts(rejected),
    topRejectionReasons: topRejectionReasons(rejected),
  };
}

export function filterAuditRecords(
  records: AuditRecord[],
  status?: "approved" | "rejected",
): AuditRecord[] {
  if (!status) return records;
  return records.filter((record) => record.status === status);
}

function topRejectionReasons(records: AuditRecord[]) {
  const counts = new Map<PolicyRejectionReason, number>();

  for (const record of records) {
    if (!record.reason || record.reason === "NONE") continue;
    counts.set(record.reason, (counts.get(record.reason) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([, left], [, right]) => right - left)
    .map(([reason, count]) => ({ reason, count }));
}

function sumAmounts(records: AuditRecord[]) {
  return records.reduce((sum, record) => sum + record.amountBaseUnits, 0n);
}

function auditId(action: string, counterparty: string, createdAt?: string) {
  const time = createdAt ?? new Date().toISOString();
  return `${time}:${action}:${counterparty}`.toLowerCase();
}
