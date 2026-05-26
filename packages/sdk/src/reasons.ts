import type { RejectionReason } from "./types.js";

export const rejectionReasons = [
  "NONE",
  "NOT_AGENT",
  "PAUSED",
  "REVOKED",
  "COUNTERPARTY_BLOCKED",
  "ZERO_AMOUNT",
  "PER_TX_CAP_EXCEEDED",
  "DAILY_CAP_EXCEEDED",
  "COUNTERPARTY_CAP_EXCEEDED",
  "INSUFFICIENT_BALANCE",
] as const satisfies readonly RejectionReason[];

export function decodeRejectionReason(value: number): RejectionReason {
  return rejectionReasons[value] ?? "INSUFFICIENT_BALANCE";
}
