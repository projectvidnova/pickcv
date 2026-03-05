# PickCV Backend - Production Deployment Guide

## 🚀 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Deployed)                  │
│                  www.pickcv.com (Firebase)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTPS / REST API
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Load Balancer (GCP)                    │
│                    (Cloud Load Balancing)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼────┐         ┌───▼────┐        ┌───▼────┐
    │FastAPI │         │FastAPI │        │FastAPI │
    │Instance│         │Instance│        │Instance│
    │  (1)   │         │  (2)   │        │  (3)   │
    └────────┘         └────────┘        └────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    PostgreSQL Network
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
    ┌───▼─────────┐                    ┌──────▼──────┐
    │ PostgreSQL  │◄────Replication───►│ PostgreSQL  │
    │ Primary     │                    │ Replica     │
    │ (Cloud SQL) │                    │ (Backup)    │
    └─────────────┘                    └─────────────┘
        │
        └────► Automated Backups (Google Cloud Storage)
```

---

## 🔐 Security Checklist

### Environment & Configuration
- ✅ Set `ENVIRONMENT=production`
- ✅ Generate strong `SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- ✅ Set `DEBUG=false`
- ✅ Configure `ALLOWED_ORIGINS` with your domain only
- ✅ Use environment variables (never hardcode secrets)

### Database
- ✅ Use managed PostgreSQL (Cloud SQL, RDS)
- ✅ Enable automatic backups (daily)
- ✅ Enable encryption at rest
- ✅ Use private network (no public IP)
- ✅ Strong database password
- ✅ Create read-only replica for analytics
- ✅ Regular security updates

### API Security
- ✅ HTTPS only (TLS 1.2+)
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Input validation on all endpoints
- ✅ Remove API docs from production (`/docs` hidden)
- ✅ Security headers enabled

### Application
- ✅ Run behind load balancer
- ✅ Use multiple FastAPI instances (horizontal scaling)
- ✅ Implement health checks
- ✅ Enable logging and monitoring
- ✅ Use Gunicorn (not Uvicorn directly)
- ✅ Regular dependency updates

---

## 📦 Deployment Options

### Option 1: Google Cloud Run (Recommended - Serverless)

**Advantages:**
- ✅ No server management
- ✅ Auto-scaling
- ✅ Pay-per-use
- ✅ Integrated with PostgreSQL

**Steps:**

```bash
# 1. Build Docker image
cd backend
docker build -t gcr.io/YOUR_PROJECT_ID/pickcv-backend:latest .

# 2. Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/pickcv-backend:latest

# 3. Deploy to Cloud Run
gcloud run deploy pickcv-backend \
  --image=gcr.io/YOUR_PROJECT_ID/pickcv-backend:latest \
  --platform=managed \
  --region=us-central1 \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10 \
  --set-env-vars="ENVIRONMENT=production,SECRET_KEY=YOUR_KEY,DATABASE_URL=YOUR_DB_URL" \
  --allow-unauthenticated

# 4. Get the service URL
gcloud run services describe pickcv-backend --region us-central1 --format='value(status.url)'
```

### Option 2: Google Compute Engine (VM-based)

**Advantages:**
- More control
- Better for scheduled jobs
- Custom configurations

**Setup:**

```bash
# 1. Create VM instance
gcloud compute instances create pickcv-backend \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --machine-type=n1-standard-2 \
  --zone=us-central1-a

# 2. SSH into instance
gcloud compute ssh pickcv-backend --zone=us-central1-a

# 3. Install dependencies
sudo apt-get update
sudo apt-get install -y python3.10 python3-pip postgresql-client

# 4. Deploy application
# Copy your code, create .env, install requirements
pip install -r requirements.txt

# 5. Run with Gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 --access-logfile - --error-logfile -
```

### Option 3: Docker Compose (Production Setup)

```yaml
version: '3.8'

services:
  web:
    image: pickcv-backend:latest
    container_name: pickcv-api
    ports:
      - "8000:8000"
    environment:
      ENVIRONMENT: production
      SECRET_KEY: ${SECRET_KEY}
      DATABASE_URL: postgresql+asyncpg://user:pass@db:5432/pickcv
    depends_on:
      - db
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    container_name: pickcv-db
    environment:
      POSTGRES_USER: pickcv_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: pickcv
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pickcv_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## 🚀 Deployment Commands

### 1. Production Build

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Collect static files (if any)
# python manage.py collectstatic

# Test the application
pytest tests/
```

