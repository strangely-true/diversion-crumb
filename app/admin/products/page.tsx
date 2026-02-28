import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/auth";
import { AdminService } from "@/server/services/admin.service";
import AdminProductAIAssistant from "@/components/admin/AdminProductAIAssistant";
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

function normalizeHostedImageUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new URL(trimmed);
  if (parsed.protocol !== "https:") {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "unsplash.com" || hostname === "www.unsplash.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "photos" && parts[1]) {
      const slugOrId = parts[1];
      const id = slugOrId.includes("-") ? (slugOrId.split("-").pop() ?? "") : slugOrId;
      if (id) {
        return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;
      }
    }
  }

  return parsed.toString();
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function parseNutritionPerServing(value: string) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const keys = ["calories", "fatG", "saturatedFatG", "carbsG", "sugarG", "proteinG", "fiberG", "sodiumMg"];
    const nutrition: Record<string, number> = {};

    for (const key of keys) {
      const next = parsed[key];
      if (typeof next === "number" && Number.isFinite(next) && next >= 0) {
        nutrition[key] = next;
      }
    }

    return Object.keys(nutrition).length > 0 ? nutrition : undefined;
  } catch {
    return undefined;
  }
}

async function addProductAction(formData: FormData) {
  "use server";

  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const heroImageUrl = String(formData.get("heroImageUrl") ?? "").trim();
  const tagsCsv = String(formData.get("tagsCsv") ?? "").trim();
  const servingSize = String(formData.get("servingSize") ?? "").trim();
  const ingredients = String(formData.get("ingredients") ?? "").trim();
  const allergensCsv = String(formData.get("allergensCsv") ?? "").trim();
  const nutritionPerServingJson = String(formData.get("nutritionPerServingJson") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const allergens = parseCsv(allergensCsv);

  if (
    !name ||
    !slug ||
    !description ||
    !categoryId ||
    !heroImageUrl ||
    !ingredients ||
    allergens.length === 0 ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return;
  }

  const heroImage = normalizeHostedImageUrl(heroImageUrl);
  if (!heroImage) {
    return;
  }

  await AdminService.createQuickProduct(
    {
      name,
      slug,
      description,
      categoryId,
      heroImage,
      tags: parseCsv(tagsCsv),
      servingSize: servingSize || undefined,
      ingredients,
      allergens,
      nutritionPerServing: parseNutritionPerServing(nutritionPerServingJson),
      price,
      stock: 0,
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

async function removeProductImageAction(formData: FormData) {
  "use server";

  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return;
  }

  await AdminService.clearProductImage(productId);
  revalidatePath("/admin/products");
}

async function editProductImageAction(formData: FormData) {
  "use server";

  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  const heroImageUrl = String(formData.get("heroImageUrl") ?? "").trim();

  if (!productId || !heroImageUrl) {
    return;
  }

  try {
    const normalized = normalizeHostedImageUrl(heroImageUrl);
    if (!normalized) {
      return;
    }

    await AdminService.setProductImage(productId, normalized);
  } catch {
    return;
  }

  revalidatePath("/admin/products");
}

export default async function AdminProductsPage() {
  const categories = await AdminService.getProductCategories();
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
          <AdminProductAIAssistant categories={categories} />
          <form action={addProductAction} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" name="slug" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                name="categoryId"
                required
                defaultValue=""
                className="border-input h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-1 lg:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Input id="description" name="description" required />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="ingredients">Ingredients *</Label>
              <Input
                id="ingredients"
                name="ingredients"
                required
                placeholder="Comma separated ingredients"
              />
            </div>
            <div className="space-y-2 md:col-span-1 lg:col-span-2">
              <Label htmlFor="allergensCsv">Allergens *</Label>
              <Input
                id="allergensCsv"
                name="allergensCsv"
                required
                placeholder="Example: gluten, dairy, eggs"
              />
              <p className="text-muted-foreground text-xs">Enter comma-separated allergens.</p>
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="heroImageUrl">Image URL (Unsplash) *</Label>
              <Input
                id="heroImageUrl"
                name="heroImageUrl"
                type="url"
                required
                placeholder="https://unsplash.com/photos/... or https://images.unsplash.com/..."
              />
              <p className="text-muted-foreground text-xs">Paste an Unsplash link.</p>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <input id="tagsCsv" name="tagsCsv" type="hidden" />
              <input id="servingSize" name="servingSize" type="hidden" />
              <input id="nutritionPerServingJson" name="nutritionPerServingJson" type="hidden" />
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
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.heroImage ? (
                      <img
                        src={product.heroImage}
                        alt={product.name}
                        className="h-12 w-12 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-12 w-12 items-center justify-center rounded-md border text-xs">
                        No image
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category?.name ?? "-"}</TableCell>
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
                    <div className="flex flex-col gap-2">
                      <form action={editProductImageAction} className="flex items-center gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <Input
                          name="heroImageUrl"
                          type="url"
                          required
                          defaultValue={product.heroImage ?? ""}
                          placeholder="https://images.unsplash.com/..."
                          className="h-8 w-64"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Save Image
                        </Button>
                      </form>

                      <div className="flex items-center gap-2">
                        {product.heroImage ? (
                          <form action={removeProductImageAction}>
                            <input type="hidden" name="productId" value={product.id} />
                            <Button type="submit" size="sm" variant="outline">
                              Remove Image
                            </Button>
                          </form>
                        ) : null}
                        <form action={removeProductAction}>
                          <input type="hidden" name="productId" value={product.id} />
                          <Button type="submit" size="sm" variant="destructive">
                            Remove
                          </Button>
                        </form>
                      </div>
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
