# syntax=docker/dockerfile:1
ARG NODE_VERSION=20
ARG TARGETPLATFORM
ARG BUILDPLATFORM

# Build stage
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

# Install basic build dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with better error handling  
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:${NODE_VERSION}-alpine AS production

WORKDIR /app

# No additional runtime deps needed

# Copy only the built output
COPY --from=build --chown=1001:1001 /app/.output ./.output

# Copy content directory needed by API endpoints at runtime
COPY --from=build --chown=1001:1001 /app/content ./content

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Create non-root user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001 -G nodejs && \
    chown -R nuxt:nodejs /app

USER nuxt

EXPOSE 3000

# Health check with better error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const http = require('http'); const options = { hostname: 'localhost', port: 3000, path: '/api/healthcheck', timeout: 3000 }; const req = http.get(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.on('timeout', () => { req.destroy(); process.exit(1); });"

# Start the server
CMD ["node", ".output/server/index.mjs"]