export type AssetCategory =
  | "money"
  | "cars"
  | "models"
  | "effects"
  | "shapes"
  | "backgrounds";

export type AssetItem = {
  id: string;
  category: AssetCategory;
  name: string;
  src: string;
};

export const ASSETS: AssetItem[] = [
  // money
  { id: "money-money1", category: "money", name: "Money 1", src: "/assets/money/money1.png" },
  { id: "money-money2", category: "money", name: "Money 2", src: "/assets/money/money2.png" },

  // cars
  { id: "cars-car1", category: "cars", name: "Car 1", src: "/assets/cars/car1.png" },

  // backgrounds
  { id: "backgrounds-bg1", category: "backgrounds", name: "Background 1", src: "/assets/backgrounds/bg1.jpg" },
];