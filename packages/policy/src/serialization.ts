import type { CounterpartyPolicy, HexAddress, SpendPolicy } from "./types.js";

type SerializableCounterpartyPolicy = Omit<
  CounterpartyPolicy,
  "dailyCapBaseUnits" | "spentTodayBaseUnits"
> & {
  dailyCapBaseUnits: string;
  spentTodayBaseUnits: string;
};

export type SerializableSpendPolicy = Omit<
  SpendPolicy,
  | "balanceBaseUnits"
  | "perTxCapBaseUnits"
  | "dailyCapBaseUnits"
  | "spentTodayBaseUnits"
  | "counterparties"
> & {
  balanceBaseUnits: string;
  perTxCapBaseUnits: string;
  dailyCapBaseUnits: string;
  spentTodayBaseUnits: string;
  counterparties: SerializableCounterpartyPolicy[];
};

export function toSerializablePolicy(
  policy: SpendPolicy,
): SerializableSpendPolicy {
  return {
    ...policy,
    balanceBaseUnits: policy.balanceBaseUnits.toString(),
    perTxCapBaseUnits: policy.perTxCapBaseUnits.toString(),
    dailyCapBaseUnits: policy.dailyCapBaseUnits.toString(),
    spentTodayBaseUnits: policy.spentTodayBaseUnits.toString(),
    counterparties: policy.counterparties.map((counterparty) => ({
      ...counterparty,
      dailyCapBaseUnits: counterparty.dailyCapBaseUnits.toString(),
      spentTodayBaseUnits: counterparty.spentTodayBaseUnits.toString(),
    })),
  };
}

export function fromSerializablePolicy(
  policy: SerializableSpendPolicy,
): SpendPolicy {
  return {
    ...policy,
    agent: policy.agent as HexAddress,
    balanceBaseUnits: BigInt(policy.balanceBaseUnits),
    perTxCapBaseUnits: BigInt(policy.perTxCapBaseUnits),
    dailyCapBaseUnits: BigInt(policy.dailyCapBaseUnits),
    spentTodayBaseUnits: BigInt(policy.spentTodayBaseUnits),
    counterparties: policy.counterparties.map((counterparty) => ({
      ...counterparty,
      address: counterparty.address as HexAddress,
      dailyCapBaseUnits: BigInt(counterparty.dailyCapBaseUnits),
      spentTodayBaseUnits: BigInt(counterparty.spentTodayBaseUnits),
    })),
  };
}
