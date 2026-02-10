@echo off
REM PickCV Quick Start Script for Windows

echo 🚀 PickCV - Starting the application...
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo ⚠️  No .env file found. Creating from .env.example...
    copy backend\.env.example backend\.env
    echo ✅ Created backend\.env
    echo ⚠️  Please edit backend\.env and add your GEMINI_API_KEY before continuing.
    echo.
    pause
)

REM Check for Docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo 🐳 Starting services with Docker Compose...
docker-compose up -d

echo.
echo ✅ PickCV is starting up!
echo.
echo 📍 Services will be available at:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo.
echo ⏳ Waiting for services to be ready (this may take a minute)...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 All done! Visit http://localhost:3000 to get started.
echo.
echo 💡 Useful commands:
echo    View logs:     docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart:       docker-compose restart
echo.
pause
