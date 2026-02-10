# PickCV - AI-Powered Resume Optimization & Job Matching Platform

Transform your resume to beat ATS systems and land your dream job. Built with Next.js 16, FastAPI, PostgreSQL with pgvector, and powered by Google Gemini AI.

## 🚀 Features

- **ATS Optimization**: Transform resumes to meet 2026 ATS standards
- **AI-Powered Analysis**: Get detailed feedback on resume quality and compatibility
- **Job Matching**: Semantic search using pgvector for intelligent job matching
- **Skill Gap Analysis**: Identify missing skills and get learning recommendations
- **Before/After Comparison**: See the transformation in real-time
- **One-Click Apply**: Apply to jobs with your optimized resume

## 🏗️ Architecture

### Frontend
- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls

### Backend
- **FastAPI** (Python) for high-performance async API
- **PostgreSQL** with pgvector extension for semantic search
- **SQLAlchemy** (Async) for ORM
- **Pydantic V2** for data validation
- **Google Gemini 1.5 Flash** for AI operations
- **JWT** for authentication

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for local development
- Optimized for **Google Cloud Run** deployment

## 📁 Project Structure

```
/
├── backend/                 # FastAPI application
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── routes/             # API routes
│   ├── services/           # Business logic & AI services
│   ├── config.py           # Configuration
│   ├── database.py         # Database setup
│   ├── main.py             # Application entry point
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # Next.js application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities & API client
│   └── public/            # Static assets
│
├── docker-compose.yml     # Full stack deployment
├── docker-compose.dev.yml # Development database only
└── instructions.md        # Development guidelines
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+**
- **Python 3.11+**
- **Docker & Docker Compose**
- **Google Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/projectvidnova/pickcv.git
cd pickcv
```

2. **Set up environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and add your GEMINI_API_KEY
```

3. **Start all services**
```bash
docker-compose up -d
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database: localhost:5432

### Option 2: Local Development

#### 1. Start PostgreSQL with pgvector
```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run database migrations (create tables)
python -c "from database import engine, Base; from models import *; Base.metadata.create_all(bind=engine)"

# Start backend
uvicorn main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local

# Start development server
npm run dev
```

Frontend will be available at http://localhost:3000

## 🗄️ Database Setup

The application uses PostgreSQL with the pgvector extension for semantic search.

**Initialize tables:**
```bash
cd backend
python -c "from sqlalchemy import create_engine; from database import Base; from models import *; from config import settings; engine = create_engine(settings.database_url.replace('asyncpg', 'psycopg2')); Base.metadata.create_all(engine)"
```

## 🔑 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/pickcv
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
ENVIRONMENT=development
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/token` - Login and get JWT token
- `GET /api/auth/me` - Get current user

#### Resume
- `POST /api/resume/upload` - Upload resume file
- `GET /api/resume/` - List user's resumes
- `GET /api/resume/{id}` - Get resume details
- `POST /api/resume/{id}/optimize` - Optimize resume for ATS

#### Analysis
- `POST /api/analysis/resume/{id}` - Analyze resume for ATS compatibility
- `GET /api/analysis/skill-gap` - Get skill gap analysis

#### Jobs
- `GET /api/jobs/` - List jobs with match scores
- `GET /api/jobs/{id}` - Get job details
- `POST /api/jobs/{id}/apply` - Apply to job
- `GET /api/jobs/applications/` - List user's applications

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Google Cloud Run

1. **Build and push Docker images**
```bash
# Backend
gcloud builds submit --tag gcr.io/PROJECT_ID/pickcv-backend ./backend

# Frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/pickcv-frontend ./frontend
```

2. **Deploy services**
```bash
# Backend
gcloud run deploy pickcv-backend \
  --image gcr.io/PROJECT_ID/pickcv-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Frontend
gcloud run deploy pickcv-frontend \
  --image gcr.io/PROJECT_ID/pickcv-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🛠️ Development

### Code Standards
- **Python**: Type hints for all functions, async/await for I/O operations
- **TypeScript**: Strict mode enabled
- **API**: RESTful conventions, camelCase JSON responses
- **Formatting**: Use single-column layout for ATS compliance

### Adding New Features

1. **Backend**: Add route in `routes/`, service logic in `services/`
2. **Frontend**: Create component in `components/`, add page in `app/`
3. **Database**: Update models in `models/__init__.py`, create migration

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## 📧 Support

For issues and questions:
- GitHub Issues: https://github.com/projectvidnova/pickcv/issues
- Email: support@pickcv.com

## 🙏 Acknowledgments

- Powered by Google Gemini 1.5 Flash
- Built with Next.js, FastAPI, and PostgreSQL
- Icons by Lucide React

---

**PickCV** - Beat the ATS. Land the Job. 🚀
