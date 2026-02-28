"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth/");

  return isAuthPage ? (
    children
  ) : (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <Header />
      <main className="pt-20">{children}</main>
      <Footer />
    </div>
  );
}
