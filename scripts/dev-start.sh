#!/bin/bash

# AI Multilingual Blog - Development Startup Script
# Senior Full-Stack Developer Setup

set -e

echo "🚀 Starting AI Multilingual Blog Full-Stack Application"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Warning: Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - $service_name not ready yet...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-flight checks...${NC}"

# Check required ports
echo "Checking required ports..."
check_port 3000 || echo -e "${YELLOW}Frontend port 3000 in use - will try to use next available${NC}"
check_port 3001 || echo -e "${YELLOW}Backend port 3001 in use - will try to use next available${NC}"
check_port 7700 || echo -e "${YELLOW}MeiliSearch port 7700 in use - will try to use next available${NC}"
check_port 27017 || echo -e "${YELLOW}MongoDB port 27017 in use - will try to use next available${NC}"
check_port 6379 || echo -e "${YELLOW}Redis port 6379 in use - will try to use next available${NC}"

echo -e "${BLUE}🐳 Step 1: Starting Infrastructure Services${NC}"

# Start MeiliSearch
echo "Starting MeiliSearch..."
if [ -f "docker/meilisearch.yml" ]; then
    docker-compose -f docker/meilisearch.yml up -d
    wait_for_service "http://localhost:7700/health" "MeiliSearch"
else
    echo -e "${YELLOW}⚠️  MeiliSearch config not found, starting with Docker run...${NC}"
    docker run -d --name ai-blog-meilisearch \
        -p 7700:7700 \
        -e MEILI_ENV=development \
        -e MEILI_MASTER_KEY=your-master-key-here \
        -e MEILI_NO_ANALYTICS=true \
        getmeili/meilisearch:v1.5 || echo -e "${YELLOW}MeiliSearch container may already exist${NC}"
    wait_for_service "http://localhost:7700/health" "MeiliSearch"
fi

# Start MongoDB (if not running)
echo "Checking MongoDB..."
if ! docker ps | grep -q mongodb; then
    echo "Starting MongoDB..."
    docker run -d --name ai-blog-mongodb \
        -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=admin \
        -e MONGO_INITDB_ROOT_PASSWORD=password \
        -v mongodb_data:/data/db \
        mongo:7.0 || echo -e "${YELLOW}MongoDB container may already exist${NC}"
    sleep 5
fi

# Start Redis (if not running)
echo "Checking Redis..."
if ! docker ps | grep -q redis; then
    echo "Starting Redis..."
    docker run -d --name ai-blog-redis \
        -p 6379:6379 \
        redis:7.2-alpine || echo -e "${YELLOW}Redis container may already exist${NC}"
    sleep 3
fi

echo -e "${BLUE}🔧 Step 2: Installing Dependencies${NC}"

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ -f "package.json" ]; then
    npm install
else
    echo -e "${YELLOW}⚠️  Backend package.json not found, checking src directory...${NC}"
    if [ -f "src/package.json" ]; then
        cd src
        npm install
        cd ..
    fi
fi
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo -e "${BLUE}⚙️  Step 3: Environment Configuration${NC}"

# Create backend .env if it doesn't exist
if [ ! -f "backend/.env" ] && [ ! -f "backend/src/.env" ]; then
    echo "Creating backend environment file..."
    cat > backend/.env << EOF
# Database
MONGODB_URL=mongodb://admin:password@localhost:27017/ai-blog?authSource=admin

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30

# MeiliSearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your-master-key-here

# OpenAI (for AI features)
OPENAI_API_KEY=your-openai-api-key-here

# Email (optional for development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
EMAIL_FROM=noreply@ai-blog.com

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Environment
NODE_ENV=development
PORT=3001

# CORS
CORS_ORIGIN=http://localhost:3000
EOF
fi

# Create frontend .env.local if it doesn't exist
if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend environment file..."
    cat > frontend/.env.local << EOF
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DOMAIN=localhost:3000

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Verification tokens (optional for development)
GOOGLE_VERIFICATION=
BING_VERIFICATION=
YANDEX_VERIFICATION=

# Environment
NODE_ENV=development
EOF
fi

echo -e "${BLUE}🚀 Step 4: Starting Application Services${NC}"

# Start backend
echo "Starting backend server..."
cd backend
if [ -f "src/index.js" ]; then
    cd src
fi

# Start backend in background
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
cd ..

# Wait for backend to be ready
wait_for_service "http://localhost:3001/v1/docs" "Backend API"

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
cd ..

# Wait for frontend to be ready
wait_for_service "http://localhost:3000" "Frontend"

echo -e "${GREEN}🎉 SUCCESS! Full-Stack Application is Running${NC}"
echo "=================================================="
echo -e "${GREEN}✅ Frontend:${NC}     http://localhost:3000"
echo -e "${GREEN}✅ Backend API:${NC}   http://localhost:3001"
echo -e "${GREEN}✅ API Docs:${NC}      http://localhost:3001/v1/docs"
echo -e "${GREEN}✅ MeiliSearch:${NC}   http://localhost:7700"
echo -e "${GREEN}✅ MongoDB:${NC}       mongodb://admin:password@localhost:27017"
echo -e "${GREEN}✅ Redis:${NC}         redis://localhost:6379"
echo ""
echo -e "${BLUE}📋 Development Features Available:${NC}"
echo "• 🔍 Search Engine: MeiliSearch with full-text search"
echo "• ⌨️  Command Palette: Press Ctrl+/ (or Cmd+/) for k-bar"
echo "• 🌍 Multi-language: EN, FR, ES, DE, AR with RTL support"
echo "• 🎨 Theme Toggle: Dark/Light mode"
echo "• 📱 Responsive Design: Mobile-first approach"
echo "• 🔐 Authentication: JWT with role-based access"
echo "• 💳 Payments: Stripe integration ready"
echo "• 📊 Analytics: Real-time tracking"
echo "• 🤖 AI Features: OpenAI integration for content"
echo ""
echo -e "${BLUE}📝 Process IDs (for stopping services):${NC}"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "• Use 'npm run dev' in respective directories for individual services"
echo "• Check logs: 'tail -f backend.log' or 'tail -f frontend.log'"
echo "• Stop services: 'kill $BACKEND_PID $FRONTEND_PID'"
echo "• Stop Docker: 'docker-compose -f docker/meilisearch.yml down'"
echo ""
echo -e "${GREEN}🚀 Ready for development! Open http://localhost:3000 to see your app live!${NC}"

# Keep script running and show logs
echo -e "${BLUE}📊 Live Logs (Ctrl+C to stop):${NC}"
echo "=================================================="

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    docker-compose -f docker/meilisearch.yml down 2>/dev/null || true
    docker stop ai-blog-mongodb ai-blog-redis 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

trap cleanup INT TERM

# Show live logs
tail -f backend.log frontend.log 2>/dev/null || sleep infinity
EOF
