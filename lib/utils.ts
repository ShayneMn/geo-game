import type { CountryMetaMap } from "@/types";

export function getParentCountry(
  geo: { properties?: { name?: string } } | null | undefined,
  countries: CountryMetaMap,
): string {
  const name = geo?.properties?.name ?? "";
  return countries[name]?.belongsTo ?? name;
}