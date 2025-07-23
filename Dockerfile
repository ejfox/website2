# syntax=docker/dockerfile:1
ARG NODE_VERSION=20.9

# Build stage - force x86-64 for oxc-parser compatibility
FROM --platform=linux/amd64 node:${NODE_VERSION}-slim AS build

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with clean slate for native modules
RUN rm -f package-lock.json && \
    npm cache clean --force && \
    npm install --no-optional || npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - force x86-64 for compatibility
FROM --platform=linux/amd64 node:${NODE_VERSION}-slim AS production

WORKDIR /app

# Install runtime dependencies for native modules
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Copy only the built output
COPY --from=build --chown=1001:1001 /app/.output ./.output

# Copy content directory needed by API endpoints at runtime
COPY --from=build --chown=1001:1001 /app/content ./content

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Create non-root user and set permissions
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh -m nuxt && \
    chown -R nuxt:nodejs /app

USER nuxt

EXPOSE 3000

# Health check with better error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const http = require('http'); const options = { hostname: 'localhost', port: 3000, path: '/api/healthcheck', timeout: 3000 }; const req = http.get(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.on('timeout', () => { req.destroy(); process.exit(1); });"

# Start the server
CMD ["node", ".output/server/index.mjs"]