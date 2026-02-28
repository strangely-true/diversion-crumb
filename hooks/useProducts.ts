"use client";

import useSWR from "swr";
import type { Product } from "@/lib/products";
import { fetchProducts } from "@/lib/api/products";

export function useProducts() {
  const { data, isLoading, error } = useSWR<Product[]>(
    "products",
    fetchProducts,
    {
      // Don't re-fetch just because the user switched browser tabs
      revalidateOnFocus: false,
      // Deduplicate identical requests made within 60 s
      dedupingInterval: 60 * 1000,
      // Keep showing stale data while a background revalidation is running
      keepPreviousData: true,
    },
  );

  return {
    products: data ?? [],
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch products."
      : null,
  };
}
