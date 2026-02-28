import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/auth";
import { AdminService } from "@/server/services/admin.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function adjustInventoryAction(formData: FormData) {
  "use server";

  const session = await requireAdmin();
  const variantId = String(formData.get("variantId") ?? "").trim();
  const quantityDelta = Number(formData.get("quantityDelta") ?? 0);

  if (!variantId || !Number.isFinite(quantityDelta) || !Number.isInteger(quantityDelta) || quantityDelta === 0) {
    return;
  }

  await AdminService.adjustVariantInventory(variantId, quantityDelta, session.userId);

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
}

export default async function AdminInventoryPage() {
  const inventoryItems = await AdminService.getInventoryItems();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-muted-foreground text-sm">Manage stock levels by product variant.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Table</CardTitle>
          <CardDescription>Use positive values to add stock and negative values to reduce stock.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Low Stock At</TableHead>
                <TableHead>Adjust Quantity</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.variant.product.name}</TableCell>
                  <TableCell>{item.variant.label}</TableCell>
                  <TableCell>{item.variant.sku}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.reserved}</TableCell>
                  <TableCell>{item.lowStockThreshold}</TableCell>
                  <TableCell>
                    <form action={adjustInventoryAction} className="flex items-center gap-2">
                      <input type="hidden" name="variantId" value={item.variant.id} />
                      <Input
                        name="quantityDelta"
                        type="number"
                        step="1"
                        required
                        className="h-8 w-28"
                        placeholder="e.g. 5 or -2"
                      />
                      <Button type="submit" size="sm" variant="outline">
                        Update
                      </Button>
                    </form>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">Manual adjustment</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}