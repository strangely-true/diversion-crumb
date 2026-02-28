import Image from "next/image";

export default function Footer() {
    return (
        <footer className="border-t border-[color:var(--border)] bg-[linear-gradient(120deg,var(--surface-3)_0%,var(--bg)_65%)] px-6 py-12">
            <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <Image
                        src="/images/crumbs-and-co-logo.svg"
                        alt="Crumbs & Co. logo"
                        width={190}
                        height={50}
                        className="logo-mark"
                    />
                    <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                        Premium artisan bakery delivering fresh cakes, breads, and pastries.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold text-[color:var(--text-strong)]">Social</h4>
                    <ul className="mt-3 space-y-2 text-sm text-[color:var(--text-muted)]">
                        <li>Instagram</li>
                        <li>Facebook</li>
                        <li>Pinterest</li>
                    </ul>
                </div>

                <div className="text-sm text-[color:var(--text-muted)] lg:text-right">
                    © {new Date().getFullYear()} Crumbs & Co. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
