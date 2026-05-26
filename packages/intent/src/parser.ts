import type { HexAddress, SpendAttempt } from "@sherpa/policy";
import type { CounterpartyAlias, PaymentIntent } from "./types.js";

const USDC_BASE = 1_000_000n;
const ETH_ADDRESS_PATTERN = /0x[a-fA-F0-9]{40}/;

export const defaultCounterparties: CounterpartyAlias[] = [
  {
    label: "x402 API Provider",
    address: "0x000000000000000000000000000000000000dEaD",
    aliases: [
      "x402 api provider",
      "x402 provider",
      "vector search",
      "api provider",
      "paid api",
      "premium data",
      "data provider",
      "x402",
      "api",
      "provider",
    ],
    defaultAction: "x402_api_call",
  },
  {
    label: "Unknown vendor",
    address: "0x000000000000000000000000000000000000bEEF",
    aliases: [
      "unknown vendor",
      "blocked vendor",
      "random vendor",
      "untrusted vendor",
      "untrusted",
    ],
    defaultAction: "unknown_vendor_payment",
  },
];

export const demoPaymentIntents = [
  "Pay 8 USDC to the x402 API provider for vector search",
  "Try to pay 60 USDC to the x402 API provider for premium data",
  "Pay 5 USDC to the unknown vendor for a scraped lead list",
];

export function parsePaymentIntent(
  input: string,
  counterparties: CounterpartyAlias[] = defaultCounterparties,
): PaymentIntent {
  const normalizedInput = input.trim();
  if (!normalizedInput) throw new Error("payment intent input is required");

  const amountText = extractAmountText(normalizedInput);
  if (!amountText) {
    throw new Error("payment intent must include a USDC amount");
  }

  const lowerInput = normalizedInput.toLowerCase();
  const warnings: string[] = [];
  const amountBaseUnits = parseUsdcAmount(amountText);
  const amountUsdc = normalizeUsdcAmount(amountText);
  const counterparty = resolveCounterparty(normalizedInput, counterparties);

  if (!mentionsCurrency(normalizedInput)) {
    warnings.push("No USDC currency marker found; parsed the first standalone amount.");
  }

  if (counterparty.source === "fallback") {
    warnings.push(
      "No known counterparty alias matched; routed to the blocked Unknown vendor policy.",
    );
  }

  if (counterparty.source === "address") {
    warnings.push("Counterparty came from a raw address; policy allowlist decides safety.");
  }

  const action = inferAction(lowerInput, counterparty.match?.defaultAction);

  return {
    input: normalizedInput,
    amountUsdc,
    amountBaseUnits,
    counterparty: counterparty.address,
    counterpartyLabel: counterparty.label,
    action,
    confidence: scoreConfidence(warnings),
    warnings,
  };
}

export function toSpendAttempt(intent: PaymentIntent): SpendAttempt {
  return {
    counterparty: intent.counterparty,
    amountBaseUnits: intent.amountBaseUnits,
    action: intent.action,
  };
}

export function parseUsdcAmount(value: string): bigint {
  const [wholeRaw, fractionRaw = ""] = value.trim().split(".");
  if (!wholeRaw || !/^\d+$/.test(wholeRaw)) {
    throw new Error("USDC amount must start with whole-number digits");
  }
  if (!/^\d*$/.test(fractionRaw)) {
    throw new Error("USDC amount has an invalid decimal fraction");
  }
  if (fractionRaw.length > 6) {
    throw new Error("USDC amount supports up to 6 decimal places");
  }

  const whole = BigInt(wholeRaw) * USDC_BASE;
  const fraction = BigInt((fractionRaw || "0").padEnd(6, "0"));
  return whole + fraction;
}

export function normalizeUsdcAmount(value: string): string {
  const [wholeRaw, fractionRaw = ""] = value.trim().split(".");
  const whole = BigInt(wholeRaw).toString();
  const fraction = fractionRaw.replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function extractAmountText(input: string): string | undefined {
  const patterns = [
    /\b(\d+(?:\.\d{1,12})?)\s*(?:USDC|USD)\b/i,
    /\b(?:USDC|USD)\s*(\d+(?:\.\d{1,12})?)\b/i,
    /\$\s*(\d+(?:\.\d{1,12})?)/,
    /(?:^|[^\w.])(\d+(?:\.\d{1,12})?)(?:$|[^\w.])/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) return match[1];
  }

  return undefined;
}

function mentionsCurrency(input: string): boolean {
  return /\b(?:USDC|USD)\b|\$/.test(input);
}

type CounterpartyResolution = {
  address: HexAddress;
  label: string;
  source: "alias" | "address" | "fallback";
  match?: CounterpartyAlias;
};

function resolveCounterparty(
  input: string,
  counterparties: CounterpartyAlias[],
): CounterpartyResolution {
  const addressMatch = input.match(ETH_ADDRESS_PATTERN)?.[0];
  if (addressMatch) {
    const explicitAddress = addressMatch as HexAddress;
    const match = counterparties.find(
      (counterparty) =>
        counterparty.address.toLowerCase() === explicitAddress.toLowerCase(),
    );

    return {
      address: explicitAddress,
      label: match?.label ?? "Raw address counterparty",
      source: "address",
      match,
    };
  }

  const lowerInput = input.toLowerCase();
  const aliasMatches = counterparties
    .flatMap((counterparty) =>
      counterparty.aliases.map((alias) => ({ alias, counterparty })),
    )
    .filter(({ alias }) => lowerInput.includes(alias.toLowerCase()))
    .sort((left, right) => right.alias.length - left.alias.length);

  const bestMatch = aliasMatches[0]?.counterparty;
  if (bestMatch) {
    return {
      address: bestMatch.address,
      label: bestMatch.label,
      source: "alias",
      match: bestMatch,
    };
  }

  const fallback =
    counterparties.find((counterparty) =>
      counterparty.label.toLowerCase().includes("unknown"),
    ) ?? counterparties[0];

  if (!fallback) throw new Error("at least one counterparty alias is required");

  return {
    address: fallback.address,
    label: fallback.label,
    source: "fallback",
    match: fallback,
  };
}

function inferAction(input: string, fallback = "agent_payment"): string {
  if (input.includes("vector") || input.includes("search")) {
    return "x402_vector_search";
  }
  if (input.includes("data")) {
    return "paid_data_access";
  }
  if (input.includes("x402") || input.includes("api")) {
    return "x402_api_call";
  }
  if (input.includes("compute") || input.includes("job")) {
    return "compute_job";
  }
  if (input.includes("subscription") || input.includes("renewal")) {
    return "subscription_payment";
  }
  return fallback;
}

function scoreConfidence(warnings: string[]): number {
  return Math.max(0.45, Number((0.94 - warnings.length * 0.17).toFixed(2)));
}
