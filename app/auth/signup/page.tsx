"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "").trim();
        const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

        if (!email.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSuccess("Account created successfully.");
    }

    return (
        <section className="bg-white px-6 py-12">
            <div className="mx-auto max-w-md rounded-xl bg-[#FCEFEF] p-8 shadow-md">
                <h1 className="text-3xl font-bold">Create Account</h1>
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
                    <input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        required
                        className="w-full bg-white"
                    />
                    <button
                        type="submit"
                        className="w-full bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                    >
                        Sign Up
                    </button>
                </form>

                {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
                {success ? <p className="mt-4 text-sm text-green-700">{success}</p> : null}

                <p className="mt-4 text-sm text-[#666666]">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="font-semibold underline">
                        Login
                    </Link>
                </p>
            </div>
        </section>
    );
}
