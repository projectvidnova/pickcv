/**
 * Auth Flow E2E Tests
 *
 * Simulates the complete user authentication lifecycle:
 *   1. Register a new account
 *   2. Attempt login BEFORE verification (should fail 403)
 *   3. Auto-verify the account (staging helper)
 *   4. Login and receive JWT
 *   5. Fetch user profile with the token
 *   6. Refresh the token
 */
import { test, expect } from "@playwright/test";
import {
  testEmail,
  TEST_PASSWORD,
  state,
  STAGING_API_URL,
  registerUser,
  verifyUser,
  loginUser,
  getMe,
} from "../../helpers/api-client";

const email = testEmail("auth");

test.describe("Auth Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("1 — Health check", async ({ request }) => {
    const resp = await request.get(`${STAGING_API_URL}/api/health`);
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.status).toBe("healthy");
  });

  test("2 — Register a new user", async ({ request }) => {
    const { status, body } = await registerUser(request, email);
    expect(status).toBe(201);
    expect(body.email).toBe(email);
    expect(body.id).toBeDefined();

    state.userEmail = email;
    state.userId = body.id;
  });

  test("3 — Login BEFORE verification → 403", async ({ request }) => {
    const { status, body } = await loginUser(request, email);
    expect(status).toBe(403);
    expect(body.detail).toContain("verify");
  });

  test("4 — Auto-verify test user", async ({ request }) => {
    const result = await verifyUser(request, email);
    expect(result.is_verified).toBe(true);
  });

  test("5 — Login AFTER verification → 200 + token", async ({ request }) => {
    const { status, body } = await loginUser(request, email);
    expect(status).toBe(200);
    expect(body.access_token).toBeDefined();
    expect(body.token_type).toBe("bearer");

    state.userToken = body.access_token;
  });

  test("6 — Get current user profile", async ({ request }) => {
    expect(state.userToken).toBeDefined();

    const { status, body } = await getMe(request, state.userToken!);
    expect(status).toBe(200);
    expect(body.email).toBe(email);
    expect(body.id).toBe(state.userId);
  });

  test("7 — Duplicate registration → 400", async ({ request }) => {
    const { status, body } = await registerUser(request, email);
    expect(status).toBe(400);
    expect(body.detail).toContain("already registered");
  });

  test("8 — Login with wrong password → 401", async ({ request }) => {
    const { status } = await loginUser(request, email, "WrongPassword!999");
    expect(status).toBe(401);
  });

  test("9 — Access protected route without token → 401", async ({
    request,
  }) => {
    const resp = await request.get(`${STAGING_API_URL}/api/auth/me`);
    expect(resp.status()).toBe(401);
  });
});
