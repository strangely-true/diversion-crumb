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
  const isAdminPage = pathname.startsWith("/admin");
  const { isCartOpen, closeCart } = useCart();

  if (isAuthPage) {
    return children;
  }

  if (isAdminPage) {
    return <div className="bg-(--bg) min-h-screen">{children}</div>;
  }

  return (
    <div className="bg-(--bg) min-h-screen overflow-x-clip">
      <div>
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
