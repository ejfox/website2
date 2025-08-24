#!/bin/bash

# VPS Deployment Script for website2
# This script builds locally and deploys to VPS with a fresh build every time

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting FULL FRESH deployment for website2...${NC}"
echo ""

# Step 1: Git operations
echo -e "${YELLOW}📥 Step 1: Pulling latest changes from git...${NC}"
git pull origin main || {
    echo -e "${RED}❌ Failed to pull from git. Check your connection.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Git updated${NC}"
echo ""

# Step 1.5: Push any local commits
echo -e "${YELLOW}📤 Step 1.5: Pushing any local commits...${NC}"
git push origin main 2>/dev/null || echo -e "${YELLOW}⚠️  Nothing to push or no remote access${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Step 2: Installing dependencies...${NC}"
yarn install || {
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
}
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Clean all build artifacts for FRESH build
echo -e "${YELLOW}🗑️  Step 3: Wiping build cache for FRESH deployment...${NC}"
rm -rf .output .nuxt node_modules/.cache dist
echo -e "${GREEN}✅ Build cache wiped clean${NC}"
echo ""

# Step 4: Build Nuxt locally FRESH
echo -e "${YELLOW}🔨 Step 4: Building Nuxt application from scratch...${NC}"
yarn build || {
    echo -e "${RED}❌ Build failed. Check for TypeScript or build errors.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Fresh Nuxt build completed${NC}"
echo ""

# Step 5: Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Installing...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker installed. Please log out and back in, then re-run this script.${NC}"
    exit 1
fi

# Step 6: Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}❌ Docker Compose is not installed. Installing...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed.${NC}"
fi

# Step 7: Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env with your actual values before continuing.${NC}"
        echo "   Required variables: GITHUB_TOKEN, CHESS_USERNAME, RESCUETIME_TOKEN, etc."
        read -p "Press enter when you've configured .env file..."
    else
        echo -e "${RED}❌ .env.example not found. Please create .env manually.${NC}"
        exit 1
    fi
fi

# Step 8: Stop existing containers
echo -e "${YELLOW}🛑 Step 8: Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true
docker rm -f website2-prod 2>/dev/null || true
echo -e "${GREEN}✅ Old containers stopped${NC}"
echo ""

# Step 9: Clean up Docker to ensure fresh build
echo -e "${YELLOW}🧹 Step 9: Cleaning Docker cache for fresh build...${NC}"
docker system prune -f
# Remove the specific image to force rebuild
docker rmi website2:latest 2>/dev/null || true
echo -e "${GREEN}✅ Docker cache cleaned${NC}"
echo ""

# Step 10: Set buildkit for better builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Step 11: Build Docker image with the fresh .output
echo -e "${YELLOW}🐳 Step 11: Building Docker image with fresh output...${NC}"
docker build --no-cache --platform linux/amd64 -t website2:latest . || {
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Docker image built${NC}"
echo ""

# Step 12: Start the application
echo -e "${YELLOW}🚀 Step 12: Starting website2 container...${NC}"
docker-compose up -d || {
    echo -e "${RED}❌ Failed to start container${NC}"
    docker-compose logs --tail=50
    exit 1
}
echo -e "${GREEN}✅ Container started${NC}"
echo ""

# Step 13: Health check with nice progress bar
echo -e "${YELLOW}⏳ Step 13: Waiting for application to be healthy...${NC}"
sleep 5  # Initial wait for container to start

MAX_ATTEMPTS=24  # 2 minutes total
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    # Show progress
    printf "\r⏳ Health check attempt %d/%d" "$ATTEMPT" "$MAX_ATTEMPTS"
    
    if curl -f -s http://localhost:3006/ > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✅ Application is running successfully!${NC}"
        echo ""
        break
    else
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo ""
            echo -e "${RED}❌ Application failed to start after 2 minutes.${NC}"
            echo ""
            echo "📋 Container logs:"
            docker-compose logs --tail=100 website2
            echo ""
            echo "🔧 Container status:"
            docker-compose ps
            exit 1
        fi
        ATTEMPT=$((ATTEMPT + 1))
        sleep 5
    fi
done

# Step 14: Final status report
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}🌐 Your site is now live at:${NC}"
echo "   Local: http://localhost:3006"
echo "   External: http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip'):3006"
echo ""

# Show container status
echo -e "${BLUE}📊 Container Status:${NC}"
docker-compose ps

# Show memory usage
echo ""
echo -e "${BLUE}💾 Resource Usage:${NC}"
docker stats website2-prod --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "Unable to get stats"

# Show recent logs
echo ""
echo -e "${BLUE}📝 Recent logs (last 10 lines):${NC}"
docker-compose logs --tail=10 website2

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📚 Useful Commands:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo "  📋 View logs:        docker-compose logs -f website2"
echo "  🔄 Restart:          docker-compose restart website2"
echo "  🛑 Stop:             docker-compose down"
echo "  📊 Check status:     docker-compose ps"
echo "  🔍 Check health:     curl http://localhost:3006/api/healthcheck"
echo "  🚀 Deploy again:     ./deploy-vps.sh"
echo ""
echo -e "${GREEN}✨ Deployment complete! Your site has been fully refreshed.${NC}"