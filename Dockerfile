# SIMPLE SINGLE-STAGE BUILD - No complexity, just works
FROM node:22-alpine

WORKDIR /app

# Install minimal runtime dependencies
RUN apk add --no-cache \
    curl

# Copy pre-built output and content
COPY .output ./
COPY content ./content

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001 -G nodejs && \
    chown -R nuxt:nodejs /app

USER nuxt

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start application
CMD ["node", "server/index.mjs"]