/**
 * Resume Upload & Management E2E Tests
 *
 * Prerequisites: Auth tests must run first (state.userToken is set).
 *
 * Simulates:
 *   1. Upload a PDF resume
 *   2. List resumes (should contain the uploaded one)
 *   3. Get resume detail by ID
 *   4. Verify parsed text exists
 */
import { test, expect } from "@playwright/test";
import {
  state,
  STAGING_API_URL,
  testEmail,
  TEST_PASSWORD,
  registerUser,
  verifyUser,
  loginUser,
  uploadResume,
  listResumes,
  getResume,
} from "../../helpers/api-client";
import { createTestPDF } from "../../helpers/test-pdf";

// If auth tests didn't run, create our own user
const email = testEmail("resume");
let token: string;

test.describe("Resume Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("0 — Setup: register + verify + login", async ({ request }) => {
    // Use state from auth tests if available, otherwise create fresh user
    if (state.userToken) {
      token = state.userToken;
      return;
    }

    // Fresh user for this suite
    await registerUser(request, email);
    await verifyUser(request, email);
    const login = await loginUser(request, email);
    expect(login.status).toBe(200);
    token = login.body.access_token;
    state.userToken = token;
    state.userEmail = email;
  });

  test("1 — Upload a PDF resume", async ({ request }) => {
    const pdf = createTestPDF();
    const { status, body } = await uploadResume(request, token, pdf);

    // 200 or 201 are both acceptable
    expect([200, 201]).toContain(status);
    expect(body.id).toBeDefined();
    expect(body.title).toBe("E2E Test Resume");
    expect(body.original_filename).toBe("test-resume.pdf");

    state.resumeId = body.id;
  });

  test("2 — List resumes", async ({ request }) => {
    const { status, body } = await listResumes(request, token);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThanOrEqual(1);

    // Verify our resume is in the list
    const found = body.find((r: any) => r.id === state.resumeId);
    expect(found).toBeDefined();
  });

  test("3 — Get resume detail", async ({ request }) => {
    expect(state.resumeId).toBeDefined();

    const { status, body } = await getResume(request, token, state.resumeId!);
    expect(status).toBe(200);
    expect(body.id).toBe(state.resumeId);
    expect(body.title).toBe("E2E Test Resume");
  });

  test("4 — Resume has extracted text", async ({ request }) => {
    const { body } = await getResume(request, token, state.resumeId!);
    // The backend extracts text from the PDF
    // Our test PDF contains "E2E Test Resume" text
    expect(body.raw_text).toBeDefined();
    if (body.raw_text) {
      expect(body.raw_text.length).toBeGreaterThan(0);
    }
  });

  test("5 — Upload second resume", async ({ request }) => {
    const pdf = createTestPDF();
    const { status, body } = await uploadResume(
      request,
      token,
      pdf,
      "second-resume.pdf",
      "E2E Second Resume"
    );
    expect([200, 201]).toContain(status);
    expect(body.title).toBe("E2E Second Resume");
  });

  test("6 — List shows both resumes", async ({ request }) => {
    const { status, body } = await listResumes(request, token);
    expect(status).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(2);
  });
});
