"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { Product } from "@/lib/products";
import {
    CART_STORAGE_KEY,
    calculateCartTotals,
    safeParseCartItems,
} from "@/lib/cartUtils";
import type { CartItem } from "@/types/cart";
import {
    addCartItem,
    getCart,
    removeCartItem,
    updateCartItem,
    type BackendCartResponse,
} from "@/lib/api/cart";

type CartProduct = Pick<Product, "id" | "name" | "price">;

/** Maximum discount the system may ever grant. Matches the server-side policy cap. */
const MAX_DISCOUNT_PERCENT = 20;

const GUEST_SESSION_STORAGE_KEY = "bakery_guest_session_id";

function getOrCreateGuestSessionId() {
    if (typeof window === "undefined") {
        return undefined;
    }

    const existing = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (existing) {
        return existing;
    }

    const created = crypto.randomUUID();
    localStorage.setItem(GUEST_SESSION_STORAGE_KEY, created);
    return created;
}

function mapBackendCartItems(cart: BackendCartResponse): CartItem[] {
    return cart.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        name: `${item.variant.product.name} (${item.variant.label})`,
        price: Number(item.unitPrice),
        quantity: item.quantity,
    }));
}

type CartContextType = {
    cartId: string | null;
    cartItems: CartItem[];
    subtotal: number;
    discount: number;
    discountPercent: number;
    tax: number;
    shipping: number;
    total: number;
    totalItems: number;
    toastMessage: string;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    addToCart: (product: CartProduct) => void;
    increaseQuantity: (id: string) => void;
    decreaseQuantity: (id: string) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    removeFromCart: (id: string) => void;
    reloadCart: () => Promise<void>;
    applyDiscount: (percent: number) => void;
    clearDiscount: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartId, setCartId] = useState<string | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        if (typeof window === "undefined") {
            return [];
        }
        return safeParseCartItems(localStorage.getItem(CART_STORAGE_KEY));
    });
    // Discount is intentionally NOT read from localStorage — it must be server-sourced.
    // It is rehydrated below from /api/vapi/conversation/approved-discount.
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [toastMessage, setToastMessage] = useState("");
    const [isCartOpen, setIsCartOpen] = useState(false);
    const openCart = useCallback(() => setIsCartOpen(true), []);
    const closeCart = useCallback(() => setIsCartOpen(false), []);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    // On mount, rehydrate the approved discount from the server so localStorage
    // cannot be tampered with to show a false discount in the UI.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const sessionId = localStorage.getItem("bakery_agent_session");
        if (!sessionId) return;

        void fetch(`/api/vapi/conversation/approved-discount?sessionId=${encodeURIComponent(sessionId)}`)
            .then(async (res) => {
                if (!res.ok) return;
                const data = await res.json() as { approvedDiscountPercent?: number | null };
                const raw = data.approvedDiscountPercent;
                if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
                    // Enforce the server-side policy cap on the client too.
                    setDiscountPercent(Math.min(MAX_DISCOUNT_PERCENT, raw));
                }
            })
            .catch(() => { /* non-critical — starts at 0 */ });
    }, []);

    const applyDiscount = useCallback((percent: number) => {
        if (!Number.isFinite(percent) || percent < 0) return;
        // Hard cap — never apply more than the policy maximum, regardless of caller.
        const clamped = Math.min(MAX_DISCOUNT_PERCENT, percent);
        setDiscountPercent(clamped);
        if (clamped > 0) setToastMessage(`${clamped}% discount applied to your order!`);
    }, []);

    const clearDiscount = useCallback(() => {
        setDiscountPercent(0);
    }, []);

    const reloadCart = useCallback(async () => {
        try {
            const cart = await getCart({
                currency: "USD",
                sessionId: getOrCreateGuestSessionId(),
            });
            setCartId(cart.id);
            setCartItems(mapBackendCartItems(cart));
        } catch {
            // Keep local state fallback if API is unavailable.
        }
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        void reloadCart();
    }, [reloadCart]);

    useEffect(() => {
        if (!toastMessage) {
            return;
        }
        const timeoutId = window.setTimeout(() => {
            setToastMessage("");
        }, 2000);

        return () => window.clearTimeout(timeoutId);
    }, [toastMessage]);

    const addToCart = useCallback((product: CartProduct) => {
        // Optimistic update for instant UI feedback
        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            }
            return [...prev, { id: product.id, variantId: product.id, name: product.name, price: product.price, quantity: 1 }];
        });
        setToastMessage(`${product.name} added to cart`);

        // Reconcile with backend
        void addCartItem({
            variantId: product.id,
            quantity: 1,
            currency: "USD",
            sessionId: getOrCreateGuestSessionId(),
        })
            .then((cart) => {
                setCartId(cart.id);
                setCartItems(mapBackendCartItems(cart));
            })
            .catch(() => {
                // Optimistic update already applied as fallback
            });
    }, []);

    const increaseQuantity = useCallback((id: string) => {
        const target = cartItems.find((item) => item.id === id);
        if (!target) {
            return;
        }

        // Optimistic update for instant UI feedback
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
            ),
        );

        void updateCartItem(id, target.quantity + 1, getOrCreateGuestSessionId())
            .then((cart) => {
                setCartId(cart.id);
                setCartItems(mapBackendCartItems(cart));
            })
            .catch(() => { });
    }, [cartItems]);

    const decreaseQuantity = useCallback((id: string) => {
        const target = cartItems.find((item) => item.id === id);
        if (!target) {
            return;
        }

        if (target.quantity <= 1) {
            // Optimistic removal
            setCartItems((prev) => prev.filter((item) => item.id !== id));

            void removeCartItem(id, getOrCreateGuestSessionId())
                .then((cart) => {
                    setCartId(cart.id);
                    setCartItems(mapBackendCartItems(cart));
                })
                .catch(() => { });
            return;
        }

        // Optimistic decrement
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
            ),
        );

        void updateCartItem(id, target.quantity - 1, getOrCreateGuestSessionId())
            .then((cart) => {
                setCartId(cart.id);
                setCartItems(mapBackendCartItems(cart));
            })
            .catch(() => { });
    }, [cartItems]);

    const removeItem = useCallback((id: string) => {
        // Optimistic removal
        setCartItems((prev) => prev.filter((item) => item.id !== id));

        void removeCartItem(id, getOrCreateGuestSessionId())
            .then((cart) => {
                setCartId(cart.id);
                setCartItems(mapBackendCartItems(cart));
            })
            .catch(() => { });
    }, []);

    const clearCart = useCallback(() => {
        const sessionId = getOrCreateGuestSessionId();
        void Promise.all(cartItems.map((item) => removeCartItem(item.id, sessionId).catch(() => null))).then(() => {
            setCartItems([]);
        });
    }, [cartItems]);

    const totalItems = useMemo(
        () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
        [cartItems],
    );

    const { subtotal, discount, tax, shipping, total } = useMemo(
        () => calculateCartTotals(cartItems, discountPercent),
        [cartItems, discountPercent],
    );

    const contextValue = useMemo(
        () => ({
            cartId,
            cartItems,
            subtotal,
            discount,
            discountPercent,
            tax,
            shipping,
            total,
            totalItems,
            toastMessage,
            isCartOpen,
            openCart,
            closeCart,
            addToCart,
            increaseQuantity,
            decreaseQuantity,
            removeItem,
            clearCart,
            removeFromCart: removeItem,
            reloadCart,
            applyDiscount,
            clearDiscount,
        }),
        [
            cartId,
            cartItems,
            subtotal,
            discount,
            discountPercent,
            tax,
            shipping,
            total,
            totalItems,
            toastMessage,
            isCartOpen,
            openCart,
            closeCart,
            addToCart,
            increaseQuantity,
            decreaseQuantity,
            removeItem,
            clearCart,
            reloadCart,
            applyDiscount,
            clearDiscount,
        ],
    );

    return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}
