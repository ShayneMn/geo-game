"use client";

import { useState, useEffect } from "react";
import { shuffleArray } from "@/lib/utils";
import countriesJson from "@/data/countries.json";
import type { Country, CountryMeta } from "@/types";

type CountryMetaMap = Record<string, CountryMeta>;

const COUNTRIES_DATA: CountryMetaMap = countriesJson;

function getRandomCountries(countriesData: CountryMetaMap, amount: number) {
  const countries = Object.entries(countriesData)
    .filter(([, meta]) => !meta.belongsTo)
    .map(([name, meta]) => ({ name, meta }));

  return shuffleArray(countries).slice(0, amount);
}

export function useRandomCountries(amount: number) {
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    setCountries(getRandomCountries(COUNTRIES_DATA, amount));
  }, [amount]);

  return countries;
}