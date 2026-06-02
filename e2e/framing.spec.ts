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
