import Image from "next/image";

export default function Footer() {
    return (
        <footer className="border-t border-[#f3e3cf] bg-[#FFF4E6] px-6 py-10">
            <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <Image
                        src="/images/sweetcrumbs-logo.svg"
                        alt="SweetCrumbs Bakery logo"
                        width={190}
                        height={50}
                    />
                    <p className="mt-2 text-sm text-[#555555]">
                        Premium artisan bakery delivering fresh cakes, breads, and pastries.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold">Social</h4>
                    <ul className="mt-2 space-y-2 text-sm text-[#555555]">
                        <li>Instagram</li>
                        <li>Facebook</li>
                        <li>Pinterest</li>
                    </ul>
                </div>

                <div className="text-sm text-[#555555] lg:text-right">
                    © {new Date().getFullYear()} SweetCrumbs Bakery. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
