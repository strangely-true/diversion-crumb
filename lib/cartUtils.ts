import type { CartItem } from "@/types/cart";

export const CART_STORAGE_KEY = "crumbs-and-co-cart-v1";

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<CartItem>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.quantity === "number"
  );
}

export function safeParseCartItems(raw: string | null): CartItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidCartItem).map((item) => ({
      id: item.id,
      variantId: item.variantId || item.id,
      name: item.name,
      price: roundToTwo(item.price),
      quantity: Math.max(1, Math.floor(item.quantity)),
    }));
  } catch {
    return [];
  }
}

export function calculateCartTotals(items: CartItem[], discountPercent = 0) {
  const subtotal = roundToTwo(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  const discount =
    discountPercent > 0 ? roundToTwo(subtotal * (discountPercent / 100)) : 0;
  const taxableAmount = roundToTwo(subtotal - discount);
  const tax = roundToTwo(taxableAmount * 0.08);
  const shipping = subtotal === 0 ? 0 : subtotal >= 50 ? 0 : 5;
  const total = roundToTwo(taxableAmount + tax + shipping);

  return { subtotal, discount, tax, shipping, total };
}
