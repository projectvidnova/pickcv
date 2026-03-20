# PickCV E2E Smoke Tests

Automated end-to-end tests that run against the **staging environment** after every deployment. Tests simulate real user workflows and automatically clean up all test data.

## Architecture

```
e2e/
├── playwright.config.ts       # Test configuration (API + UI projects)
├── global-setup.ts            # Pre-test: health check + cleanup leftovers
├── global-teardown.ts         # Post-test: cleanup all test data
├── helpers/
│   ├── api-client.ts          # Shared API helpers & test state
│   └── test-pdf.ts            # Generates a minimal test PDF in memory
├── tests/
│   ├── api/                   # Headless API tests (no browser)
│   │   ├── 01-auth.spec.ts    # Register → verify → login → profile
│   │   ├── 02-resume.spec.ts  # Upload → list → detail → text extraction
│   │   ├── 03-payment.spec.ts # Config → plans → free download → access check
│   │   └── 04-college.spec.ts # Register → approve → login → students → stats
│   └── ui/                    # Browser tests (Chromium)
│       └── 01-smoke.spec.ts   # Page loads, nav, 404, JS errors, CORS
```

## Test Data Convention

| Entity  | Email prefix           | Example                                  |
| ------- | ---------------------- | ---------------------------------------- |
| Users   | `e2e_test_`            | `e2e_test_auth_m1a2b@test.pickcv.com`    |
| Colleges| `e2e_college_`         | `e2e_college_main_m1a2b@test.pickcv.com` |

The cleanup endpoint (`POST /api/e2e/cleanup`) deletes all records matching these prefixes. It runs both **before** and **after** the test suite.

## Backend Support (Staging Only)

Three endpoints are registered ONLY when `ENVIRONMENT=staging`:

| Endpoint                        | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `POST /api/e2e/cleanup`         | Delete all test data                     |
| `POST /api/e2e/verify-user`     | Auto-verify a test user (bypass email)   |
| `POST /api/e2e/approve-college` | Auto-approve a test college              |
| `GET  /api/e2e/health`          | Check E2E routes are enabled             |

All endpoints require `X-E2E-Secret` header = the staging `SECRET_KEY`.

## Running Locally

```bash
cd e2e
npm install
npx playwright install chromium

# Against local dev server
STAGING_API_URL=http://localhost:8000 \
STAGING_APP_URL=http://localhost:5173 \
E2E_CLEANUP_SECRET=dev-secret-key-change-in-production \
npx playwright test

# API tests only (faster, no browser)
npx playwright test --project=api

# UI tests only (opens Chromium)
npx playwright test --project=ui

# With headed browser (see what's happening)
npx playwright test --project=ui --headed

# View the HTML report
npx playwright show-report
```

## CI/CD Integration

The tests run automatically in GitHub Actions:

```
push to main
  ├── deploy-production  (parallel)
  └── deploy-staging     (parallel)
        └── e2e-tests    (after staging succeeds)
              ├── API tests  (auth, resume, payment, college)
              └── UI tests   (page loads, CORS, JS errors)
```

The `e2e-tests` job:
1. Waits for staging deploy to finish
2. Waits 30s for Cloud Run cold start
3. Runs API smoke tests (register, login, upload, pay, college)
4. Runs UI smoke tests (page loads, CORS from browser)
5. Uploads HTML report as artifact (14-day retention)
6. Uploads traces on failure (7-day retention)

### Required GitHub Secrets

The E2E tests reuse `SECRET_KEY_STAGING` (already configured) as the cleanup secret. No additional secrets needed.

## Test Flows Covered

### 1. Auth Flow (01-auth.spec.ts)
- ✅ API health check
- ✅ Register new user
- ✅ Login before verification → 403
- ✅ Auto-verify email (staging helper)
- ✅ Login after verification → JWT token
- ✅ Fetch user profile with token
- ✅ Duplicate registration → 400
- ✅ Wrong password → 401
- ✅ Protected route without token → 401

### 2. Resume Flow (02-resume.spec.ts)
- ✅ Upload a PDF resume
- ✅ List all resumes
- ✅ Get resume detail by ID
- ✅ Verify text extraction worked
- ✅ Upload second resume
- ✅ List shows both resumes

### 3. Payment Flow (03-payment.spec.ts)
- ✅ Get payment config
- ✅ Get payment plans
- ✅ Check download access (free download available)
- ✅ Use one-time free download
- ✅ Re-check access (free download consumed)
- ✅ Auth required for payment endpoints

### 4. College Flow (04-college.spec.ts)
- ✅ Register new college
- ✅ Login as pending college
- ✅ Auto-approve college (staging helper)
- ✅ Login as approved college
- ✅ Get college profile
- ✅ Upload students
- ✅ Get college stats
- ✅ Duplicate registration → 400
- ✅ Auth required for college endpoints

### 5. UI Smoke (01-smoke.spec.ts)
- ✅ Homepage loads and renders
- ✅ Navigation exists
- ✅ About page loads
- ✅ Jobs page loads
- ✅ Contact page loads
- ✅ College register page has form
- ✅ 404 page for unknown routes
- ✅ No JavaScript errors on homepage
- ✅ API health accessible from frontend origin (CORS check)

## Adding New Tests

1. Create a new file in `tests/api/` or `tests/ui/`
2. Name it with a number prefix for ordering: `05-new-feature.spec.ts`
3. Use helpers from `helpers/api-client.ts`
4. Use the `e2e_test_` email prefix for any test accounts
5. Tests clean up automatically via global teardown
