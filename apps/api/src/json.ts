export function parseJson(value: string): unknown {
  if (!value.trim()) return undefined;
  return JSON.parse(value) as unknown;
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, item: unknown) =>
      typeof item === "bigint" ? item.toString() : item,
    2,
  );
}
