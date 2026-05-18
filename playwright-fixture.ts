// Re-export Playwright primitives directly. Kept as a separate file so specs
// have a single import surface if we ever want to add custom fixtures
// (e.g. seeded Supabase rows, kiosk-mode page setup, etc.).
export { test, expect } from "@playwright/test";
