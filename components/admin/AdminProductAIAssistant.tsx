"use client";

import { useMemo, useState } from "react";
import { WandSparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

type ProductDraft = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  servingSize: string;
  ingredients: string;
  allergens: string[];
  nutritionPerServing: {
    calories: number;
    fatG: number;
    saturatedFatG: number;
    carbsG: number;
    sugarG: number;
    proteinG: number;
    fiberG: number;
    sodiumMg: number;
  };
  price: number;
  heroImageUrl: string;
  source: "ai" | "automation";
};

type AdminProductAIAssistantProps = {
  categories: ProductCategory[];
};

function updateInputValue(id: string, value: string) {
  const element = document.getElementById(id) as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | null;
  if (!element) {
    return;
  }

  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export default function AdminProductAIAssistant({ categories }: AdminProductAIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"suggest" | "autofill" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);

  const categoryNames = useMemo(() => categories.map((category) => category.name).join(", "), [categories]);

  function applyDraftData(nextDraft: ProductDraft) {
    updateInputValue("name", nextDraft.name);
    updateInputValue("slug", nextDraft.slug);
    updateInputValue("description", nextDraft.description);
    updateInputValue("price", String(nextDraft.price));
    updateInputValue("heroImageUrl", nextDraft.heroImageUrl);
    updateInputValue("categoryId", nextDraft.categoryId);
    updateInputValue("tagsCsv", nextDraft.tags.join(", "));
    updateInputValue("servingSize", nextDraft.servingSize);
    updateInputValue("ingredients", nextDraft.ingredients);
    updateInputValue("allergensCsv", nextDraft.allergens.join(", "));
    updateInputValue("nutritionPerServingJson", JSON.stringify(nextDraft.nutritionPerServing));
  }

  async function generateDraft(action: "suggest" | "autofill") {
    setError(null);
    setIsLoading(true);
    setLoadingAction(action);

    try {
      const response = await fetch("/api/admin/ai/product-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          categories,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed to generate draft");
      }

      const payload = (await response.json()) as ProductDraft;
      setDraft(payload);
      if (action === "autofill") {
        applyDraftData(payload);
      }
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Could not generate suggestions right now.";
      setError(message);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  }

  function applyDraft() {
    if (!draft) {
      return;
    }

    applyDraftData(draft);
  }

  return (
    <div className="border-border bg-muted/20 mb-5 space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">AI Product Draft</p>
          <p className="text-muted-foreground text-xs">
            Describe once to auto-fill fields including required ingredients and allergens.
          </p>
        </div>
        <WandSparkles className="text-muted-foreground h-4 w-4" />
      </div>

      <Input
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Example: protein-rich whole wheat croissant for breakfast combos"
      />

      <p className="text-muted-foreground text-xs">Available categories: {categoryNames}</p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => generateDraft("suggest")}
          disabled={isLoading || prompt.trim().length < 4}
        >
          {isLoading && loadingAction === "suggest" ? "Generating..." : "Generate Suggestions"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => generateDraft("autofill")}
          disabled={isLoading || prompt.trim().length < 4}
        >
          {isLoading && loadingAction === "autofill" ? "Autofilling..." : "Autofill Form"}
        </Button>
        <Button type="button" variant="ghost" onClick={applyDraft} disabled={!draft || isLoading}>
          Apply Last Suggestion
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Suggestion unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {draft ? (
        <Alert>
          <AlertTitle>{draft.source === "ai" ? "AI suggestion ready" : "Automation suggestion ready"}</AlertTitle>
          <AlertDescription>
            {draft.name} · ${draft.price.toFixed(2)} · {draft.categoryName}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
