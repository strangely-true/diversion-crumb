/**
 * Vapi voice assistant configuration for Crumbs & Co.
 *
 * Architecture:
 *  - Server tools  → POST /api/vapi/tools  (Vapi calls our backend)
 *  - Client tools  → no server URL         (Vapi fires SDK "message" event; browser handles them)
 */

const SERVER_TOOL_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000"}/api/vapi/tools`;

export const BAKERY_SYSTEM_PROMPT = `You are Crumb, the warm and knowledgeable AI assistant for Crumbs & Co. bakery. Keep responses short and conversational — you are a voice assistant.

CAPABILITIES:
• Browse and search the menu (cakes, breads, pastries, cookies)
• Show products by navigating to their pages
• Propose and execute cart changes with visual confirmation cards
• Answer questions about store hours, ordering, allergens, nutrition
• Handle discount requests via supervisor approval
• Escalate to a human agent for issues beyond your authority

CORE RULES:
1. Always call listProducts or getProduct before mentioning product details — never guess.
2. When a customer asks to see a product, call navigateTo with /products/[slug].
3. When suggesting cart changes, call proposeCartUpdate FIRST to show visual product cards, then wait for the customer to confirm before calling addToCart or updateCartItemQuantity.
4. For discounts ≤15% you may approve directly. For anything higher, call requestSupervisorApproval.
5. For complaints or account issues, call escalateToHuman.
6. Never confirm a cart change until addToCart or updateCartItemQuantity actually succeeds.
7. Allergen and nutrition info comes from getProduct — never invent it.

PROPOSAL FLOW (cart changes):
1. Call proposeCartUpdate with items and a question like "Do you want me to add Bloom Booster to your cart?"
2. Customer sees product cards with Yes/No buttons and responds.
3. After Yes, call addToCart / updateCartItemQuantity to make the actual changes.
4. After No, acknowledge and move on.

SUPERVISOR APPROVAL FLOW:
- Customer asks for a large discount → say "That's beyond what I'm authorised to approve — let me check with my supervisor."
- Call requestSupervisorApproval with the requested percentage.
- Relay the supervisor's decision to the customer.

IMPORTANT:
- NEVER say items were added/removed unless the tool succeeds.
- Do not simulate any cart, order, or payment state.`;

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
                  enum: ["cakes", "bread", "pastries", "cookies", "muffins"],
                  description:
                    "Category slug. Must be one of: cakes, bread, pastries, cookies, muffins",
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
        // ────────────────────────────────────────────────────────────────────

        // proposeCartUpdate — show product confirmation cards in the widget
        {
          type: "function" as const,
          function: {
            name: "proposeCartUpdate",
            description:
              "Show the customer visual product confirmation cards asking if they want to update their cart. Call this BEFORE making actual cart changes via addToCart/updateCartItemQuantity.",
            parameters: {
              type: "object",
              required: ["items", "message"],
              properties: {
                message: {
                  type: "string",
                  description:
                    "Confirmation question shown above the cards, e.g. 'Do you want me to update the items in your cart?'",
                },
                items: {
                  type: "array",
                  description: "Products to show in the confirmation cards",
                  items: {
                    type: "object",
                    required: ["name", "price"],
                    properties: {
                      variantId: { type: "string" },
                      name: { type: "string" },
                      price: { type: "number" },
                      imageUrl: { type: "string" },
                      action: {
                        type: "string",
                        enum: ["add", "remove", "replace"],
                      },
                    },
                  },
                },
              },
            },
          },
          // No server — client handles it via the Vapi SDK message event
        },

        // requestSupervisorApproval — bakery escalation / discount approval
        {
          type: "function" as const,
          function: {
            name: "requestSupervisorApproval",
            description:
              "Escalate a discount or exception request to a supervisor. Use when the customer requests a discount above 15%. Supervisor will review and respond with an approved amount.",
            parameters: {
              type: "object",
              required: ["reason", "requestedDiscountPercent"],
              properties: {
                reason: {
                  type: "string",
                  description: "Why the customer is asking for this discount",
                },
                requestedDiscountPercent: {
                  type: "number",
                  description: "Discount percentage the customer requested",
                },
                conversationId: {
                  type: "string",
                  description: "Current conversation session ID",
                },
              },
            },
          },
          server: { url: SERVER_TOOL_URL },
        },

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
  | "removeFromCart"
  | "proposeCartUpdate";

export const CLIENT_TOOL_NAMES = new Set<string>([
  "navigateTo",
  "openCartDrawer",
  "removeFromCart",
  "proposeCartUpdate",
] satisfies VapiClientToolName[]);
