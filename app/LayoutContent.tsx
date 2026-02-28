"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import AgentWidget from "@/components/AgentWidget";
import { useCart } from "@/context/CartContext";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth/");
  const { isCartOpen, closeCart } = useCart();

  return isAuthPage ? (
    children
  ) : (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <Header />
      <main className="pt-20">{children}</main>
      <Footer />
      {/* Cart drawer — controlled by CartContext + voice agent */}
      <CartDrawer open={isCartOpen} onClose={closeCart} />
      {/* Voice agent sidebar */}
      <AgentWidget />
    </div>
  );
}
