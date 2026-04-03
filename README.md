# PickCV - AI-Powered Resume Optimization Platform

Transform your resume with AI to match job requirements perfectly. Built with React 19, FastAPI, PostgreSQL, and powered by Google Gemini 1.5 Flash.

## 🌐 Live Application

- **Frontend:** https://studio-1324640898-76b00.web.app
- **Backend API:** https://pickcv-backend-318698650933.us-central1.run.app/api

## 🚀 Features

- ✅ **Google OAuth Authentication** - Secure sign-in with Google
- ✅ **Resume Upload** - Support for PDF, DOCX, DOC, and TXT formats
- ✅ **AI Resume Optimization** - Powered by Google Gemini 1.5 Flash
- ✅ **Three Job Input Modes:**
  - Paste job description directly
  - Paste job URL (auto-scrapes content)
  - Enter job title for optimization
- ✅ **Before/After Comparison** - See changes with detailed explanations
- ✅ **Template Selection** - Choose from multiple resume templates
- ✅ **Download Optimized Resume** - Get your enhanced resume instantly

## 🏗️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Firebase Hosting** for deployment

### Backend
- **FastAPI** (Python 3.11) for high-performance async API
- **PostgreSQL** database
- **Google Gemini 1.5 Flash** for AI resume optimization
- **BeautifulSoup4** for web scraping
- **Google Cloud Run** for serverless deployment

### Infrastructure
- **Google Cloud Run** - Serverless backend hosting
- **Firebase Hosting** - Static frontend hosting
- **Cloud SQL** - PostgreSQL database
- **Google OAuth** - Authentication


## 📁 Project Structure

```
/
├── backend/                # FastAPI application
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic & AI services
│   ├── config.py          # Configuration
│   ├── database.py        # Database setup
│   ├── main.py            # Application entry point
│   └── requirements.txt   # Python dependencies
│
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── utils/        # Utilities
│   └── out/              # Build output
│
├── docs/                  # Documentation
│   ├── DEPLOYMENT_FINAL.md         # Deployment guide
│   ├── AUTH_SYSTEM_REVIEW.md       # Authentication docs
│   ├── BACKEND_ARCHITECTURE.md     # Backend structure
│   ├── RESUME_OPTIMIZATION_FEATURE.md # Feature docs
│   └── TROUBLESHOOTING.md          # Common issues
│
├── firebase.json          # Firebase hosting config
├── .firebaserc           # Firebase project config
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+**
- **Python 3.11+**
- **Google Gemini API Key** ([Get it here](https://aistudio.google.com/app/apikey))

### Local Development

#### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and DATABASE_URL

# Start backend
uvicorn main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and set VITE_API_URL=http://localhost:8000/api

# Start development server
npm run dev
```

Frontend will be available at http://localhost:3000

## 🚀 Deployment

### Backend (Cloud Run)
```bash
cd backend
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest .
docker push us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest
gcloud run deploy pickcv-backend --image us-central1-docker.pkg.dev/pickcv-prod-001/pickcv-repo/pickcv-backend:latest --region us-central1 --project pickcv-prod-001 --allow-unauthenticated
```

### Frontend (Firebase)
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

See [docs/DEPLOYMENT_FINAL.md](docs/DEPLOYMENT_FINAL.md) for detailed deployment instructions.

## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT_FINAL.md) - Complete deployment instructions
- [Backend Architecture](docs/BACKEND_ARCHITECTURE.md) - Backend design and structure

## 🔑 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://postgres:password@host:5432/pickcv
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SECRET_KEY=your-secret-key-change-this-in-production
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs

### Key Endpoints

#### Authentication
- `GET /api/auth/google/login` - Initiate Google OAuth
- `GET /api/auth/google/token` - Exchange code for JWT
- `GET /api/auth/me` - Get current user

#### Resume
- `POST /api/resume/upload` - Upload resume file
- `GET /api/resume/` - List user's resumes
- `POST /api/resume/optimize` - Optimize resume with AI

## 🤝 Contributing

Contributions are welcome! Please read the documentation in the `/docs` folder for more details.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using React, FastAPI, and Google Gemini AI**


## 🙏 Acknowledgments

- Powered by thinking LLM's
- Built with Next.js, FastAPI, and PostgreSQL
- Icons by Lucide React

---

**PickCV** - Beat the ATS. Land the Job. 🚀
