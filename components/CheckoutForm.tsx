"use client";

import { FormEvent, useState } from "react";
import { createOrderFromCart, processMockPayment } from "@/lib/api/checkout";
import { ApiError } from "@/lib/api/client";
import { useAgent } from "@/context/AgentContext";

type CheckoutFormProps = {
    amount: number;
    cartId: string | null;
    onCheckoutComplete: () => Promise<void>;
};

export default function CheckoutForm({ amount, cartId, onCheckoutComplete }: CheckoutFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const { endCall, closeSidebar } = useAgent();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage("");

        const formData = new FormData(event.currentTarget);
        try {
            if (!cartId) {
                setMessage("Cart not ready. Please refresh and try again.");
                setIsSubmitting(false);
                return;
            }

            const firstName = String(formData.get("firstName") ?? "").trim();
            const lastName = String(formData.get("lastName") ?? "").trim();
            const phone = String(formData.get("phone") ?? "").trim();
            const address = String(formData.get("address") ?? "").trim();
            const city = String(formData.get("city") ?? "").trim();
            const postalCode = String(formData.get("postalCode") ?? "").trim();
            const country = String(formData.get("country") ?? "").trim();
            const agentSessionId =
                typeof window !== "undefined"
                    ? localStorage.getItem("bakery_agent_session") ?? undefined
                    : undefined;

            const order = await createOrderFromCart({
                cartId,
                agentSessionId,
                shippingAddress: {
                    fullName: `${firstName} ${lastName}`.trim(),
                    phone,
                    line1: address,
                    city,
                    postalCode,
                    country,
                },
            });

            const payment = await processMockPayment({
                orderId: order.id,
                amount: Number(order.total),
                method: "CARD",
                forceResult: "success",
            });

            await onCheckoutComplete();
            endCall();
            closeSidebar();
            setMessage(`Order ${order.id} created. Payment ${payment.paymentResult}.`);
        } catch (error) {
            const fallback = "Checkout failed. Please try again.";
            setMessage(error instanceof ApiError ? error.message : fallback);
        }
        setIsSubmitting(false);
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-[var(--shadow-soft)]"
        >
            <h2 className="text-xl font-bold text-[color:var(--text-primary)]">
                Customer Information
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                    name="firstName"
                    required
                    placeholder="First name"
                    className="bg-[color:var(--surface-1)]"
                />
                <input
                    name="lastName"
                    required
                    placeholder="Last name"
                    className="bg-[color:var(--surface-1)]"
                />
                <input
                    name="email"
                    required
                    type="email"
                    placeholder="Email address"
                    className="bg-[color:var(--surface-1)] sm:col-span-2"
                />
                <input
                    name="phone"
                    required
                    placeholder="Phone"
                    className="bg-[color:var(--surface-1)] sm:col-span-2"
                />
            </div>

            <h3 className="mt-6 text-lg font-semibold">Shipping Address</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                    name="address"
                    required
                    placeholder="Street address"
                    className="bg-[color:var(--surface-1)] sm:col-span-2"
                />
                <input
                    name="city"
                    required
                    placeholder="City"
                    className="bg-[color:var(--surface-1)]"
                />
                <input
                    name="postalCode"
                    required
                    placeholder="Postal code"
                    className="bg-[color:var(--surface-1)]"
                />
                <input
                    name="country"
                    required
                    placeholder="Country"
                    className="bg-[color:var(--surface-1)] sm:col-span-2"
                />
            </div>

            <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-sm">
                <p className="font-semibold">Payment</p>
                <p className="mt-1 text-[color:var(--text-muted)]">
                    Secure card payment powered by Stripe (mock integration).
                </p>
            </div>

            <button
                type="submit"
                disabled={isSubmitting || amount <= 0}
                className="mt-6 w-full rounded-full bg-[color:var(--accent)] px-4 py-2 font-semibold text-[color:var(--accent-contrast)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
                {isSubmitting ? "Processing..." : `Pay $${amount.toFixed(2)}`}
            </button>

            {message ? (
                <p className="mt-3 rounded-lg bg-[color:var(--surface-2)] p-3 text-sm text-[color:var(--text-muted)]">
                    {message}
                </p>
            ) : null}
        </form>
    );
}
