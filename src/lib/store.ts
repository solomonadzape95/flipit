export const STORE_ITEMS = {
  clickFrenzy: {
    id: "clickFrenzy",
    name: "Click Frenzy",
    priceUsd: 0.1,
    description: "10x Gems per click for 30s",
    durationSeconds: 30,
    multiplier: 10,
  },
  gemShower: {
    id: "gemShower",
    name: "Gem Shower",
    priceUsd: 0.25,
    description: "Instantly gain 5,000 Gems",
    grantGems: 5000,
  },
} as const;


