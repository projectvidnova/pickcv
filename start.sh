#!/bin/bash

# PickCV Quick Start Script

echo "🚀 PickCV - Starting the application..."
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
    echo "⚠️  Please edit backend/.env and add your GEMINI_API_KEY before continuing."
    echo ""
    read -p "Press Enter after you've added your API key..."
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

echo ""
echo "✅ PickCV is starting up!"
echo ""
echo "📍 Services will be available at:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "⏳ Waiting for services to be ready (this may take a minute)..."
sleep 10

echo ""
echo "🎉 All done! Visit http://localhost:3000 to get started."
echo ""
echo "💡 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
