"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { fetchProducts } from "@/lib/api/products";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProducts();
        if (isActive) {
          setProducts(data);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to fetch products.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    products,
    isLoading,
    error,
  };
}
