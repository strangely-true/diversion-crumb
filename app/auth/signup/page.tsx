"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthThemeToggle from "@/components/AuthThemeToggle";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
    const router = useRouter();
    const { signup } = useAuth();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [acceptTerms, setAcceptTerms] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "").trim();
        const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();
        const fullName = String(formData.get("fullName") ?? "").trim();

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

        if (!acceptTerms) {
            setError("Please accept the terms and conditions.");
            return;
        }

        try {
            await signup({
                email,
                password,
                confirmPassword,
                name: fullName || undefined,
            });
            setSuccess("Account created successfully! Redirecting...");
            window.setTimeout(() => {
                router.push("/account");
            }, 600);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Signup failed. Please try again.");
        }
    }

    return (
        <section className="fixed inset-0 overflow-hidden bg-[linear-gradient(135deg,var(--surface-3)_0%,var(--surface-2)_50%,var(--bg)_100%)]">
            <AuthThemeToggle />
            {/* Decorative elements */}
            <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[color:var(--accent)] opacity-10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-[color:var(--accent-strong)] opacity-10 blur-3xl" />
            <div className="pointer-events-none absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-[color:var(--pill)] opacity-5 blur-3xl" />
            
            <div className="relative grid h-screen lg:grid-cols-2">
                {/* Left Side - Branding & Visual */}
                <div className="relative hidden items-center justify-center overflow-hidden bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-strong)_100%)] p-8 lg:flex">
                    {/* Decorative pattern overlay */}
                    <div className="absolute inset-0 opacity-10">
                        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="signup-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <circle cx="20" cy="20" r="1.5" fill="currentColor" />
                                    <circle cx="40" cy="40" r="1.5" fill="currentColor" />
                                </pattern>
                            </defs>
                            <rect x="0" y="0" width="100%" height="100%" fill="url(#signup-pattern)" />
                        </svg>
                    </div>

                    <div className="relative z-10 max-w-sm space-y-4">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                <svg className="h-8 w-8 text-[color:var(--accent-contrast)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                            </div>
                            <span className="font-['Playfair_Display'] text-xl font-bold text-[color:var(--accent-contrast)]">
                                SweetCrumbs
                            </span>
                        </div>

                        {/* Feature image */}
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-[0_16px_30px_rgba(0,0,0,0.2)]">
                            <Image
                                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
                                alt="Fresh artisan breads"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        </div>

                        {/* Welcome text */}
                        <div className="space-y-1.5">
                            <h2 className="font-['Playfair_Display'] text-2xl font-bold leading-tight text-[color:var(--accent-contrast)]">
                                Join the SweetCrumbs Family
                            </h2>
                            <p className="text-sm leading-relaxed text-[color:var(--accent-contrast)]/80">
                                Create your account today and start enjoying freshly baked goods delivered right to your door.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-2.5">
                            {[
                                { icon: "🎁", text: "Get 10% off your first order" },
                                { icon: "⭐", text: "Exclusive member-only deals" },
                                { icon: "🚚", text: "Track your orders in real-time" },
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-base">
                                        {feature.icon}
                                    </div>
                                    <span className="text-sm text-[color:var(--accent-contrast)]/80">
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Signup Form */}
                <div className="relative flex items-center justify-center overflow-y-auto px-8 py-6 lg:px-16 xl:px-24">
                    <div className="w-full max-w-sm space-y-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)]/85 p-5 shadow-[var(--shadow-soft)] backdrop-blur-sm lg:p-6">
                        {/* Header */}
                        <div className="space-y-3">
                            {/* Mobile logo */}
                            <div className="mb-4 flex items-center gap-3 lg:hidden">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
                                    <svg className="h-6 w-6 text-[color:var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                </div>
                                <span className="font-['Playfair_Display'] text-2xl font-bold text-[color:var(--text-primary)]">
                                    SweetCrumbs
                                </span>
                            </div>

                            <div>
                                <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[color:var(--text-primary)] lg:text-3xl">
                                    Create Account
                                </h1>
                                <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                                    Start your sweet journey with us today
                                </p>
                            </div>
                        </div>

                        {/* Social signup options */}
                        <div className="space-y-3">
                            <button
                                type="button"
                                className="group flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[color:var(--border)] bg-[color:var(--surface-1)] px-5 py-3 text-sm font-semibold text-[color:var(--text-strong)] transition-all hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)] hover:shadow-[var(--shadow-soft)]"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span>Sign up with Google</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-[color:var(--border)]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-[color:var(--bg)] px-4 font-medium text-[color:var(--text-muted)]">
                                    Or sign up with email
                                </span>
                            </div>
                        </div>

                        {/* Signup Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">
                            Full Name
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <svg className="h-5 w-5 text-[color:var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                placeholder="Jane Doe"
                                className="w-full rounded-xl border-2 border-[color:var(--border)] bg-[color:var(--surface-2)] py-2.5 pl-12 pr-4 text-[color:var(--text-primary)] transition-all focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <svg className="h-5 w-5 text-[color:var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                className="w-full rounded-xl border-2 border-[color:var(--border)] bg-[color:var(--surface-2)] py-2.5 pl-12 pr-4 text-[color:var(--text-primary)] transition-all focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">
                            Password
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <svg className="h-5 w-5 text-[color:var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="w-full rounded-xl border-2 border-[color:var(--border)] bg-[color:var(--surface-2)] py-2.5 pl-12 pr-4 text-[color:var(--text-primary)] transition-all focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <svg className="h-5 w-5 text-[color:var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="w-full rounded-xl border-2 border-[color:var(--border)] bg-[color:var(--surface-2)] py-2.5 pl-12 pr-4 text-[color:var(--text-primary)] transition-all focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20"
                            />
                        </div>
                    </div>
                    
                    {/* Terms and Conditions */}
                    <div className="flex items-start gap-3">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-2 border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--accent)] transition-colors focus:ring-2 focus:ring-[color:var(--accent)]/20"
                        />
                        <label htmlFor="terms" className="text-sm text-[color:var(--text-muted)]">
                            I agree to the{" "}
                            <Link href="/terms" className="font-semibold text-[color:var(--accent)] hover:underline">
                                Terms and Conditions
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="font-semibold text-[color:var(--accent)] hover:underline">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>
                    
                    <button
                        type="submit"
                        className="group w-full rounded-xl bg-[color:var(--accent)] py-3 text-sm font-semibold text-[color:var(--accent-contrast)] shadow-[var(--shadow-strong)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)] active:scale-95"
                    >
                        <span className="flex items-center justify-center gap-2">
                            Create Account
                            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </span>
                    </button>
                </form>

                {error ? (
                    <div className="mt-5 flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                ) : null}
                
                {success ? (
                    <div className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {success}
                    </div>
                ) : null}

                <p className="mt-6 text-center text-sm text-[color:var(--text-muted)]">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="font-semibold text-[color:var(--accent)] underline-offset-2 hover:underline">
                        Sign In
                    </Link>
                </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
