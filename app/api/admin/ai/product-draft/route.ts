import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/auth";

type CategoryInput = {
  id: string;
  name: string;
  slug: string;
};

const requestSchema = z.object({
  prompt: z.string().trim().min(4).max(500),
  categories: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      }),
    )
    .min(1),
});

const draftSchema = z.object({
  name: z.string().trim().min(3).max(80),
  slug: z.string().trim().min(3).max(80),
  description: z.string().trim().min(12).max(220),
  categoryName: z.string().trim().min(2).max(60),
  tags: z.array(z.string().trim().min(2).max(24)).max(6),
  servingSize: z.string().trim().min(4).max(40),
  ingredients: z.string().trim().min(12).max(400),
  allergens: z.array(z.string().trim().min(2).max(20)).max(8),
  nutritionPerServing: z.object({
    calories: z.number().min(0).max(2000),
    fatG: z.number().min(0).max(200),
    saturatedFatG: z.number().min(0).max(100),
    carbsG: z.number().min(0).max(300),
    sugarG: z.number().min(0).max(250),
    proteinG: z.number().min(0).max(200),
    fiberG: z.number().min(0).max(100),
    sodiumMg: z.number().min(0).max(5000),
  }),
  price: z.number().min(0.5).max(200),
  heroImageQuery: z.string().trim().min(2).max(80),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function pickCategoryByText(input: string, categories: CategoryInput[]) {
  const needle = input.trim().toLowerCase();
  if (!needle) {
    return categories[0];
  }

  const exact = categories.find((category) => category.name.toLowerCase() === needle);
  if (exact) {
    return exact;
  }

  const contains = categories.find(
    (category) => category.name.toLowerCase().includes(needle) || needle.includes(category.name.toLowerCase()),
  );

  return contains ?? categories[0];
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const rawBody = (await req.json()) as unknown;
    const parsed = requestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { prompt, categories } = parsed.data;

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is required for AI product automation." },
        { status: 500 },
      );
    }

    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: draftSchema,
        prompt: [
          "You are assisting a bakery admin creating product records.",
          "Generate realistic draft fields from this request:",
          prompt,
          `Allowed categories: ${categories.map((c) => c.name).join(", ")}`,
          "Return realistic bakery metadata in seed style: tags, servingSize, ingredients, allergens, nutritionPerServing.",
          "Constraints: USD price with 2 decimals, concise clear description, URL-safe slug.",
          "Do not use markdown.",
        ].join("\n"),
      });

      const chosenCategory = pickCategoryByText(object.categoryName, categories);
      const safeSlug = slugify(object.slug || object.name);
      const imageQuery = slugify(object.heroImageQuery || object.name) || "bakery";

      return NextResponse.json({
        name: object.name,
        slug: safeSlug,
        description: object.description,
        categoryId: chosenCategory.id,
        categoryName: chosenCategory.name,
        tags: object.tags,
        servingSize: object.servingSize,
        ingredients: object.ingredients,
        allergens: object.allergens,
        nutritionPerServing: object.nutritionPerServing,
        price: Number(object.price.toFixed(2)),
        heroImageUrl: `https://source.unsplash.com/1200x900/?${encodeURIComponent(imageQuery)}`,
        source: "ai" as const,
      });
    } catch (error) {
      console.error("[admin/ai/product-draft:gemini]", error);
      return NextResponse.json({ error: "Gemini draft generation failed." }, { status: 502 });
    }
  } catch (error) {
    console.error("[admin/ai/product-draft]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
