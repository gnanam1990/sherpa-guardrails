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

export type SpendRequest = {
  counterparty: HexAddress;
  amountUsdc: string;
  action: string;
};

export type SpendReceipt = {
  ok: true;
  txHash: HexAddress;
  counterparty: HexAddress;
  amountBaseUnits: bigint;
};

export type SpendRejection = {
  ok: false;
  reason: RejectionReason;
  counterparty: HexAddress;
  amountBaseUnits: bigint;
};

export const ARC_TESTNET = {
  chainId: 5042002,
  rpcUrl: "https://rpc.testnet.arc.network",
  explorerUrl: "https://testnet.arcscan.app",
  usdcAddress: "0x3600000000000000000000000000000000000000" as HexAddress,
} as const;

export function parseUsdc(amount: string): bigint {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = `${fraction}000000`.slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(paddedFraction);
}
