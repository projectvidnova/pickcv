/**
 * Playwright global setup — runs once BEFORE all tests.
 *
 * 1. Verifies the staging backend is reachable.
 * 2. Cleans up any leftover E2E test data from previous runs.
 */
import { request } from "@playwright/test";
import {
  STAGING_API_URL,
  E2E_SECRET,
  cleanupTestData,
} from "./helpers/api-client";

async function globalSetup() {
  console.log("\n🔧 E2E Global Setup");
  console.log(`   API URL: ${STAGING_API_URL}`);

  const ctx = await request.newContext();

  // 1. Health check — make sure the backend is alive
  let retries = 5;
  while (retries > 0) {
    try {
      const resp = await ctx.get(`${STAGING_API_URL}/health`);
      if (resp.ok()) {
        console.log("   ✅ Backend is healthy");
        break;
      }
    } catch {
      // ignore — will retry
    }
    retries--;
    if (retries === 0) {
      throw new Error(
        `Backend at ${STAGING_API_URL} is not responding after 5 retries`
      );
    }
    console.log(`   ⏳ Waiting for backend... (${retries} retries left)`);
    await new Promise((r) => setTimeout(r, 5_000));
  }

  // 2. Check E2E routes are enabled (staging only)
  try {
    const resp = await ctx.get(`${STAGING_API_URL}/api/e2e/health`, {
      headers: { "x-e2e-secret": E2E_SECRET },
    });
    if (resp.ok()) {
      console.log("   ✅ E2E routes are enabled (staging environment)");
    } else {
      console.warn(
        `   ⚠️  E2E routes returned ${resp.status()} — tests may fail if this isn't staging`
      );
    }
  } catch (err) {
    console.warn("   ⚠️  Could not reach E2E health endpoint:", err);
  }

  // 3. Pre-cleanup — remove leftover data from crashed previous runs
  try {
    const result = await cleanupTestData(ctx);
    console.log(
      `   🧹 Pre-cleanup: removed ${result.body?.total_rows ?? 0} leftover rows`
    );
  } catch {
    console.log("   🧹 Pre-cleanup: no leftover data (or cleanup not available)");
  }

  await ctx.dispose();
  console.log("   ✅ Global setup complete\n");
}

export default globalSetup;