### 2. Cloud SQL Setup

```bash
# Create Cloud SQL instance
gcloud sql instances create pickcv-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=us-central1 \
  --network=default \
  --no-assign-ip

# Create database
gcloud sql databases create pickcv --instance=pickcv-db

# Create user
gcloud sql users create pickcv_user --instance=pickcv-db --password

# Get connection string
gcloud sql instances describe pickcv-db --format='value(connectionName)'
```

### 3. Environment Variables (GCP Secret Manager)

```bash
# Create secrets
echo -n "your-secret-key" | gcloud secrets create SECRET_KEY --data-file=-
echo -n "your-db-url" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-gemini-key" | gcloud secrets create GEMINI_API_KEY --data-file=-

# Use in Cloud Run
gcloud run deploy pickcv-backend \
  --set-env-vars=ENVIRONMENT=production \
  --set-secrets=SECRET_KEY=SECRET_KEY:latest,DATABASE_URL=DATABASE_URL:latest
```

---

## 📊 Monitoring & Logging

### Google Cloud Logging

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=pickcv-backend" \
  --limit 50 \
  --format json

# Create log sink to BigQuery for analytics
gcloud logging sinks create bigquery-sink \
  bigquery.googleapis.com/projects/YOUR_PROJECT/datasets/logs \
  --log-filter='resource.type="cloud_run_revision"'
```

### Monitoring & Alerts

```bash
# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}

      - name: Run tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest

      - name: Build Docker image
        run: |
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/pickcv-backend

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy pickcv-backend \
            --image=gcr.io/${{ secrets.GCP_PROJECT_ID }}/pickcv-backend \
            --region=us-central1 \
            --set-env-vars=ENVIRONMENT=production
```

---

## 🛡️ Backup & Disaster Recovery

### Automated Backups

```bash
# Enable automated backups (Cloud SQL)
gcloud sql backups create \
  --instance=pickcv-db \
  --description="Daily backup"

# Schedule daily backups
gcloud sql instances patch pickcv-db \
  --backup-start-time=03:00 \
  --backup-location=us-central1 \
  --retained-backups-count=30 \
  --transaction-log-retention-days=7
```

### Manual Backup

```bash
# Export to Google Cloud Storage
gcloud sql export sql pickcv-db \
  gs://pickcv-backups/backup-$(date +%Y%m%d-%H%M%S).sql \
  --database=pickcv
```

---

## 📈 Performance Optimization

### Database Optimization

```python
# Create indexes
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_resume_user ON resumes(user_id);
CREATE INDEX idx_application_status ON job_applications(status);
```

### Caching Strategy

```python
# Use Redis for:
# - Session storage
# - Job recommendations cache
# - Rate limiting
# - Token blacklist

# Deploy Redis
gcloud memorystore instances create pickcv-cache \
  --size=2 \
  --region=us-central1
```

### Connection Pooling

```python
# Already configured in config.py
db_pool_size = 20
db_max_overflow = 10
db_pool_recycle = 3600
```

---

## 🐛 Troubleshooting

### High latency
- Check Cloud SQL connection pool
- Enable read replicas
- Implement Redis caching

### Memory issues
- Increase Cloud Run memory allocation
- Optimize database queries
- Implement pagination

### Database connection errors
- Verify network connectivity
- Check SSL certificates
- Review Cloud SQL proxy logs

---

## 📋 Pre-Launch Checklist

- [ ] Environment set to `production`
- [ ] `SECRET_KEY` generated and secure
- [ ] Database URL configured with managed PostgreSQL
- [ ] CORS origins set to production domain only
- [ ] HTTPS enabled
- [ ] SSL certificate configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Backups automated
- [ ] Monitoring alerts set up
- [ ] Error handling tested
- [ ] Security headers verified
- [ ] API docs hidden (`/docs` disabled)
- [ ] Load balancer configured
- [ ] Auto-scaling configured
- [ ] Health checks working
- [ ] Performance tested under load

---

**Status:** Ready for Production Deployment
