#!/bin/bash
set -e

# Google Cloud Deployment Script for PickCV
# This script sets up and deploys PickCV to Google Cloud Platform

# Configuration
PROJECT_ID="pickcv-production"
REGION="us-central1"
SERVICE_NAME_BACKEND="pickcv-backend"
SERVICE_NAME_FRONTEND="pickcv-frontend"
DB_INSTANCE="pickcv-postgres"
DB_VERSION="POSTGRES_15"
ARTIFACT_REPO="pickcv-repo"

echo "================================"
echo "PickCV Google Cloud Deployment"
echo "================================"

# Step 1: Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "   Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ gcloud CLI found"

# Step 2: Create Google Cloud Project
echo ""
echo "📋 Step 1: Creating Google Cloud Project..."
gcloud projects create $PROJECT_ID --name="PickCV Production" 2>/dev/null || echo "   (Project may already exist)"
gcloud config set project $PROJECT_ID

# Step 3: Enable required APIs
echo ""
echo "🔧 Step 2: Enabling required Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    sqladmin.googleapis.com \
    compute.googleapis.com \
    cloudresourcemanager.googleapis.com

echo "✅ APIs enabled"

# Step 4: Create Artifact Registry
echo ""
echo "🗄️  Step 3: Creating Docker registry..."
gcloud artifacts repositories create $ARTIFACT_REPO \
    --repository-format=docker \
    --location=$REGION \
    2>/dev/null || echo "   (Repository may already exist)"

# Step 5: Configure Docker for gcloud
echo ""
echo "🐳 Step 4: Configuring Docker authentication..."
gcloud auth configure-docker $REGION-docker.pkg.dev

# Step 6: Build and push backend image
echo ""
echo "🏗️  Step 5: Building and pushing backend Docker image..."
BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REPO/$SERVICE_NAME_BACKEND:latest"
cd backend
docker build -t $BACKEND_IMAGE .
docker push $BACKEND_IMAGE
cd ..
echo "✅ Backend image pushed: $BACKEND_IMAGE"

# Step 7: Build and push frontend image
echo ""
echo "🏗️  Step 6: Building and pushing frontend Docker image..."
FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REPO/$SERVICE_NAME_FRONTEND:latest"
cd frontend
docker build -t $FRONTEND_IMAGE .
docker push $FRONTEND_IMAGE
cd ..
echo "✅ Frontend image pushed: $FRONTEND_IMAGE"

# Step 8: Create Cloud SQL instance (PostgreSQL)
echo ""
echo "🗄️  Step 7: Creating Cloud SQL PostgreSQL instance..."
gcloud sql instances create $DB_INSTANCE \
    --database-version=$DB_VERSION \
    --tier=db-f1-micro \
    --region=$REGION \
    --no-assign-ip \
    --availability-type=ZONAL \
    2>/dev/null || echo "   (Instance may already exist)"

# Step 9: Create database
echo ""
echo "📦 Step 8: Creating application database..."
gcloud sql databases create pickcv \
    --instance=$DB_INSTANCE \
    2>/dev/null || echo "   (Database may already exist)"

# Step 10: Get Cloud SQL connection string
echo ""
echo "🔐 Step 9: Getting Cloud SQL connection details..."
CLOUD_SQL_INSTANCE=$(gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)')
echo "   Cloud SQL Instance: $CLOUD_SQL_INSTANCE"

# Step 11: Deploy backend to Cloud Run
echo ""
echo "🚀 Step 10: Deploying backend to Cloud Run..."
gcloud run deploy $SERVICE_NAME_BACKEND \
    --image=$BACKEND_IMAGE \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --set-env-vars="DATABASE_URL=postgresql://postgres:password@/pickcv?host=/cloudsql/$CLOUD_SQL_INSTANCE" \
    --cloud-sql-instances=$CLOUD_SQL_INSTANCE

BACKEND_URL=$(gcloud run services describe $SERVICE_NAME_BACKEND --region=$REGION --format='value(status.url)')
echo "✅ Backend deployed: $BACKEND_URL"

# Step 12: Deploy frontend to Cloud Run
echo ""
echo "🚀 Step 11: Deploying frontend to Cloud Run..."
gcloud run deploy $SERVICE_NAME_FRONTEND \
    --image=$FRONTEND_IMAGE \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --set-env-vars="VITE_API_URL=$BACKEND_URL"

FRONTEND_URL=$(gcloud run services describe $SERVICE_NAME_FRONTEND --region=$REGION --format='value(status.url)')
echo "✅ Frontend deployed: $FRONTEND_URL"

# Summary
echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "📌 Service URLs:"
echo "   Backend:  $BACKEND_URL"
echo "   Frontend: $FRONTEND_URL"
echo ""
echo "📋 Next Steps:"
echo "   1. Update your database password in Cloud SQL"
echo "   2. Update backend environment variables"
echo "   3. Configure custom domain (optional)"
echo "   4. Set up Cloud SQL Auth Proxy for local development"
echo ""
echo "🔗 GCP Console: https://console.cloud.google.com/?project=$PROJECT_ID"
