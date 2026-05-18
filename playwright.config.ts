import { defineConfig, devices } from "@playwright/test";

// Standalone Playwright config — starts the Vite preview server and runs the
// kiosk flow specs in /e2e against a Chromium iPad-sized viewport.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

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
