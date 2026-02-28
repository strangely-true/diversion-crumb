import type { Metadata } from "next";
import { Geist_Mono, Playfair_Display, Source_Sans_3 } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import ThemeInitializer from "@/components/ThemeInitializer";
import LayoutContent from "./LayoutContent";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
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
        className={`${sourceSans.variable} ${playfairDisplay.variable} ${geistMono.variable} antialiased bg-[color:var(--bg)] text-[color:var(--text-primary)]`}
      >
        <ThemeInitializer />
        <CartProvider>
          <LayoutContent>{children}</LayoutContent>
        </CartProvider>
      </body>
    </html>
  );
}
