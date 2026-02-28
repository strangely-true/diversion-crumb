import Link from "next/link";

type CartSummaryProps = {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    ctaLabel?: string;
    ctaHref?: string;
    showCheckoutButton?: boolean;
};

export default function CartSummary({
    subtotal,
    tax,
    shipping,
    total,
    ctaLabel = "Proceed to Checkout",
    ctaHref = "/checkout",
    showCheckoutButton = true,
}: CartSummaryProps) {
    return (
        <aside className="bg-white shadow-md rounded-xl p-4">
            <h2 className="text-xl font-bold">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>Tax (5%)</span>
                    <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[#f1e0c6] pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>

            {showCheckoutButton ? (
                <Link
                    href={ctaHref}
                    className="mt-5 block w-full bg-[#FFD580] text-center text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                >
                    {ctaLabel}
                </Link>
            ) : null}
        </aside>
    );
}
