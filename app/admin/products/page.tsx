import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/auth";
import { AdminService } from "@/server/services/admin.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

async function addProductAction(formData: FormData) {
  "use server";

  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const heroImage = String(formData.get("heroImage") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const stock = Number(formData.get("stock") ?? 0);

  if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) {
    return;
  }

  await AdminService.createQuickProduct(
    {
      name,
      slug: slug || undefined,
      description: description || undefined,
      heroImage: heroImage || undefined,
      price,
      stock,
    },
    session.userId,
  );

  revalidatePath("/admin/products");
}

async function removeProductAction(formData: FormData) {
  "use server";

  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return;
  }

  await AdminService.removeProduct(productId);
  revalidatePath("/admin/products");
}

export default async function AdminProductsPage() {
  const products = await AdminService.getProducts();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="text-muted-foreground text-sm">Add, inspect, and remove products.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Product</CardTitle>
          <CardDescription>Create a new product entry.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addProductAction} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (optional)</Label>
              <Input id="slug" name="slug" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" name="stock" type="number" min="0" step="1" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="heroImage">Image URL (optional)</Label>
              <Input id="heroImage" name="heroImage" type="url" />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" name="description" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Button type="submit">Add Product</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Table</CardTitle>
          <CardDescription>Current catalog with remove actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.status}</Badge>
                  </TableCell>
                  <TableCell>{product.variants.length}</TableCell>
                  <TableCell>
                    {product.variants.reduce((sum, variant) => sum + (variant.inventory?.quantity ?? 0), 0)}
                  </TableCell>
                  <TableCell>{formatDate(product.createdAt)}</TableCell>
                  <TableCell>
                    <form action={removeProductAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <Button type="submit" size="sm" variant="destructive">
                        Remove
                      </Button>
                    </form>
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
