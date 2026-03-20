/**
 * Standalone cleanup script — run manually to purge E2E test data.
 *
 * Usage:
 *   STAGING_API_URL=https://... E2E_CLEANUP_SECRET=... npx ts-node scripts/cleanup.ts
 */

const API_URL = process.env.STAGING_API_URL ?? "http://localhost:8000";
const SECRET = process.env.E2E_CLEANUP_SECRET ?? "dev-secret-key-change-in-production";

async function main() {
  console.log(`🧹 Cleaning up E2E test data at ${API_URL}...`);

  const resp = await fetch(`${API_URL}/api/e2e/cleanup`, {
    method: "POST",
    headers: {
      "x-e2e-secret": SECRET,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    console.error(`❌ Cleanup failed: ${resp.status} ${resp.statusText}`);
    const text = await resp.text();
    console.error(text);
    process.exit(1);
  }

  const body = await resp.json();
  console.log(`✅ Cleaned ${body.total_rows} rows`);

  if (body.deleted) {
    for (const [table, count] of Object.entries(body.deleted)) {
      if ((count as number) > 0) {
        console.log(`   ${table}: ${count}`);
      }
    }
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
