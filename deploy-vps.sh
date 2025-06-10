#!/bin/bash

# VPS Deployment Script for website2
# This script handles common deployment issues on Debian/Ubuntu VPS

set -e  # Exit on any error

echo "🚀 Starting VPS deployment for website2..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and back in, then re-run this script."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed."
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo "⚠️  Please edit .env with your actual values before continuing."
        echo "   Required variables: SUPABASE_URL, SUPABASE_KEY, and API tokens"
        read -p "Press enter when you've configured .env file..."
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Stop existing container if running
if docker ps -q -f name=website2-prod; then
    echo "🛑 Stopping existing container..."
    docker-compose down
fi

# Clean up old images to save space
echo "🧹 Cleaning up old Docker images..."
docker system prune -f

# Set buildkit for better builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build with platform specification for VPS compatibility
echo "🔨 Building Docker image for linux/amd64..."
docker build --platform linux/amd64 -t website2:latest .

# Start the application
echo "🚀 Starting website2..."
docker-compose up -d

# Wait for health check
echo "⏳ Waiting for application to start..."
sleep 10

# Check if the application is running
if curl -f http://localhost:3006/api/healthcheck > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo "🌐 Access your site at: http://your-server-ip:3006"
    echo "🔍 Health check: http://your-server-ip:3006/api/healthcheck"
else
    echo "❌ Application failed to start. Checking logs..."
    docker-compose logs website2
    exit 1
fi

# Show useful commands
echo ""
echo "📝 Useful commands:"
echo "  View logs: docker-compose logs -f website2"
echo "  Restart: docker-compose restart website2"
echo "  Stop: docker-compose down"
echo "  Update: git pull && ./deploy-vps.sh"