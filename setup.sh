#!/bin/bash

echo "🧭 WanderMind Setup Script"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo "Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python found: $(python3 --version)${NC}"

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Setup Backend
echo ""
echo "Setting up Backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 Created .env from .env.example${NC}"
    echo -e "${RED}⚠️  Please edit backend/.env and add your ANTHROPIC_API_KEY${NC}"
    echo ""
    read -p "Press enter after adding your API key..."
fi

cd ..
echo -e "${GREEN}✅ Backend setup complete${NC}"

# Setup Frontend
echo ""
echo "Setting up Frontend..."
cd frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    cp .env.local.example .env.local
fi

cd ..
echo -e "${GREEN}✅ Frontend setup complete${NC}"

# Final instructions
echo ""
echo "=========================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "To start WanderMind:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo -e "${YELLOW}⚠️  Make sure you have added your ANTHROPIC_API_KEY to backend/.env${NC}"
echo ""
