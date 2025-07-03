# Website2 Production Deployment Guide

## Initial VPS Setup

1. **Clone the repository on your VPS:**
   ```bash
   git clone https://github.com/ejfox/website2.git
   cd website2
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   nano .env
   ```

3. **Ensure Docker and Docker Compose are installed:**
   ```bash
   # Check if installed
   docker --version
   docker-compose --version
   
   # If not installed, install them
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   sudo apt install docker-compose-plugin
   ```

## Production Deployment

### First Time Deployment

```bash
# Build and start the container
docker-compose up -d --build

# Check if it's running
docker-compose ps

# Check logs
docker-compose logs -f website2
```

### Updating After Code Changes

Use the provided deployment script:

```bash
# Make sure you're in the website2 directory
./deploy-update.sh
```

Or manually:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Verify health
curl http://localhost:3000/api/healthcheck
```

## Environment Variables

Required environment variables (see `.env.example`):

- `NODE_ENV=production`
- `GITHUB_TOKEN` - For GitHub API stats
- `LASTFM_API_KEY` - For Last.fm music stats
- `RESCUETIME_TOKEN` - For RescueTime productivity stats
- API keys for other services as needed

## Port Configuration

The container runs on port 3000 internally and maps to port 3006 externally.

If you're using nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Health Monitoring

The container includes health checks:

```bash
# Check container health
docker-compose ps

# Test health endpoint directly
curl http://localhost:3006/api/healthcheck

# View health check logs
docker inspect website2-prod | grep -A 10 "Health"
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs website2

# Check system resources
docker stats website2-prod

# Rebuild without cache
docker-compose build --no-cache
```

### Health check failing
```bash
# Test manifest API (critical dependency)
curl http://localhost:3006/api/manifest

# Check if all required files are present
docker-compose exec website2 ls -la /app
```

### Memory issues
The container is limited to 1GB RAM. Monitor usage:
```bash
docker stats website2-prod
```

## Backup Strategy

Important files to backup:
- `.env` file (contains API keys)
- `content/` directory (blog posts)
- Any custom configuration

## Security Notes

- Container runs as non-root user (nuxt:1001)
- Read-only filesystem where possible
- No new privileges allowed
- Memory and CPU limits enforced
- Health checks monitor application state

## Performance Optimization

The build includes:
- Multi-stage Docker build for smaller images
- Compressed assets
- Proper caching headers
- Image optimization with @nuxt/image
- Canvas dependencies for OG image generation

## Monitoring

Key metrics to monitor:
- Container health status
- Memory usage (should stay under 1GB)
- CPU usage
- Response times for `/api/healthcheck`
- Disk usage for logs