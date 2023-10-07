function getRandomRarity() {
  // Define the rarity tiers and their probabilities
  const rarities = [
    { name: "Common", probability: 0.6 },
    { name: "Uncommon", probability: 0.3 },
    { name: "Rare", probability: 0.08 },
    { name: "Epic", probability: 0.015 },
    { name: "Legendary", probability: 0.005 },
  ];

  // Generate a random number between 0 and 1
  const randomValue = Math.random();

  // Determine the rarity based on the random number and probabilities
  let cumulativeProbability = 0;
  for (const rarity of rarities) {
    cumulativeProbability += rarity.probability;
    if (randomValue <= cumulativeProbability) {
      return rarity.name;
    }
  }

  // Default to Common if no rarity is selected (shouldn't happen)
  return "Common";
}

// Example usage:
const itemRarity = getRandomRarity();
console.log(`You obtained an ${itemRarity} item!`);
