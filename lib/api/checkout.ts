import { apiRequest } from "@/lib/api/client";

export async function createOrderFromCart(input: {
  cartId: string;
  agentSessionId?: string;
  shippingAddress: {
    fullName: string;
    phone?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  notes?: string;
}) {
  return apiRequest<{ id: string; total: number | string; currency: string }>("/api/orders", {
    method: "POST",
    body: input,
  });
}

export async function processMockPayment(input: {
  orderId: string;
  amount?: number;
  method?: "CARD" | "WALLET" | "CASH";
  forceResult?: "success" | "failure";
}) {
  return apiRequest<{ paymentResult: "success" | "failure" }>("/api/payments", {
    method: "POST",
    body: {
      orderId: input.orderId,
      amount: input.amount,
      method: input.method ?? "CARD",
      forceResult: input.forceResult,
    },
  });
}
