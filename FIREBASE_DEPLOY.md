# Firebase Hosting Deployment Guide (Most Affordable)

## Why Firebase Hosting?
- ✅ **FREE tier:** 1 GB storage, 10 GB/month bandwidth
- ✅ **No Docker needed**
- ✅ **Instant global CDN**
- ✅ **Free SSL/TLS certificate**
- ✅ **Custom domain support**
- ✅ **Takes 2 minutes to deploy**

## Quick Start

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```
This opens a browser - authorize and you're done.

### 3. Build Frontend
```bash
cd frontend
npm run build
cd ..
```

### 4. Deploy to Firebase
```bash
firebase deploy
```

That's it! Your app is live. You'll get a URL like:
```
https://pickcv-xxxxx.web.app
```

## Cost Breakdown

### Free Tier (Covers most cases)
- **Storage:** 1 GB free
- **Bandwidth:** 10 GB/month free
- **Perfect for:** Low-medium traffic apps

### If You Exceed Free Tier
- **Additional storage:** $0.018/GB/month
- **Additional bandwidth:** $0.15/GB
- **Example:** 50 GB/month bandwidth = $7.50/month

## Before Deployment - Important!

Make sure your frontend can reach the backend. Update your frontend API URL:

### Option A: Environment Variables (Recommended)
1. Create `.env.production` in frontend folder:
```
VITE_API_URL=https://your-backend-url.com
```

2. Update your API calls in React:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

### Option B: Update Later in Firebase Console
1. Deploy to Firebase
2. Add environment variables in Firebase Hosting settings

## Deployment Steps

```bash
# Step 1: Ensure you're in the project root
cd /path/to/pickcv-vscode-ready

# Step 2: Build the frontend
cd frontend
npm run build

# Step 3: Go back to root
cd ..

# Step 4: Initialize Firebase (first time only)
firebase init hosting
# Select: Yes
# Project: pickcv-production (or your project ID)
# Public directory: frontend/dist
# Configure as SPA: Yes
# Overwrite: No

# Step 5: Deploy
firebase deploy
```

## Viewing Logs & Status

```bash
# View deployment history
firebase hosting:channel:list

# View analytics
firebase hosting:get <url>

# Check hosting status
firebase hosting:releases:list
```

## Later: Backend Deployment

When you're ready for the backend, use **Cloud Run** (pay-per-use):
- Backend on Cloud Run: ~$0.00002 per request
- Free tier: 2 million requests/month

That way:
- **Frontend:** Firebase Hosting (free)
- **Backend:** Cloud Run (pay-per-use, very cheap)

## Troubleshooting

### "dist folder not found"
```bash
cd frontend
npm run build
cd ..
```

### "App showing blank page"
1. Check browser console for API errors
2. Update VITE_API_URL to point to backend
3. Check CORS settings on backend

### "Need to redeploy"
```bash
firebase deploy --force
```

## Custom Domain (Optional)
```bash
firebase hosting:domain:create your-domain.com
```

## Rollback to Previous Version
```bash
firebase hosting:channel:open
# Select previous version and click "Promote"
```

## Monitor in Firebase Console
```
https://console.firebase.google.com/
```

---

**That's all you need to deploy the frontend!** 🚀
