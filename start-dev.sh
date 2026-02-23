#!/bin/bash
# Quick Start Script for PickCV Development

echo "🚀 PickCV Quick Start"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker container is running
echo "Checking PostgreSQL..."
if docker ps | grep -q pickcv-db-dev; then
    echo -e "${GREEN}✓${NC} PostgreSQL running"
else
    echo -e "${YELLOW}⚠${NC}  PostgreSQL not running, starting..."
    cd /Users/adithyasaladi/Downloads/pickcv-vscode-ready
    docker-compose -f docker-compose.dev.yml up -d
    sleep 3
fi

# Check backend setup
echo ""
echo "Backend Setup:"
BACKEND_PATH="/Users/adithyasaladi/Downloads/pickcv-vscode-ready/backend"

if [ ! -d "$BACKEND_PATH/venv" ]; then
    echo -e "${YELLOW}⚠${NC}  Creating virtual environment..."
    cd "$BACKEND_PATH"
    python3 -m venv venv
    $BACKEND_PATH/venv/bin/pip install -q -r requirements.txt
fi
echo -e "${GREEN}✓${NC} Backend ready"

# Check frontend setup
echo ""
echo "Frontend Setup:"
FRONTEND_PATH="/Users/adithyasaladi/Downloads/pickcv-vscode-ready/frontend"

if [ ! -d "$FRONTEND_PATH/node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}  Installing npm packages..."
    cd "$FRONTEND_PATH"
    npm install -q
fi
echo -e "${GREEN}✓${NC} Frontend ready"

# Test database connection
echo ""
echo "Testing Database Connection..."
if PGPASSWORD=postgres psql -h localhost -U postgres -d pickcv -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Database connected"
else
    echo -e "${RED}✗${NC} Database connection failed"
    exit 1
fi

# Test backend imports
echo ""
echo "Testing Backend Imports..."
if $BACKEND_PATH/venv/bin/python -c "from main import app; from models import User; from config import settings" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Backend imports working"
else
    echo -e "${RED}✗${NC} Backend import error"
    exit 1
fi

echo ""
echo -e "${GREEN}===================="
echo "All Systems Ready! ✓${NC}"
echo ""
echo "To start development:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd /Users/adithyasaladi/Downloads/pickcv-vscode-ready/backend"
echo "  ./venv/bin/python main.py"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd /Users/adithyasaladi/Downloads/pickcv-vscode-ready/frontend"
echo "  npm run dev"
echo ""
echo "Then visit:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000/docs"
echo "  Database: localhost:5432 (postgres/postgres)"
echo ""
