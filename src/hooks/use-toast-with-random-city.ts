"use client";

import { useToast } from "@/hooks/use-toast";

const cities = [
  "Tokyo", "New York", "London", "Paris", "Singapore",
  "Dubai", "Hong Kong", "Los Angeles", "Sydney", "Berlin",
  "Toronto", "Seoul", "Moscow", "Mumbai", "Sao Paulo",
  "Lagos", "Cairo", "Buenos Aires", "Mexico City", "Istanbul"
];

export function useToastWithRandomCity() {
  const { toast } = useToast();

  const showRandomCityToast = (amount: number) => {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    toast({
      title: "New Order Processed",
      description: `From ${randomCity} - $${amount.toFixed(2)}`,
      duration: 3000,
    });
  };

  return { showRandomCityToast };
}
