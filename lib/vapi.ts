/**
 * Vapi voice assistant configuration for Crumbs & Co.
 *
 * Architecture:
 *  - Server tools  → POST /api/vapi/tools  (Vapi calls our backend)
 *  - Client tools  → no server URL         (Vapi fires SDK "message" event; browser handles them)
 */

const SERVER_TOOL_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000"}/api/vapi/tools`;

export const BAKERY_SYSTEM_PROMPT = `You are Crumb, the friendly and knowledgeable voice assistant for Crumbs & Co. You speak naturally, warmly, and concisely — you are a voice assistant, so keep responses short and conversational.

You can help customers:
• Browse and search our bakery menu (cakes, breads, pastries, cookies…)
• Get detailed information: ingredients, allergens, nutrition facts, pricing
• Add or remove items from their cart
• Navigate to any page on our website
• Open the shopping cart drawer
• Answer questions about store hours, policies, allergies, and more
• Escalate to a human support agent if a customer needs personal help

Instructions:
- Always call listProducts or getProduct before recommending items — never guess product details.
- When a customer wants a product page opened, call navigateTo with the product slug path.
- When adding to cart, you must first call getProduct to get the correct variantId, then call addToCart.
- Allergen and nutrition data is returned by getProduct — always read it from the tool result.
- If you cannot confidently answer a question, call searchKnowledge first, then escalate if still unsure.
- Keep voice responses under 2 sentences when possible. Offer to elaborate if needed.
- Do not invent products, prices, or ingredients.

IMPORTANT:
- You must NEVER say "Item added to cart" unless addToCart tool succeeds.
- You must ALWAYS call addToCart before confirming cart updates.
- You must NOT simulate cart updates.
- All cart state must come from tool results.
- If a cart tool fails, respond with the error from the tool.
- Do not simulate cart updates conversationally.`;

// ─── Assistant Configuration ──────────────────────────────────────────────────

