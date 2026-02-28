import { redirect } from "next/navigation";
import { AppError } from "@/server/errors/app-error";
import { requireAdmin } from "@/server/auth/auth";
import AdminSidebarShell from "@/components/admin/AdminSidebarShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AppError && (error.statusCode === 401 || error.statusCode === 403)) {
      redirect("/auth/login?returnTo=/admin&prompt=login");
    }

    redirect("/auth/login?returnTo=/admin&prompt=login");
  }

  return <AdminSidebarShell>{children}</AdminSidebarShell>;
}