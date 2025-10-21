#!/bin/bash

# Lotwise Portfolio Tracker Setup Script

echo "🚀 Setting up Lotwise Portfolio Tracker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create environment files if they don't exist
echo "📝 Creating environment files..."

if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "⚠️  backend/.env already exists"
fi

if [ ! -f worker/.env ]; then
    cp worker/env.example worker/.env
    echo "✅ Created worker/.env"
else
    echo "⚠️  worker/.env already exists"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/env.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
else
    echo "⚠️  frontend/.env.local already exists"
fi

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend npm run migrate up

# Seed demo data
echo "🌱 Seeding demo data..."
docker-compose exec backend npm run seed

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📱 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Health Check: http://localhost:3001/health"
echo ""
echo "📊 Test the demo scenario:"
echo "   1. Go to http://localhost:3000"
echo "   2. Add trades: Buy 100 AAPL @ $150, Buy 50 AAPL @ $160, Sell 80 AAPL @ $170"
echo "   3. Check positions and P&L pages"
echo ""
echo "🛑 To stop services: docker-compose down"
echo "📋 To view logs: docker-compose logs -f [service-name]"
