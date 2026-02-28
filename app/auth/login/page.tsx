"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "").trim();

        if (!email.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setSuccess("Login successful.");
    }

    return (
        <section className="bg-[#FFF4E6] px-6 py-12">
            <div className="mx-auto max-w-md rounded-xl bg-white p-8 shadow-md">
                <h1 className="text-3xl font-bold">Login</h1>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                        className="w-full bg-white"
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        className="w-full bg-white"
                    />
                    <button
                        type="submit"
                        className="w-full bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                    >
                        Login
                    </button>
                </form>

                {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
                {success ? <p className="mt-4 text-sm text-green-700">{success}</p> : null}

                <p className="mt-4 text-sm text-[#666666]">
                    No account?{" "}
                    <Link href="/auth/signup" className="font-semibold underline">
                        Create one
                    </Link>
                </p>
            </div>
        </section>
    );
}
