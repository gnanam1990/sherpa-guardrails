export function parseUsdc(amount: string): bigint {
  if (!/^\d+(\.\d{1,6})?$/.test(amount)) {
    throw new Error("USDC amount must be a positive decimal with up to 6 places");
  }

  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = `${fraction}000000`.slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(paddedFraction);
}

export function formatUsdc(amount: bigint): string {
  const sign = amount < 0n ? "-" : "";
  const absolute = amount < 0n ? -amount : amount;
  const whole = absolute / 1_000_000n;
  const fraction = (absolute % 1_000_000n).toString().padStart(6, "0");
  const trimmed = fraction.replace(/0+$/, "");
  return `${sign}${whole.toString()}${trimmed ? `.${trimmed}` : ""}`;
}
