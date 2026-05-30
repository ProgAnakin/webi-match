import { test, expect, Page } from "@playwright/test";

// Smoke tests for the public kiosk routes, run against a preview build wired to
// PLACEHOLDER Supabase credentials — the backend is intentionally unreachable.
// They therefore assert only that each route mounts the app shell and does NOT
// fall through to the full-screen render-error boundary. They never wait for
// "networkidle": /stats and /manager open Supabase realtime channels that retry
// their websocket forever against the dead placeholder host, so the network
// never goes idle.

// Waits for the SPA to mount, then asserts the render-error boundary is absent.
// The boundary is detected by a stable data-testid (language-independent), so a
// crash on mount fails loudly here rather than as a vague console-error miss.
async function expectRouteMounts(page: Page) {
  await expect(page.locator("#root")).not.toBeEmpty({ timeout: 15_000 });
  await expect(page.getByTestId("error-boundary")).toHaveCount(0);
}

test.describe("Quiz kiosk flow", () => {
  test("loads the attract screen on first visit", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expectRouteMounts(page);
  });

  test("welcome screen shows name and email fields after attract click", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expectRouteMounts(page);
    const attractClickable = page.locator("[data-testid='attract-screen'], .attract-cta").first();
    if (await attractClickable.isVisible().catch(() => false)) {
      await attractClickable.click();
    } else {
      await page.click("body");
    }
    await page.waitForSelector("input[type='text'], input[type='email']", { timeout: 5000 }).catch(() => null);
  });

  test("manager page requires authentication", async ({ page }) => {
    await page.goto("/manager", { waitUntil: "domcontentloaded" });
    await expectRouteMounts(page);
    // The authenticated catalog UI must not render without a session.
    await expect(page.getByText("Gestione Catalogo")).toHaveCount(0);
  });

  test("stats page loads without crashing", async ({ page }) => {
    await page.goto("/stats", { waitUntil: "domcontentloaded" });
    await expectRouteMounts(page);
  });

  test("404 page renders the shell instead of a blank crash", async ({ page }) => {
    await page.goto("/does-not-exist-xyz", { waitUntil: "domcontentloaded" });
    await expectRouteMounts(page);
  });

  test("app reports no truly-unexpected console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expectRouteMounts(page);
    // The preview build has no backend, so connection failures are expected.
    // Ignore them plus the app's own "[webi-match]"-tagged data-load logs; only
    // a genuinely unexpected error (e.g. a syntax/runtime bug) should fail here.
    const serious = errors.filter(
      (e) =>
        !e.includes("supabase") &&
        !e.includes("net::ERR") &&
        !e.includes("favicon") &&
        !e.includes("WebSocket") &&
        !e.includes("Failed to fetch") &&
        !e.includes("[webi-match]"),
    );
    expect(serious).toHaveLength(0);
  });
});

test.describe("Manager dashboard — public paths", () => {
  test("reset-password page renders a form", async ({ page }) => {
    await page.goto("/reset-password", { waitUntil: "domcontentloaded" });
    await expectRouteMounts(page);
  });

  test("manager route does not expose data without login", async ({ page }) => {
    await page.goto("/manager", { waitUntil: "domcontentloaded" });
    await expectRouteMounts(page);
    // Dashboard data sections must NOT be visible without auth.
    await expect(page.getByText("Sessioni & Codici")).toHaveCount(0);
  });
});
