import { test, expect, Page } from "@playwright/test";

// Framing contract for the kiosk route: when /  is mounted, the document
// must occupy the iPad viewport exactly — no vertical or horizontal
// overflow, no Safari URL-bar-revealing scroll affordance. This is what
// the useLockBodyScroll hook enforces; this spec is the regression net.
//
// Admin routes (/manager, /stats, /consulente) are intentionally
// EXCLUDED here — they need document scroll for long lists and do not
// call useLockBodyScroll.

async function viewportMetrics(page: Page) {
  return page.evaluate(() => ({
    docScrollH:  document.documentElement.scrollHeight,
    docClientH:  document.documentElement.clientHeight,
    docScrollW:  document.documentElement.scrollWidth,
    docClientW:  document.documentElement.clientWidth,
    bodyOverflow:   getComputedStyle(document.body).overflow,
    bodyPosition:   getComputedStyle(document.body).position,
  }));
}

test.describe("Kiosk framing (/ on iPad landscape)", () => {
  test("document height equals viewport height — no vertical scroll", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty({ timeout: 15_000 });
    // Let the attract screen settle so any late-mount layout shifts land
    // before we measure.
    await page.waitForTimeout(500);

    const m = await viewportMetrics(page);
    // Allow a 1px slack for sub-pixel rounding across DPRs.
    expect(m.docScrollH).toBeLessThanOrEqual(m.docClientH + 1);
    expect(m.docScrollW).toBeLessThanOrEqual(m.docClientW + 1);
  });

  test("body is locked to a fixed, non-scrolling layout", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty({ timeout: 15_000 });
    await page.waitForTimeout(500);

    const m = await viewportMetrics(page);
    expect(m.bodyOverflow).toBe("hidden");
    expect(m.bodyPosition).toBe("fixed");
  });

  test("touch-drag does not move the document", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty({ timeout: 15_000 });
    await page.waitForTimeout(500);

    const beforeY = await page.evaluate(() => window.scrollY);
    // Simulate a vertical drag that, on a scrollable page, would scroll.
    await page.mouse.move(600, 400);
    await page.mouse.down();
    await page.mouse.move(600, 100, { steps: 10 });
    await page.mouse.up();
    const afterY = await page.evaluate(() => window.scrollY);

    expect(afterY).toBe(beforeY);
  });

  // The real regression target: drive attract → welcome → quiz and assert the
  // quiz screen (the swipe card + YES/NO buttons) fits the viewport with no
  // overflow and no crash. Runs at BOTH iPad and iPhone sizes (project matrix),
  // so it catches the small-screen overlap/clip that broke the phone layout.
  // The welcome form's cooldown RPC fails open against the placeholder backend,
  // so onStart still fires and the quiz mounts.
  test("kiosk flow reaches the quiz and fits the viewport (no overflow / no crash)", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty({ timeout: 15_000 });

    // Advance past the attract loop.
    await page.locator("body").click();

    // Fill the welcome form (type-based selectors — language-independent).
    const email = page.locator("input[type='email']");
    await expect(email).toBeVisible({ timeout: 10_000 });
    const texts = page.locator("input[type='text']");
    await texts.nth(0).fill("Demo");
    await texts.nth(1).fill("User");
    await email.fill("demo@example.com");
    await page.locator("input[type='checkbox']").first().check();
    await page.locator("button.gradient-primary").first().click();

    // Quiz mounts; dismiss the one-time swipe tutorial overlay if present.
    await page.waitForTimeout(1000);
    await page.locator("body").click({ position: { x: 8, y: 8 } }).catch(() => {});
    await page.waitForTimeout(400);

    const m = await page.evaluate(() => ({
      leftWelcome: !document.querySelector("input[type='email']"),
      boundary:    !!document.querySelector("[data-testid='error-boundary']"),
      scrollH:     document.documentElement.scrollHeight,
      clientH:     document.documentElement.clientHeight,
      scrollW:     document.documentElement.scrollWidth,
      clientW:     document.documentElement.clientWidth,
    }));

    // We progressed off the welcome screen into the quiz.
    expect(m.leftWelcome).toBe(true);
    // No render crash.
    expect(m.boundary).toBe(false);
    // The quiz screen fits the viewport — no vertical or horizontal overflow
    // (this is exactly what the fixed-height card used to violate on iPhone).
    expect(m.scrollH).toBeLessThanOrEqual(m.clientH + 2);
    expect(m.scrollW).toBeLessThanOrEqual(m.clientW + 2);
  });
});

test.describe("Admin framing — must remain scrollable", () => {
  // The Manager dashboard intentionally does NOT call useLockBodyScroll
  // because its data lists overflow on small viewports. This guards
  // against an accidental regression that would lock its document.
  test("manager route keeps the body scrollable", async ({ page }) => {
    await page.goto("/manager", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty({ timeout: 15_000 });
    await page.waitForTimeout(500);

    const m = await viewportMetrics(page);
    expect(m.bodyOverflow).not.toBe("hidden");
    expect(m.bodyPosition).not.toBe("fixed");
  });
});
