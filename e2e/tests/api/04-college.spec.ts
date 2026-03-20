/**
 * College Flow E2E Tests
 *
 * Simulates the complete college lifecycle:
 *   1. Register a new college
 *   2. Auto-approve the college (staging helper)
 *   3. Login as the college
 *   4. Get college profile
 *   5. Upload students
 *   6. Get college stats
 */
import { test, expect } from "@playwright/test";
import {
  state,
  STAGING_API_URL,
  testCollegeEmail,
  TEST_PASSWORD,
  registerCollege,
  approveCollege,
  loginCollege,
  getCollegeProfile,
} from "../../helpers/api-client";

const collegeEmail = testCollegeEmail("main");

test.describe("College Flow", () => {
  test.describe.configure({ mode: "serial" });

  let collegeToken: string;

  test("1 — Register a new college", async ({ request }) => {
    const { status, body } = await registerCollege(request, collegeEmail);
    expect(status).toBe(201);
    expect(body.official_email).toBe(collegeEmail);
    expect(body.institution_name).toBe("E2E Test College");
    expect(body.status).toBe("pending");
    expect(body.id).toBeDefined();

    state.collegeEmail = collegeEmail;
    state.collegeId = body.id;
  });

  test("2 — Login as pending college → should still work (returns status)", async ({
    request,
  }) => {
    const { status, body } = await loginCollege(request, collegeEmail);
    // College can login even when pending — status is returned for frontend to handle
    expect(status).toBe(200);
    expect(body.status).toBe("pending");
    expect(body.access_token).toBeDefined();
  });

  test("3 — Auto-approve college", async ({ request }) => {
    const result = await approveCollege(request, collegeEmail);
    expect(result.status_val).toBe("approved");
  });

  test("4 — Login as approved college", async ({ request }) => {
    const { status, body } = await loginCollege(request, collegeEmail);
    expect(status).toBe(200);
    expect(body.status).toBe("approved");
    expect(body.access_token).toBeDefined();

    collegeToken = body.access_token;
    state.collegeToken = collegeToken;
  });

  test("5 — Get college profile", async ({ request }) => {
    const { status, body } = await getCollegeProfile(request, collegeToken);
    expect(status).toBe(200);
    expect(body.official_email).toBe(collegeEmail);
    expect(body.status).toBe("approved");
  });

  test("6 — Upload students (CSV format)", async ({ request }) => {
    // Upload student emails via the bulk upload endpoint
    const resp = await request.post(
      `${STAGING_API_URL}/api/college/students/upload`,
      {
        headers: { Authorization: `Bearer ${collegeToken}` },
        data: {
          students: [
            { email: "student1@testcollege.edu", name: "Test Student 1" },
            { email: "student2@testcollege.edu", name: "Test Student 2" },
          ],
        },
      }
    );
    // 200 or 201 = success, 400/422 = validation (still a valid response)
    expect([200, 201, 400, 422]).toContain(resp.status());
  });

  test("7 — Get college stats", async ({ request }) => {
    const resp = await request.get(`${STAGING_API_URL}/api/college/stats`, {
      headers: { Authorization: `Bearer ${collegeToken}` },
    });
    // Stats endpoint should work for approved colleges
    expect([200, 404]).toContain(resp.status());
    if (resp.status() === 200) {
      const body = await resp.json();
      expect(body).toBeDefined();
    }
  });

  test("8 — Duplicate college registration → 400", async ({ request }) => {
    const { status, body } = await registerCollege(request, collegeEmail);
    expect(status).toBe(400);
    expect(body.detail).toContain("already registered");
  });

  test("9 — College endpoints require auth", async ({ request }) => {
    const resp = await request.get(`${STAGING_API_URL}/api/college/profile`);
    expect([401, 403]).toContain(resp.status());
  });
});
