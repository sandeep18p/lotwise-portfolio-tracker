@echo off
REM Lotwise Portfolio Tracker Setup Script for Windows

echo 🚀 Setting up Lotwise Portfolio Tracker...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Create environment files if they don't exist
echo 📝 Creating environment files...

if not exist backend\.env (
    copy backend\env.example backend\.env
    echo ✅ Created backend\.env
) else (
    echo ⚠️  backend\.env already exists
)

if not exist worker\.env (
    copy worker\env.example worker\.env
    echo ✅ Created worker\.env
) else (
    echo ⚠️  worker\.env already exists
)

if not exist frontend\.env.local (
    copy frontend\env.example frontend\.env.local
    echo ✅ Created frontend\.env.local
) else (
    echo ⚠️  frontend\.env.local already exists
)

REM Start services with Docker Compose
echo 🐳 Starting services with Docker Compose...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Run database migrations
echo 🗄️  Running database migrations...
docker-compose exec backend npm run migrate up

REM Seed demo data
echo 🌱 Seeding demo data...
docker-compose exec backend npm run seed

echo.
echo 🎉 Setup complete!
echo.
echo 📱 Access your application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:3001
echo    Health Check: http://localhost:3001/health
echo.
echo 📊 Test the demo scenario:
echo    1. Go to http://localhost:3000
echo    2. Add trades: Buy 100 AAPL @ $150, Buy 50 AAPL @ $160, Sell 80 AAPL @ $170
echo    3. Check positions and P&L pages
echo.
echo 🛑 To stop services: docker-compose down
echo 📋 To view logs: docker-compose logs -f [service-name]
pause
