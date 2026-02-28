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
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-bold">Customer Information</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input name="firstName" required placeholder="First name" className="bg-white" />
                <input name="lastName" required placeholder="Last name" className="bg-white" />
                <input
                    name="email"
                    required
                    type="email"
                    placeholder="Email address"
                    className="bg-white sm:col-span-2"
                />
                <input name="phone" required placeholder="Phone" className="bg-white sm:col-span-2" />
            </div>

            <h3 className="mt-6 text-lg font-semibold">Shipping Address</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input name="address" required placeholder="Street address" className="bg-white sm:col-span-2" />
                <input name="city" required placeholder="City" className="bg-white" />
                <input name="postalCode" required placeholder="Postal code" className="bg-white" />
                <input name="country" required placeholder="Country" className="bg-white sm:col-span-2" />
            </div>

            <div className="mt-6 rounded-lg border border-[#f1e0c6] bg-[#FFF4E6] p-4 text-sm">
                <p className="font-semibold">Payment</p>
                <p className="mt-1 text-[#555555]">
                    Secure card payment powered by Stripe (mock integration).
                </p>
            </div>

            <button
                type="submit"
                disabled={isSubmitting || amount <= 0}
                className="mt-6 w-full bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-60"
            >
                {isSubmitting ? "Processing..." : `Pay $${amount.toFixed(2)}`}
            </button>

            {message ? (
                <p className="mt-3 rounded-lg bg-[#FCEFEF] p-3 text-sm text-[#5f4a2a]">{message}</p>
            ) : null}
        </form>
    );
}
