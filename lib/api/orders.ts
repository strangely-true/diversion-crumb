import { apiRequest } from "@/lib/api/client";

export type MyOrder = {
  id: string;
  orderNumber: string;
  placedAt: string;
  total: number | string;
  status: string;
};

export async function fetchMyOrders() {
  return apiRequest<MyOrder[]>("/api/orders");
}
