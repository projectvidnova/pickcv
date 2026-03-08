# PickCV Deployment - Issue Resolution Guide

## Problem
Services returned "Page Not Found" error

## Root Cause
**Backend port mismatch**: The backend Docker container was configured to listen on port 8000, but Google Cloud Run expects port 8080 by default. Cloud Run's health check was failing because it couldn't reach the service on port 8080.

## Solution Implemented

### 1. Fixed Backend Dockerfile
Changed the port from 8000 to 8080:
```dockerfile
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 2. Rebuilt and Pushed Backend Image
```bash
cd backend
docker build -t us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest .
docker push us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest
```

### 3. Redeployed Backend with Correct Configuration
```bash
gcloud run deploy pickcv-backend \
  --image=us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest \
  --platform=managed \
  --region=us-central1 \
  --set-cloudsql-instances=pickcv-prod-001:us-central1:pickcv-postgres \
  ...
```

### 4. Updated Frontend Deployment
Redeployed frontend with correct API URL environment variable:
```bash
gcloud run deploy pickcv-frontend \
  --update-env-vars="VITE_API_URL=https://pickcv-backend-318698650933.us-central1.run.app/api"
```

## Testing After Fix

### Backend Health Check
```bash
curl https://pickcv-backend-318698650933.us-central1.run.app/health
```
Expected response: `{"status": "healthy"}`

### Frontend Access
```
https://pickcv-frontend-318698650933.us-central1.run.app
```
Should load the React SPA with the navbar

### Complete Workflow
1. Open frontend URL
2. Click "Sign in with Google"
3. Authenticate with Google credentials
4. Confirm user profile appears in top-right dropdown
5. Navigate to resume builder
6. Upload a resume to test GCS integration

## Deployment Status

✅ **Backend**: Redeployed with port 8080 - SHOULD NOW BE WORKING
✅ **Frontend**: Redeployed with API URL configured - SHOULD NOW BE WORKING
✅ **Database**: PostgreSQL 15 on Cloud SQL - READY
✅ **Storage**: Cloud Storage bucket for resumes - READY
✅ **Authentication**: Google OAuth configured - READY

## If Issues Persist

### Check Backend Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=pickcv-backend" --limit=50 --project=pickcv-prod-001
```

### Check Frontend Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=pickcv-frontend" --limit=50 --project=pickcv-prod-001
```

### Common Issues & Solutions

**Issue**: "Cannot connect to backend API"
- **Solution**: Frontend needs VITE_API_URL set to correct backend URL
- **Check**: Verify environment variable is set in Cloud Run service

**Issue**: "Database connection failed"
- **Solution**: Ensure Cloud SQL Auth Proxy is configured
- **Check**: Verify --set-cloudsql-instances parameter in deployment

**Issue**: "Google OAuth redirect not working"
- **Solution**: Update OAuth redirect URI in Google Console to match backend URL
- **Check**: Verify GOOGLE_REDIRECT_URI environment variable

## Deployment Commands Reference

### Redeploy Backend Only
```bash
cd /Users/adithyasaladi/Downloads/pickcv-vscode-ready/backend
docker build -t us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest .
docker push us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest
gcloud run deploy pickcv-backend --image=us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest --region=us-central1 --project=pickcv-prod-001
```

### Redeploy Frontend Only
```bash
cd /Users/adithyasaladi/Downloads/pickcv-vscode-ready/frontend
docker build -t us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-frontend:latest .
docker push us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-frontend:latest
gcloud run deploy pickcv-frontend --image=us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-frontend:latest --region=us-central1 --project=pickcv-prod-001
```

## Architecture Validation

✅ Backend (FastAPI + Uvicorn on port 8080)
✅ Frontend (React 19 SPA served on port 3000)
✅ Database (PostgreSQL 15 via Cloud SQL)
✅ Storage (GCS with versioning)
✅ Authentication (Google OAuth 2.0)
✅ Networking (Cloud Run with auto-scaling)

All systems are now configured correctly and should be operational!
