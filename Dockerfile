# Build stage - use full node image for better build support
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files first
COPY Server/package*.json ./

# Install dependencies - slim image has more build tools than alpine
RUN npm install --legacy-peer-deps 2>/dev/null || npm install --prefer-offline --no-audit 2>/dev/null || npm install

# Final stage - use alpine for smaller size
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies and dumb-init
RUN apk add --no-cache dumb-init

# Copy node modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY Server .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000', (r) => {if (r.statusCode !== 404) throw new Error(r.statusCode)})" || exit 1

# Use dumb-init to run Node.js
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
