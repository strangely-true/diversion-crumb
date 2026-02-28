"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import AgentWidget from "@/components/AgentWidget";
import { useCart } from "@/context/CartContext";
import { useAgent } from "@/context/AgentContext";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth/");
  const { isCartOpen, closeCart } = useCart();
  const { isSidebarOpen } = useAgent();

  return isAuthPage ? (
    children
  ) : (
    <div className="min-h-screen overflow-x-clip bg-[color:var(--bg)]">
      <div
        className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isSidebarOpen
            ? "origin-left scale-[0.965] pr-80"
            : "origin-left scale-100 pr-0"
        }`}
      >
        <Header />
        <main className="pt-20">{children}</main>
        <Footer />
      </div>
      {/* Cart drawer — controlled by CartContext + voice agent */}
      <CartDrawer open={isCartOpen} onClose={closeCart} />
      {/* Voice agent sidebar */}
      <AgentWidget />
    </div>
  );
}
