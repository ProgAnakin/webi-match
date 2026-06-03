import { defineConfig, devices } from "@playwright/test";

// Standalone Playwright config — starts the Vite preview server and runs the
// kiosk flow specs in /e2e against an iPad-sized WebKit viewport (the engine
// real kiosks use).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

  // Visual-regression defaults applied to every toHaveScreenshot() call:
  //   • animations: "disabled"  — pauses CSS animations and sets prefers-
  //     reduced-motion so framer-motion respects the steady state. Combined
  //     with capturing only static-by-design screens, eliminates flake.
  //   • maxDiffPixelRatio: 0.01 — 1% per-pixel tolerance absorbs font sub-
  //     pixel and antialiasing noise across runs.
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    },
  },

  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "ipad-landscape",
      use: { ...devices["iPad Pro 11 landscape"] },
    },
    {
      // iPhone (WebKit / Safari engine) — added for the phone-form-factor
      // demo. Runs the kiosk smoke + framing specs at 390x844 so iPhone
      // layout regressions (overflow, overlap, crash) are caught in CI.
      // Visual-regression is excluded: its PNG baselines are captured at the
      // iPad viewport and would have no iPhone counterpart to diff against.
      name: "iphone",
      use: { ...devices["iPhone 13"] },
      testIgnore: /visual-regression\.spec\.ts/,
    },
  ],

  webServer: {
    // Build once with stub env vars, then preview — mirrors CI build behaviour.
    command:
      "VITE_SUPABASE_URL=https://placeholder.supabase.co " +
      "VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder " +
      "npm run build && npx vite preview --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
