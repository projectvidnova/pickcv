/**
 * Playwright global teardown — runs once AFTER all tests.
 *
 * Calls the cleanup endpoint to remove all E2E test data.
 */
import { request } from "@playwright/test";
import { cleanupTestData } from "./helpers/api-client";

async function globalTeardown() {
  console.log("\n🧹 E2E Global Teardown");

  const ctx = await request.newContext();

  try {
    const result = await cleanupTestData(ctx);
    console.log(
      `   ✅ Cleanup complete: removed ${result.body?.total_rows ?? 0} rows`
    );
    if (result.body?.deleted) {
      const tables = Object.entries(result.body.deleted)
        .filter(([, count]) => (count as number) > 0)
        .map(([table, count]) => `${table}: ${count}`)
        .join(", ");
      if (tables) console.log(`   📊 ${tables}`);
    }
  } catch (err) {
    console.warn("   ⚠️  Cleanup failed:", err);
  }

  await ctx.dispose();
  console.log("   ✅ Global teardown complete\n");
}

export default globalTeardown;
