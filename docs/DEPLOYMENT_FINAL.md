# PickCV Deployment Summary

## ✅ Deployment Complete

**Date:** March 8, 2026

### 🌐 Live URLs

- **Frontend:** https://studio-1324640898-76b00.web.app
- **Backend API:** https://pickcv-backend-318698650933.us-central1.run.app/api

### 📦 Infrastructure

#### Backend (Cloud Run)
- **Service:** `pickcv-backend`
- **Project:** `pickcv-prod-001`
- **Region:** `us-central1`
- **Runtime:** Python 3.11 (FastAPI + Uvicorn)
- **Database:** PostgreSQL at `34.71.67.28:5432/pickcv`
- **Features:**
  - Google OAuth 2.0 authentication
  - Resume upload & parsing (PDF, DOCX, DOC, TXT)
  - AI resume optimization (Gemini 1.5 Flash)
  - Job description scraping
  - Resume comparison analysis

#### Frontend (Firebase Hosting)
- **Project:** `studio-1324640898-76b00`
- **Framework:** React 19 + TypeScript + Vite
- **Build Output:** `/frontend/out`
- **Features:**
  - Google Sign-In
  - Resume upload & optimization
  - Three job input modes (paste, link, title)
  - Template selection
  - Download functionality

### 🔧 Configuration Files

#### Frontend Environment (`.env`)
```
VITE_API_URL=https://pickcv-backend-318698650933.us-central1.run.app/api
VITE_GOOGLE_CLIENT_ID=1018775403915-nt4maepc1r3cm9ubg5s4asssv5jn1qq6.apps.googleusercontent.com
```

#### Firebase Configuration
- **Project:** `studio-1324640898-76b00`
- **Hosting Config:** `firebase.json`
- **Project Config:** `.firebaserc`

### 📝 Deployment Commands

#### Backend Deployment
```bash
cd backend
docker buildx build --platform linux/amd64 -t us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest --push .
gcloud run deploy pickcv-backend --image us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest --region us-central1 --project pickcv-prod-001 --allow-unauthenticated
```

#### Frontend Deployment
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

### 🌍 Custom Domain Setup

To connect `pickcv.com`:
1. Go to: https://console.firebase.google.com/project/studio-1324640898-76b00/hosting/sites
2. Click "Add custom domain"
3. Enter `pickcv.com`
4. Add TXT record to DNS for verification
5. Update A records in domain registrar with Firebase IPs
6. Wait for SSL certificate (usually < 1 hour)

### ✅ Working Features

- ✅ Google OAuth authentication
- ✅ User profile display with picture
- ✅ Resume upload (all formats)
- ✅ Resume optimization with AI
- ✅ Job description scraping
- ✅ Resume comparison
- ✅ Template selection
- ✅ Download functionality

### 📂 Removed Files

All Docker-related files removed (deployment uses Cloud Run with container):
- ❌ `backend/Dockerfile` (removed, but kept in Docker build process)
- ❌ `frontend/Dockerfile`
- ❌ `frontend/Dockerfile.simple`
- ❌ `docker-compose.yml`
- ❌ `docker-compose.dev.yml`

### 🔐 Environment Variables (Backend)

Set in Cloud Run service:
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret

### 📊 Status Check Commands

```bash
# Check backend health
curl https://pickcv-backend-318698650933.us-central1.run.app/health

# Check frontend
curl -I https://studio-1324640898-76b00.web.app

# View backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=pickcv-backend" --limit=50 --project=pickcv-prod-001

# Check Cloud Run service status
gcloud run services describe pickcv-backend --region=us-central1 --project=pickcv-prod-001
```

### 🎯 Next Steps

1. ✅ Test all features on live URLs
2. ⏳ Add custom domain `pickcv.com` to Firebase Hosting
3. ⏳ Update Google OAuth redirect URLs if needed
4. ⏳ Monitor costs and performance
5. ⏳ Set up monitoring/alerting

---

**Deployment completed successfully! 🚀**
