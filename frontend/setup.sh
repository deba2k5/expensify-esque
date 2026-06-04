#!/bin/bash

# Sinhas Track - Setup Script

set -e

echo "🚀 Setting up Sinhas Track Backend..."

# Create backend directory if not exists
mkdir -p backend

# Copy env example to .env
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env (please update with your credentials)"
fi

# Install backend dependencies
echo "📦 Installing Python dependencies..."
cd backend

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10+"
    exit 1
fi

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate || . venv/Scripts/activate

# Install requirements
pip install -r requirements.txt
echo "✅ Backend dependencies installed"

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install
echo "✅ Frontend dependencies installed"

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your MongoDB URI and Google Drive Folder ID"
echo "2. Run: npm run dev        # Start frontend (port 5173)"
echo "3. Run: npm run dev:backend # Start backend (port 5000) in another terminal"
echo ""
echo "Or use Docker:"
echo "  docker-compose up"
echo ""
