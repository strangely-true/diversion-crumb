import { expect, test } from "@playwright/test";

test("signup/login session, cart checkout, payment capture, and order persistence", async ({ page }) => {
  const unique = Date.now();
  const email = `qa-user-${unique}@bakery.demo`;
  const password = "StrongPass123";

  const signupResponse = await page.request.post("/api/auth/signup", {
    data: {
      email,
      password,
      confirmPassword: password,
      name: "QA Journey User",
    },
  });
  expect(signupResponse.ok()).toBeTruthy();

  await page.request.post("/api/auth/logout");

  await page.goto("/auth/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.locator("form button[type='submit']").click();

  await expect(page).toHaveURL(/\/$/);

  const productsResponse = await page.request.get("/api/products");
  expect(productsResponse.ok()).toBeTruthy();

  const productsPayload = (await productsResponse.json()) as {
    items: Array<{ variants: Array<{ id: string }> }>;
  };

  const variantId = productsPayload.items[0]?.variants[0]?.id;
  expect(variantId).toBeTruthy();

  const addToCartResponse = await page.request.post("/api/cart/items", {
    data: {
      variantId,
      quantity: 1,
      currency: "USD",
    },
  });
  expect(addToCartResponse.ok()).toBeTruthy();

  await page.goto("/cart");
  await expect(page.getByText("Your basket is empty")).toHaveCount(0);
  await page.getByRole("link", { name: /Proceed to Checkout/i }).click();

  await expect(page).toHaveURL(/\/checkout/);

  await page.locator("input[name='firstName']").fill("QA");
  await page.locator("input[name='lastName']").fill("User");
  await page.locator("input[name='email']").fill(email);
  await page.locator("input[name='phone']").fill("+15550001234");
  await page.locator("input[name='address']").fill("101 Test Street");
  await page.locator("input[name='city']").fill("Austin");
  await page.locator("input[name='postalCode']").fill("78701");
  await page.locator("input[name='country']").fill("US");

  await page.getByRole("button", { name: /^Pay \$/ }).click();

  await expect
    .poll(async () => {
      return page.evaluate(async () => {
        const response = await fetch("/api/orders", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          return false;
        }

        const candidate = (await response.json()) as Array<{
          paymentStatus?: string;
          payments?: Array<{ status?: string }>;
        }>;

        const latest = candidate[0];
        return latest?.paymentStatus === "CAPTURED" && latest?.payments?.[0]?.status === "CAPTURED";
      });
    }, { timeout: 60_000 })
    .toBeTruthy();

  const orders = (await page.evaluate(async () => {
    const response = await fetch("/api/orders", {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    return response.json();
  })) as Array<{
    id: string;
    paymentStatus: string;
    payments: Array<{ status: string }>;
  }>;

  expect(orders.length).toBeGreaterThan(0);
  expect(orders[0]?.paymentStatus).toBe("CAPTURED");
  expect(orders[0]?.payments?.[0]?.status).toBe("CAPTURED");
});
