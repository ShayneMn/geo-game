"use client";

import { useState } from "react";
import WorldMap from "./components/WorldMap";

export default function Home() {
  const countries = [
    "Russia",
    "France",
    "Germany",
    "Ireland",
    "China",
    "Chile",
    "Canada",
    "New Zealand",
    "Kenya",
    "Malta",
    "Mali",
    "India",
    "Australia",
    "Brazil",
    "Argentina",
    "South Africa",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const currentCountry = countries[currentIndex];

  const handleCorrectAnswer = () => {
    if (currentIndex < countries.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      alert("Game Complete 🎉");
    }
  };

  return (
    <main>
      <p className="absolute top-2 right-1/2 capitalize font-bold bg-orange-200 text-lg py-2 px-6 rounded-md tracking-wider shadow-lg">
        {currentCountry}
      </p>

      <WorldMap
        targetCountry={currentCountry}
        onCorrect={handleCorrectAnswer}
      />
    </main>
  );
}
