# PickCV Google Cloud Deployment Guide

## Prerequisites

1. **Google Cloud Account**
   - Create account at https://cloud.google.com
   - Enable billing for your account

2. **Install Google Cloud SDK**
   ```bash
   # macOS with Homebrew
   brew install google-cloud-sdk
   
   # Or download from
   https://cloud.google.com/sdk/docs/install
   ```

3. **Install Docker**
   ```bash
   # macOS with Homebrew
   brew install docker
   ```

## Quick Deployment

### Option 1: Automated Deployment Script (Recommended)

```bash
# Make script executable
chmod +x deploy-gcp.sh

# Run deployment
./deploy-gcp.sh
```

This script will:
- Create a GCP project
- Enable required APIs
- Create Docker registry
- Build and push both images
- Create Cloud SQL PostgreSQL instance
- Deploy backend to Cloud Run
- Deploy frontend to Cloud Run

### Option 2: Manual Deployment

#### Step 1: Set up GCP Project
```bash
# Login to Google Cloud
gcloud auth login

# Create project
gcloud projects create pickcv-production --name="PickCV Production"
gcloud config set project pickcv-production

# Enable APIs
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    sqladmin.googleapis.com
```

#### Step 2: Set up Docker Registry
```bash
# Create artifact registry
gcloud artifacts repositories create pickcv-repo \
    --repository-format=docker \
    --location=us-central1

# Configure Docker
gcloud auth configure-docker us-central1-docker.pkg.dev
```

#### Step 3: Build and Push Images
```bash
# Backend
cd backend
docker build -t us-central1-docker.pkg.dev/pickcv-production/pickcv-repo/pickcv-backend .
docker push us-central1-docker.pkg.dev/pickcv-production/pickcv-repo/pickcv-backend
cd ..

# Frontend
cd frontend
docker build -t us-central1-docker.pkg.dev/pickcv-production/pickcv-repo/pickcv-frontend .
docker push us-central1-docker.pkg.dev/pickcv-production/pickcv-repo/pickcv-frontend
cd ..
```

#### Step 4: Create Cloud SQL Database
```bash
# Create instance
gcloud sql instances create pickcv-postgres \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database
gcloud sql databases create pickcv \
    --instance=pickcv-postgres

# Set root password
gcloud sql users set-password postgres \
    --instance=pickcv-postgres \
    --password=<YOUR_SECURE_PASSWORD>
```

#### Step 5: Deploy Backend
```bash
gcloud run deploy pickcv-backend \
    --image=us-central1-docker.pkg.dev/pickcv-production/pickcv-repo/pickcv-backend \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --set-env-vars="DATABASE_URL=postgresql://postgres:<PASSWORD>@<CLOUD_SQL_IP>:5432/pickcv"
```

#### Step 6: Deploy Frontend
```bash
gcloud run deploy pickcv-frontend \
    --image=us-central1-docker.pkg.dev/pickcv-production/pickcv-repo/pickcv-frontend \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --set-env-vars="VITE_API_URL=<BACKEND_URL>"
```

## Environment Variables

### Backend (.env in Cloud Run)
```
DATABASE_URL=postgresql://user:password@host:port/database
GEMINI_API_KEY=<your_gemini_key>
JWT_SECRET=<your_jwt_secret>
```

### Frontend (.env in Cloud Run)
```
VITE_API_URL=https://pickcv-backend-xxxxx.run.app
VITE_APP_ENV=production
```

## Monitoring and Management

### View Logs
```bash
# Backend logs
gcloud run logs read pickcv-backend --region=us-central1 --limit=50

# Frontend logs
gcloud run logs read pickcv-frontend --region=us-central1 --limit=50
```

### Manage Services
```bash
# List services
gcloud run services list --region=us-central1

# Update service
gcloud run deploy pickcv-backend \
    --update-env-vars=KEY=VALUE \
    --region=us-central1

# Delete service
gcloud run services delete pickcv-backend --region=us-central1
```

## Cost Estimation

**Cloud Run (Free tier includes):**
- 2M requests/month free
- 360K GB-seconds/month free
- Beyond free tier: ~$0.40 per 1M requests

**Cloud SQL (Approximate):**
- db-f1-micro: ~$10-15/month
- PostgreSQL 15: additional storage fees

## Custom Domain Setup

```bash
# Map custom domain
gcloud run domain-mappings create \
    --service=pickcv-frontend \
    --domain=your-domain.com \
    --region=us-central1
```

## Troubleshooting

### Docker Build Issues
- Ensure you're in the correct directory
- Check Dockerfile syntax
- Verify Node.js/Python versions are compatible

### Cloud SQL Connection Issues
- Verify Cloud SQL instance is running
- Check firewall rules
- Ensure password is correct
- Verify database URL format

### Cloud Run Deployment Fails
- Check Cloud Build logs
- Verify image is in Artifact Registry
- Check service quotas
- Review environment variables

### Performance Issues
- Scale up Cloud Run instances
- Increase Cloud SQL tier
- Enable caching for frontend
- Use CDN for static assets

## Rollback

```bash
# View revision history
gcloud run revisions list --service=pickcv-backend

# Deploy previous version
gcloud run deploy pickcv-backend \
    --image=<PREVIOUS_IMAGE_URL> \
    --region=us-central1
```

## Security Best Practices

1. **Never commit secrets** - Use GCP Secret Manager
2. **Use Cloud SQL Auth Proxy** for local development
3. **Enable IAM authentication** for services
4. **Set up Cloud CDN** for frontend
5. **Use Cloud Armor** for DDoS protection
6. **Enable Cloud Logging** for audit trails
7. **Regular backups** of Cloud SQL database

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud)
