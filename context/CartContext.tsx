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
import { CART_STORAGE_KEY, calculateCartTotals, safeParseCartItems } from "@/lib/cartUtils";
import type { CartItem } from "@/types/cart";
import {
    addCartItem,
    getCart,
    removeCartItem,
    updateCartItem,
    type BackendCartResponse,
} from "@/lib/api/cart";

type CartProduct = Pick<Product, "id" | "name" | "price">;

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
        name: `${item.variant.product.name} (${item.variant.label})`,
        price: Number(item.unitPrice),
        quantity: item.quantity,
    }));
}

type CartContextType = {
    cartId: string | null;
    cartItems: CartItem[];
    subtotal: number;
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
                setCartItems((prev) => {
                    const existing = prev.find((item) => item.id === product.id);
                    if (existing) {
                        return prev.map((item) =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item,
                        );
                    }

                    return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
                });
            });
        setToastMessage(`${product.name} added to cart`);
    }, [cartItems]);

    const increaseQuantity = useCallback((id: string) => {
        const target = cartItems.find((item) => item.id === id);
        if (!target) {
            return;
        }

        void updateCartItem(id, target.quantity + 1, getOrCreateGuestSessionId())
            .then((cart) => {
                setCartId(cart.id);
                setCartItems(mapBackendCartItems(cart));
            })
            .catch(() => {
                setCartItems((prev) =>
                    prev.map((item) =>
                        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
                    ),
                );
            });
    }, []);

    const decreaseQuantity = useCallback((id: string) => {
        const target = cartItems.find((item) => item.id === id);
        if (!target) {
            return;
        }

        if (target.quantity <= 1) {
            void removeCartItem(id, getOrCreateGuestSessionId())
                .then((cart) => {
                    setCartId(cart.id);
                    setCartItems(mapBackendCartItems(cart));
                })
                .catch(() => {
                    setCartItems((prev) => prev.filter((item) => item.id !== id));
                });
            return;
        }

        void updateCartItem(id, target.quantity - 1, getOrCreateGuestSessionId())
            .then((cart) => {
                setCartId(cart.id);
                setCartItems(mapBackendCartItems(cart));
            })
            .catch(() => {
                setCartItems((prev) =>
                    prev
                        .map((item) =>
                            item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
                        )
                        .filter((item) => item.quantity > 0),
                );
            });
    }, [cartItems]);

    const removeItem = useCallback((id: string) => {
        void removeCartItem(id, getOrCreateGuestSessionId())
            .then((cart) => {
                setCartId(cart.id);
                setCartItems(mapBackendCartItems(cart));
            })
            .catch(() => {
                setCartItems((prev) => prev.filter((item) => item.id !== id));
            });
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

    const { subtotal, tax, shipping, total } = useMemo(
        () => calculateCartTotals(cartItems),
        [cartItems],
    );

    const contextValue = useMemo(
        () => ({
            cartId,
            cartItems,
            subtotal,
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
        }),
        [
            cartId,
            cartItems,
            subtotal,
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
