import { defineConfig, devices } from "@playwright/test";

/**
 * PickCV E2E Test Configuration
 *
 * Two projects:
 *   1. "api"  — headless API-level smoke tests (fast, no browser)
 *   2. "ui"   — browser-based UI smoke tests (Chromium)
 *
 * Environment variables:
 *   STAGING_API_URL    — backend base URL  (e.g. https://pickcv-backend-staging-xxx.run.app)
 *   STAGING_APP_URL    — frontend base URL (e.g. https://pickcv-staging.web.app)
 *   E2E_CLEANUP_SECRET — shared secret for /api/e2e/* endpoints
 */

const STAGING_API_URL =
  process.env.STAGING_API_URL ?? "http://localhost:8000";
const STAGING_APP_URL =
  process.env.STAGING_APP_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // run sequentially — some tests depend on earlier state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "on-failure" }]],

  /* Shared settings for all projects */
  use: {
    baseURL: STAGING_API_URL,
    extraHTTPHeaders: {
      Accept: "application/json",
    },
    trace: "on-first-retry",
  },

  projects: [
    /* ── API smoke tests (no browser needed) ──────────── */
    {
      name: "api",
      testDir: "./tests/api",
      use: {
        baseURL: STAGING_API_URL,
      },
    },

    /* ── UI smoke tests (Chromium) ────────────────────── */
    {
      name: "ui",
      testDir: "./tests/ui",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: STAGING_APP_URL,
      },
    },
  ],

  /* Global setup: clean leftover test data before the run */
  globalSetup: require.resolve("./global-setup"),
  /* Global teardown: clean up test data after the run */
  globalTeardown: require.resolve("./global-teardown"),
});
