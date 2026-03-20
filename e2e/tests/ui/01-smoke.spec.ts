/**
 * Frontend UI Smoke Tests
 *
 * Quick browser-based checks that critical pages load correctly.
 * These run in Chromium and verify the React app renders
 * without crashing on the most important routes.
 *
 * We do NOT test full user flows here (that's the API tests' job).
 * These just confirm the frontend bundle is deployed and pages load.
 */
import { test, expect } from "@playwright/test";

test.describe("UI Smoke Tests", () => {
  test("Homepage loads", async ({ page }) => {
    await page.goto("/");
    // Wait for the React app to hydrate
    await page.waitForLoadState("networkidle");

    // The page should have the PickCV branding
    const title = await page.title();
    expect(title).toBeTruthy();

    // Check that the main content area rendered (not a blank page)
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(50);
  });

  test("Homepage has navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should have nav links — look for common ones
    const hasNav = await page.locator("nav, header").count();
    expect(hasNav).toBeGreaterThan(0);
  });

  test("About page loads", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(50);
  });

  test("Jobs page loads", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(50);
  });

  test("Contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(50);
  });

  test("College registration page loads", async ({ page }) => {
    await page.goto("/college/register");
    await page.waitForLoadState("networkidle");

    // Should have a registration form
    const formElements = await page
      .locator("input, form, button")
      .count();
    expect(formElements).toBeGreaterThan(0);
  });

  test("404 page for invalid routes", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-12345");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    // Should show some kind of not-found message, not a blank page
    expect(body?.length).toBeGreaterThan(20);
  });

  test("No JavaScript errors on homepage", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Allow some non-critical errors (e.g., analytics), but no React crashes
    const criticalErrors = errors.filter(
      (e) =>
        e.includes("React") ||
        e.includes("TypeError") ||
        e.includes("ReferenceError")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("API health accessible from frontend origin", async ({ page }) => {
    // Navigate to app first (sets the origin)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Call the API health endpoint from the browser context
    const apiUrl = process.env.STAGING_API_URL ?? "http://localhost:8000";
    const response = await page.evaluate(async (url) => {
      try {
        const resp = await fetch(`${url}/api/health`);
        return { status: resp.status, ok: resp.ok };
      } catch (e: any) {
        return { status: 0, ok: false, error: e.message };
      }
    }, apiUrl);

    // If CORS is working, we should get a 200
    // If CORS is broken, we'll get status 0
    expect(response.status).toBe(200);
  });
});
