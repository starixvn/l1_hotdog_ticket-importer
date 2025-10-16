# Multi-stage build for production optimization
FROM hub.lumigame.com/base/node:22-alpine-25h2 AS builder

# Set working directory
WORKDIR /app

# Copy package files and config files
COPY package*.json nest-cli.json tsconfig*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --silent && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Clean up dev dependencies and reinstall only production dependencies
RUN rm -rf node_modules && npm ci --only=production --silent && npm cache clean --force

# Production stage
FROM hub.lumigame.com/base/node:22-alpine-25h2 AS production


# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and configuration files
COPY package*.json config.json ./

# Copy production files from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --chown=nestjs:nodejs --from=builder /app/src/config/currency-mapping.json ./src/config/

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/main.js"]
