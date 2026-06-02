import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect, Page } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// Visual regression suite — pixel-diff against committed baselines.
//
// Scope is intentionally narrow: only routes that render a stable shell with
// no framer-motion animations at steady state, so the suite never flakes:
//   • /does-not-exist-xyz  → 404 page
//   • /reset-password      → form
//   • /manager (logged out) → login form
//
// Baselines live next to this file in `visual-regression.spec.ts-snapshots/`
// and are regenerated via the "Update Visual Baselines" workflow_dispatch
// action (.github/workflows/update-visual-baselines.yml), which captures the
// snapshots in CI's WebKit/Linux environment — the only environment whose
// pixels match the gating CI run — and opens a PR with the updated images.
//
// If no baselines exist yet (first push of this file, or after a deliberate
// reset), the suite skips itself rather than failing — so it never blocks a
// merge before the bootstrap workflow has been run.
// ─────────────────────────────────────────────────────────────────────────────

const baselinesExist = existsSync(
  resolve(process.cwd(), "e2e/visual-regression.spec.ts-snapshots"),
);

// Stable wait that doesn't depend on networkidle (Supabase realtime channels
// keep the network busy forever against the placeholder backend in CI).
async function settle(page: Page) {
  await expect(page.locator("#root")).not.toBeEmpty({ timeout: 15_000 });
  // Small beat so any first-frame enter transition has finished even with
  // animations: "disabled" (framer's initial-prop snap can race the screenshot).
  await page.waitForTimeout(300);
}

test.describe("Visual regression", () => {
  test.skip(
    !baselinesExist,
    "Baselines not captured yet — run the 'Update Visual Baselines' workflow once, merge its PR, then this suite becomes a real gate.",
  );

  test("404 page", async ({ page }) => {
    await page.goto("/does-not-exist-xyz", { waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(page).toHaveScreenshot("not-found.png");
  });

  test("reset-password page", async ({ page }) => {
    await page.goto("/reset-password", { waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(page).toHaveScreenshot("reset-password.png");
  });

  test("manager login (unauthenticated)", async ({ page }) => {
    await page.goto("/manager", { waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(page).toHaveScreenshot("manager-login.png");
  });
});
