import { apiRequest } from "@/lib/api/client";

export type BackendCartResponse = {
  id: string;
  currency: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    variantId: string;
    variant: {
      label: string;
      product: {
        name: string;
      };
    };
  }>;
  summary: {
    subtotal: number;
    itemCount: number;
  };
};

export async function getCart(input: { currency?: string; sessionId?: string }) {
  const searchParams = new URLSearchParams();
  if (input.currency) {
    searchParams.set("currency", input.currency);
  }
  if (input.sessionId) {
    searchParams.set("sessionId", input.sessionId);
  }

  return apiRequest<BackendCartResponse>(`/api/cart?${searchParams.toString()}`);
}

export async function addCartItem(input: {
  variantId: string;
  quantity: number;
  currency?: string;
  sessionId?: string;
}) {
  return apiRequest<BackendCartResponse>("/api/cart/items", {
    method: "POST",
    body: {
      variantId: input.variantId,
      quantity: input.quantity,
      currency: input.currency ?? "USD",
      sessionId: input.sessionId,
    },
  });
}

export async function updateCartItem(itemId: string, quantity: number, sessionId?: string) {
  return apiRequest<BackendCartResponse>(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    body: {
      quantity,
      sessionId,
    },
  });
}

export async function removeCartItem(itemId: string, sessionId?: string) {
  return apiRequest<BackendCartResponse>(`/api/cart/items/${itemId}`, {
    method: "DELETE",
    body: sessionId ? { sessionId } : {},
  });
}
