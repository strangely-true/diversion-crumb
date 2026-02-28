import Image from "next/image";

const mockOrders = [
    { id: "ORD-1042", date: "2026-01-15", total: 48.0, status: "Delivered" },
    { id: "ORD-0978", date: "2025-12-20", total: 26.0, status: "Delivered" },
    { id: "ORD-0881", date: "2025-11-03", total: 62.0, status: "Delivered" },
];

export default function AccountPage() {
    return (
        <section className="bg-[#FFF4E6] px-6 py-12">
            <div className="mx-auto max-w-6xl space-y-8">
                <h1 className="text-4xl font-bold">My Account</h1>

                <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
                    <div className="rounded-xl bg-white p-6 shadow-md">
                        <h2 className="text-xl font-bold">Profile</h2>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[#f3e3cf]">
                                <Image
                                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80"
                                    alt="Profile picture"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <p className="font-semibold">Jane Baker</p>
                                <p className="text-sm text-[#666666]">SweetCrumbs Member</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                            <p>
                                <span className="font-semibold">Name:</span> Jane Baker
                            </p>
                            <p>
                                <span className="font-semibold">Email:</span> jane@example.com
                            </p>
                            <p>
                                <span className="font-semibold">Address:</span> 17 Meadow Lane,
                                Riverdale
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-md">
                        <h2 className="text-xl font-bold">Order History</h2>
                        <div className="mt-4 space-y-3">
                            {mockOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex flex-col gap-1 rounded-lg border border-[#f1e0c6] bg-[#FFF4E6] p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <p className="font-semibold">{order.id}</p>
                                    <p className="text-sm text-[#555555]">{order.date}</p>
                                    <p className="font-semibold">${order.total.toFixed(2)}</p>
                                    <p className="text-sm">{order.status}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
