"use client";

import { FormEvent, useState } from "react";
import { createMockStripeCheckout } from "@/lib/stripe";

type CheckoutFormProps = {
    amount: number;
};

export default function CheckoutForm({ amount }: CheckoutFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage("");

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "");

        const result = await createMockStripeCheckout({ amount, email });
        setMessage(
            `Payment session created: ${result.sessionId}. Redirect URL: ${result.checkoutUrl}`,
        );
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
