/**
 * PickCV E2E — Shared test helpers and API client.
 *
 * Every test account uses the prefix `e2e_test_` so the cleanup
 * endpoint can safely wipe them after the run.
 */
import { APIRequestContext, expect } from "@playwright/test";

// ── Environment ──────────────────────────────────────────────
export const STAGING_API_URL =
  process.env.STAGING_API_URL ?? "http://localhost:8000";
export const STAGING_APP_URL =
  process.env.STAGING_APP_URL ?? "http://localhost:5173";
export const E2E_SECRET =
  process.env.E2E_CLEANUP_SECRET ?? "dev-secret-key-change-in-production";

// ── Test data naming conventions ─────────────────────────────
const runId = Date.now().toString(36); // short unique per-run suffix

export function testEmail(label: string = "user"): string {
  return `e2e_test_${label}_${runId}@test.pickcv.com`;
}

export function testCollegeEmail(label: string = "college"): string {
  return `e2e_college_${label}_${runId}@test.pickcv.com`;
}

export const TEST_PASSWORD = "E2eTestPass!123";

// ── Shared state across tests within one run ─────────────────
export interface TestState {
  userEmail: string;
  userToken: string;
  userId: number;
  resumeId: number;
  collegeEmail: string;
  collegeToken: string;
  collegeId: number;
}

/** Mutable singleton — tests write to this as they progress. */
export const state: Partial<TestState> = {};

// ── API helper functions ─────────────────────────────────────

/** Call the E2E health check to verify staging routes are available. */
export async function checkE2EHealth(request: APIRequestContext) {
  const resp = await request.get(`${STAGING_API_URL}/api/e2e/health`, {
    headers: { "x-e2e-secret": E2E_SECRET },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** Register a new user via the auth API. */
export async function registerUser(
  request: APIRequestContext,
  email: string,
  password: string = TEST_PASSWORD,
  fullName: string = "E2E Test User"
) {
  const resp = await request.post(`${STAGING_API_URL}/api/auth/register`, {
    data: { email, password, full_name: fullName },
  });
  return { status: resp.status(), body: await resp.json() };
}

/** Auto-verify a test user (staging-only E2E endpoint). */
export async function verifyUser(
  request: APIRequestContext,
  email: string
) {
  const resp = await request.post(
    `${STAGING_API_URL}/api/e2e/verify-user?email=${encodeURIComponent(email)}`,
    { headers: { "x-e2e-secret": E2E_SECRET } }
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** Login and return access token. */
export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string = TEST_PASSWORD
) {
  const resp = await request.post(`${STAGING_API_URL}/api/auth/token`, {
    form: { username: email, password },
  });
  return { status: resp.status(), body: await resp.json() };
}

/** Get current user profile. */
export async function getMe(
  request: APIRequestContext,
  token: string
) {
  const resp = await request.get(`${STAGING_API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: resp.status(), body: await resp.json() };
}

/** Upload a resume file. */
export async function uploadResume(
  request: APIRequestContext,
  token: string,
  fileBuffer: Buffer,
  fileName: string = "test-resume.pdf",
  title: string = "E2E Test Resume"
) {
  const resp = await request.post(`${STAGING_API_URL}/api/resume/upload`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      title,
      file: {
        name: fileName,
        mimeType: "application/pdf",
        buffer: fileBuffer,
      },
    },
  });
  return { status: resp.status(), body: await resp.json() };
}

/** List user's resumes. */
export async function listResumes(
  request: APIRequestContext,
  token: string
) {
  const resp = await request.get(`${STAGING_API_URL}/api/resume/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: resp.status(), body: await resp.json() };
}

/** Get a single resume detail. */
export async function getResume(
  request: APIRequestContext,
  token: string,
  resumeId: number
) {
  const resp = await request.get(
    `${STAGING_API_URL}/api/resume/${resumeId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return { status: resp.status(), body: await resp.json() };
}

/** Check download access for a resume. */
export async function checkDownloadAccess(
  request: APIRequestContext,
  token: string,
  resumeId: number
) {
  const resp = await request.get(
    `${STAGING_API_URL}/api/payments/check-access/${resumeId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return { status: resp.status(), body: await resp.json() };
}

/** Use the one-time free download. */
export async function useFreeDownload(
  request: APIRequestContext,
  token: string,
  resumeId: number
) {
  const resp = await request.post(
    `${STAGING_API_URL}/api/payments/use-free-download`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: { resume_id: resumeId },
    }
  );
  return { status: resp.status(), body: await resp.json() };
}

/** Get payment plans. */
export async function getPaymentPlans(request: APIRequestContext) {
  const resp = await request.get(`${STAGING_API_URL}/api/payments/plans`);
  return { status: resp.status(), body: await resp.json() };
}

/** Get payment config (account ID, API key — public info). */
export async function getPaymentConfig(request: APIRequestContext) {
  const resp = await request.get(`${STAGING_API_URL}/api/payments/config`);
  return { status: resp.status(), body: await resp.json() };
}

/** Register a college. */
export async function registerCollege(
  request: APIRequestContext,
  email: string,
  password: string = TEST_PASSWORD,
  institutionName: string = "E2E Test College"
) {
  const resp = await request.post(
    `${STAGING_API_URL}/api/college/register`,
    {
      data: {
        institution_name: institutionName,
        official_email: email,
        password,
        contact_person_name: "E2E Tester",
        designation: "IT Admin",
        phone_number: "+919876543210",
        city: "Hyderabad",
        state: "Telangana",
        institution_type: "Engineering",
      },
    }
  );
  return { status: resp.status(), body: await resp.json() };
}

/** Auto-approve a test college (staging-only E2E endpoint). */
export async function approveCollege(
  request: APIRequestContext,
  email: string
) {
  const resp = await request.post(
    `${STAGING_API_URL}/api/e2e/approve-college?email=${encodeURIComponent(email)}`,
    { headers: { "x-e2e-secret": E2E_SECRET } }
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** Login as a college. */
export async function loginCollege(
  request: APIRequestContext,
  email: string,
  password: string = TEST_PASSWORD
) {
  const resp = await request.post(`${STAGING_API_URL}/api/college/login`, {
    data: { email, password },
  });
  return { status: resp.status(), body: await resp.json() };
}

/** Get college profile. */
export async function getCollegeProfile(
  request: APIRequestContext,
  token: string
) {
  const resp = await request.get(`${STAGING_API_URL}/api/college/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: resp.status(), body: await resp.json() };
}

/** Trigger the E2E cleanup endpoint. */
export async function cleanupTestData(request: APIRequestContext) {
  const resp = await request.post(`${STAGING_API_URL}/api/e2e/cleanup`, {
    headers: { "x-e2e-secret": E2E_SECRET },
  });
  return { status: resp.status(), body: await resp.json() };
}
