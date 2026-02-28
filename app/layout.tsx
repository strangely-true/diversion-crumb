import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SweetCrumbs Bakery | Artisan Bakery E-Commerce",
  description:
    "Shop artisan cakes, breads, and pastries from SweetCrumbs Bakery. Freshly baked and delivered with care.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "SweetCrumbs Bakery",
    description:
      "Premium bakery e-commerce for cakes, breads, and pastries.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-[#333333]`}
      >
        <CartProvider>
          <div className="min-h-screen bg-white">
            <Header />
            <main className="pt-20">{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
