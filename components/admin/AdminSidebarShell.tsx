"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  MessageSquare,
  Package,
  Truck,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AdminThemeToggle from "@/components/admin/AdminThemeToggle";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/admin/orders", label: "Shipping & Payments", icon: Truck },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const adminThemeVars = {
    "--background": "var(--surface-2)",
    "--foreground": "var(--text-primary)",
    "--card": "var(--surface-1)",
    "--card-foreground": "var(--text-primary)",
    "--popover": "var(--surface-1)",
    "--popover-foreground": "var(--text-primary)",
    "--primary": "var(--accent-strong)",
    "--primary-foreground": "var(--accent-contrast)",
    "--secondary": "var(--surface-3)",
    "--secondary-foreground": "var(--text-strong)",
    "--muted": "var(--surface-3)",
    "--muted-foreground": "var(--text-muted)",
    "--accent": "var(--surface-3)",
    "--accent-foreground": "var(--text-primary)",
    "--border": "var(--border)",
    "--input": "var(--border)",
    "--ring": "var(--accent-strong)",
    "--sidebar": "var(--surface-1)",
    "--sidebar-foreground": "var(--text-primary)",
    "--sidebar-primary": "var(--accent-strong)",
    "--sidebar-primary-foreground": "var(--accent-contrast)",
    "--sidebar-accent": "var(--surface-3)",
    "--sidebar-accent-foreground": "var(--text-primary)",
    "--sidebar-border": "var(--border)",
    "--sidebar-ring": "var(--accent-strong)",
  } as React.CSSProperties;

  return (
    <SidebarProvider>
      <div className="text-foreground bg-background flex min-h-screen w-full" style={adminThemeVars}>
      <Sidebar variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="px-3 py-3">
          <div className="rounded-lg border bg-background/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">Crumbs & Co.</p>
            <p className="text-sm font-semibold">Admin Panel</p>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup className="px-3 py-2">
            <SidebarGroupLabel>Sections</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {adminLinks.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActivePath(pathname, item.href)}
                      tooltip={item.label}
                      className="rounded-lg px-3"
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-3 pb-3">
          <div className="text-muted-foreground rounded-lg border bg-background/40 px-3 py-2 text-xs">
            Restricted to DB-whitelisted admins
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-screen bg-background">
        <header className="bg-background/95 border-b flex h-12 items-center gap-2 px-4 backdrop-blur">
          <SidebarTrigger />
          <span className="text-sm font-medium">Admin Workspace</span>
          <div className="ml-auto">
            <AdminThemeToggle />
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
      </SidebarInset>
      </div>
    </SidebarProvider>
  );
}