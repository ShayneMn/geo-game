import type { Country } from "@/types";

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getParentCountry(
  geo: { properties?: { name?: string } } | null | undefined,
  countries: Country[],
): string {
  const name = geo?.properties?.name ?? "";
  const country = countries.find((c) => c.name === name);
  return country?.meta?.belongsTo ?? name;
}