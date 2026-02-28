import { revalidatePath } from "next/cache";
import { UserRole } from "@/generated/prisma/enums";
import { requireAdmin } from "@/server/auth/auth";
import { AppError } from "@/server/errors/app-error";
import { AdminService } from "@/server/services/admin.service";
import AdminDeleteUserDialog from "@/components/admin/AdminDeleteUserDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

async function updateUserRoleAction(formData: FormData) {
  "use server";

  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const nextRole = String(formData.get("role") ?? "").trim();

  if (!userId || (nextRole !== UserRole.ADMIN && nextRole !== UserRole.CUSTOMER)) {
    return;
  }

  await AdminService.updateUserRole(userId, nextRole as UserRole, session.userId);
  revalidatePath("/admin/users");
}

async function deleteUserAction(formData: FormData) {
  "use server";

  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId || userId === session.userId) {
    return;
  }

  try {
    await AdminService.deleteUser(userId, session.userId);
  } catch (error) {
    if (error instanceof AppError) {
      return;
    }

    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const users = await AdminService.getUsers();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground text-sm">View users and modify admin permissions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Table</CardTitle>
          <CardDescription>Only DB-whitelisted admins can access this page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Conversations</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === UserRole.ADMIN ? "default" : "secondary"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>{user._count.orders}</TableCell>
                  <TableCell>{user._count.conversations}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <form action={updateUserRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
                        >
                          <option value={UserRole.CUSTOMER}>CUSTOMER</option>
                          <option value={UserRole.ADMIN}>ADMIN</option>
                        </select>
                        <Button type="submit" size="sm" variant="outline">
                          Update
                        </Button>
                      </form>
                      <AdminDeleteUserDialog
                        action={deleteUserAction}
                        userId={user.id}
                        userEmail={user.email}
                        disabled={user.id === session.userId}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}