export function buildVapiAssistantConfig() {
  return {
    name: "Crumb – Crumbs & Co. Assistant",

    // ── Model ──────────────────────────────────────────────────────────────────
    model: {
      provider: "google" as const,
      model: "gemini-2.5-flash",
      systemPrompt: BAKERY_SYSTEM_PROMPT,

      tools: [
        // ────────────────────────────────────────────────────────────────────
        // SERVER TOOLS  (Vapi calls POST /api/vapi/tools)
        // ────────────────────────────────────────────────────────────────────
        {
          type: "function" as const,
          function: {
            name: "listProducts",
            description:
              "List products in the bakery. Optionally filter by category slug or search term.",
            parameters: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  description:
                    "Category slug, e.g. 'cakes', 'breads', 'pastries', 'cookies'",
                },
                search: {
                  type: "string",
                  description: "Free-text name search",
                },
                pageSize: {
                  type: "number",
                  description: "Max results to return (default 6)",
                },
              },
            },
          },
          server: { url: SERVER_TOOL_URL },
        },

        {
          type: "function" as const,
          function: {
            name: "getProduct",
            description:
              "Get full details for a single product — including variants with pricing, nutrition per serving, allergens, and ingredients.",
            parameters: {
              type: "object",
              required: ["slug"],
              properties: {
                slug: {
                  type: "string",
                  description: "Product slug, e.g. 'sourdough-loaf'",
                },
              },
            },
          },
          server: { url: SERVER_TOOL_URL },
        },

        {
          type: "function" as const,
          function: {
            name: "searchKnowledge",
            description:
              "Search the bakery knowledge base for FAQs, policies, allergy information, opening hours, etc.",
            parameters: {
              type: "object",
              required: ["query"],
              properties: {
                query: {
                  type: "string",
                  description: "The question or topic to search for",
                },
              },
            },
          },
          server: { url: SERVER_TOOL_URL },
        },

        {
          type: "function" as const,
          function: {
            name: "escalateToHuman",
            description:
              "Escalate to a human support agent. Use this when the customer is frustrated, needs account help, or you cannot resolve their issue.",
            parameters: {
              type: "object",
              required: ["reason"],
              properties: {
                reason: {
                  type: "string",
                  description: "Brief reason for escalation",
                },
                conversationId: {
                  type: "string",
                  description: "Current conversation ID (if available)",
                },
              },
            },
          },
          server: { url: SERVER_TOOL_URL },
        },

        {
          type: "function" as const,
          function: {
            name: "addToCart",
            description:
              "Add a specific variant to a user's cart using deterministic backend arithmetic.",
            parameters: {
              type: "object",
              required: ["userId", "variantId", "quantity"],
              properties: {
                userId: {
                  type: "string",
                  description: "Authenticated user ID",
                },
                variantId: {
                  type: "string",
                  description: "Product variant UUID",
                },
                quantity: {
                  type: "number",
                  description: "Quantity to add; must be greater than 0",
                },
              },
            },
          },
          server: { url: SERVER_TOOL_URL },
        },

        {
          type: "function" as const,
          function: {
            name: "updateCartItemQuantity",
            description:
              "Set cart quantity for a variant. quantity=0 removes the item.",
            parameters: {
              type: "object",
              required: ["userId", "variantId", "quantity"],
              properties: {
                userId: {
                  type: "string",
                  description: "Authenticated user ID",
                },
                variantId: {
                  type: "string",
                  description: "Product variant UUID",
                },
                quantity: {
                  type: "number",
                  description:
                    "Target quantity. If 0, item is removed. Must be an integer >= 0.",
                },
              },
            },
          },
          server: { url: SERVER_TOOL_URL },
        },

        {
          type: "function" as const,
          function: {
            name: "getCart",
            description: "Get a user's full deterministic cart summary.",
            parameters: {
              type: "object",
              required: ["userId"],
              properties: {
                userId: {
                  type: "string",
                  description: "Authenticated user ID",
                },
              },
            },
          },
          server: { url: SERVER_TOOL_URL },
        },

        // ────────────────────────────────────────────────────────────────────
        // CLIENT TOOLS  (no server URL → handled by the browser via Vapi SDK)
        // The browser receives message.type === "tool-calls" and responds with
        // vapi.send({ type: "add-message", message: { role: "tool", ... } })
        // ────────────────────────────────────────────────────────────────────
        {
          type: "function" as const,
          function: {
            name: "navigateTo",
            description:
              "Navigate the bakery website to any page. Use paths like '/', '/products', '/products/sourdough-loaf', '/cart', '/checkout'.",
            parameters: {
              type: "object",
              required: ["path"],
              properties: {
                path: {
                  type: "string",
                  description: "Absolute path, e.g. '/products/sourdough-loaf'",
                },
              },
            },
          },
          // No server → client handles it
        },

        {
          type: "function" as const,
          function: {
            name: "openCartDrawer",
            description:
              "Open the cart side-drawer so the customer can see their basket.",
            parameters: { type: "object", properties: {} },
          },
        },

        {
          type: "function" as const,
          function: {
            name: "removeFromCart",
            description: "Remove an item from the cart by its cart-item ID.",
            parameters: {
              type: "object",
              required: ["cartItemId"],
              properties: {
                cartItemId: {
                  type: "string",
                  description: "Cart item UUID to remove",
                },
              },
            },
          },
        },
      ],
    },

    // ── Voice ──────────────────────────────────────────────────────────────────
    voice: {
      provider: "11labs" as const,
      voiceId: "cgSgspJ2msm6clMCkdW9", // Lily – warm, friendly female voice
      stability: 0.5,
      similarityBoost: 0.75,
    },

    // ── Transcription ──────────────────────────────────────────────────────────
    transcriber: {
      provider: "deepgram" as const,
      model: "nova-2",
      language: "en-US",
    },

    firstMessage:
      "Hi! I'm Crumb, your Crumbs & Co. assistant. I can help you find the perfect bake, check ingredients and allergens, or add things to your cart — just ask!",

    endCallPhrases: [
      "goodbye",
      "bye",
      "that's all",
      "nothing else",
      "thank you bye",
    ],

    recordingEnabled: false,
  };
}

export type VapiClientToolName =
  | "navigateTo"
  | "openCartDrawer"
  | "removeFromCart";

export const CLIENT_TOOL_NAMES = new Set<string>([
  "navigateTo",
  "openCartDrawer",
  "removeFromCart",
] satisfies VapiClientToolName[]);
