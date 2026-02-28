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
        <aside className="sticky top-8 h-fit rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-8 shadow-[var(--shadow-strong)]">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
                    <svg className="h-5 w-5 text-[color:var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Order Summary</h2>
            </div>
            
            <div className="space-y-4 border-b border-[color:var(--border)] pb-5">
                <div className="flex items-center justify-between text-[color:var(--text-muted)]">
                    <span className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Subtotal
                    </span>
                    <span className="font-semibold text-[color:var(--text-primary)]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[color:var(--text-muted)]">
                    <span className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Tax (5%)
                    </span>
                    <span className="font-semibold text-[color:var(--text-primary)]">${tax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[color:var(--text-muted)]">
                    <span className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Shipping
                    </span>
                    <span className="font-semibold">
                        {shipping === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                        ) : (
                            <span className="text-[color:var(--text-primary)]">${shipping.toFixed(2)}</span>
                        )}
                    </span>
                </div>
            </div>
            
            <div className="my-6 flex items-center justify-between">
                <span className="text-lg font-semibold text-[color:var(--text-strong)]">Total</span>
                <span className="text-3xl font-bold text-[color:var(--accent)]">${total.toFixed(2)}</span>
            </div>

            {showCheckoutButton ? (
                <Link
                    href={ctaHref}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] px-6 py-4 text-center font-semibold text-[color:var(--accent-contrast)] shadow-[var(--shadow-strong)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)] active:scale-95"
                >
                    {ctaLabel}
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            ) : null}
        </aside>
    );
}
