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

type CartProduct = Pick<Product, "id" | "name" | "price">;

type CartContextType = {
    cartItems: CartItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    totalItems: number;
    toastMessage: string;
    addToCart: (product: CartProduct) => void;
    increaseQuantity: (id: string) => void;
    decreaseQuantity: (id: string) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    removeFromCart: (id: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        if (typeof window === "undefined") {
            return [];
        }
        return safeParseCartItems(localStorage.getItem(CART_STORAGE_KEY));
    });
    const [toastMessage, setToastMessage] = useState("");

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

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
        setToastMessage(`${product.name} added to cart`);
    }, []);

    const increaseQuantity = useCallback((id: string) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
            ),
        );
    }, []);

    const decreaseQuantity = useCallback((id: string) => {
        setCartItems((prev) =>
            prev
                .map((item) =>
                    item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
                )
                .filter((item) => item.quantity > 0),
        );
    }, []);

    const removeItem = useCallback((id: string) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

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
            cartItems,
            subtotal,
            tax,
            shipping,
            total,
            totalItems,
            toastMessage,
            addToCart,
            increaseQuantity,
            decreaseQuantity,
            removeItem,
            clearCart,
            removeFromCart: removeItem,
        }),
        [
            cartItems,
            subtotal,
            tax,
            shipping,
            total,
            totalItems,
            toastMessage,
            addToCart,
            increaseQuantity,
            decreaseQuantity,
            removeItem,
            clearCart,
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
