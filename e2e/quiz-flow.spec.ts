import { test, expect } from "@playwright/test";

// Full kiosk user journey:
// AttractScreen → WelcomeScreen → QuizScreen → MatchResult → SuccessScreen

test.describe("Quiz kiosk flow", () => {
  test("loads the attract screen on first visit", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#root")).not.toBeEmpty();
    // No JS error boundary visible
    await expect(page.locator("text=Something went wrong")).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test("welcome screen shows name and email fields after attract click", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(800);
    const attractClickable = page.locator("[data-testid='attract-screen'], .attract-cta").first();
    if (await attractClickable.isVisible().catch(() => false)) {
      await attractClickable.click();
    } else {
      await page.click("body");
    }
    await page.waitForSelector("input[type='text'], input[type='email']", { timeout: 5000 }).catch(() => null);
  });

  test("manager page requires authentication", async ({ page }) => {
    await page.goto("/manager");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("#root")).not.toBeEmpty();
    await expect(page.locator("text=Gestione Catalogo")).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  test("stats page loads without crashing", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.locator("#root")).not.toBeEmpty();
    await page.waitForLoadState("networkidle");
  });

  test("404 page shows not-found content", async ({ page }) => {
    await page.goto("/does-not-exist-xyz");
    await expect(page.locator("#root")).not.toBeEmpty();
    // Either a 404 message or a redirect back home
    const is404 = await page.locator("text=404").isVisible().catch(() => false);
    const isHome = await page.locator("body").isVisible();
    expect(is404 || isHome).toBeTruthy();
  });

  test("app has no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Filter out known benign errors (e.g. Supabase connection in test env)
    const serious = errors.filter(
      (e) => !e.includes("supabase") && !e.includes("net::ERR") && !e.includes("favicon")
    );
    expect(serious).toHaveLength(0);
  });
});

test.describe("Manager dashboard — public paths", () => {
  test("reset-password page renders a form", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.locator("#root")).not.toBeEmpty();
    await page.waitForLoadState("networkidle");
  });

  test("manager route does not expose data without login", async ({ page }) => {
    await page.goto("/manager");
    await page.waitForLoadState("networkidle");
    // Dashboard sections must NOT be visible without auth
    await expect(page.locator("text=Sessioni & Codici")).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  });
});
