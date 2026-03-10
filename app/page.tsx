"use client";

import { useState } from "react";
import WorldMap from "./components/WorldMap";
import { useRandomCountries } from "@/hooks/useRandomCountries";

export default function Home() {
  const countries = useRandomCountries(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCountries, setCorrectCountries] = useState<Set<string>>(
    new Set(),
  );

  const currentCountry = countries[currentIndex];

  const handleCorrectAnswer = () => {
    if (currentIndex < countries.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      alert("Game Complete 🎉");
    }
  };

  if (!countries.length) return null;

  return (
    <main>
      {currentCountry && (
        <p className="absolute top-2 right-1/2 capitalize font-bold bg-orange-200 text-lg py-2 px-6 rounded-md tracking-wider shadow-lg">
          {currentCountry.name}
        </p>
      )}

      <WorldMap
        countries={countries}
        targetCountry={currentCountry?.name || ""}
        correctCountries={correctCountries}
        setCorrectCountries={setCorrectCountries}
        onCorrect={handleCorrectAnswer}
      />
    </main>
  );
}
