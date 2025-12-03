FROM node:20-alpine

WORKDIR /app

# Copy package files from backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy backend source code
COPY backend/ .

# Generate Prisma Client
RUN npm run prisma:generate

# Build application (with verbose output)
RUN echo "🔨 Starting build..." && \
    npm run build && \
    echo "✅ Build completed successfully" || \
    (echo "❌ Build failed!" && exit 1)

# Verify build output exists
RUN test -f dist/main.js || (echo "❌ ERROR: dist/main.js not found after build!" && ls -la dist/ 2>/dev/null || echo "dist/ folder does not exist!" && exit 1)

# Remove devDependencies after build to reduce image size
# Note: npm prune only removes node_modules, not dist folder
RUN npm prune --production && npm cache clean --force

# Verify dist still exists after prune
RUN test -f dist/main.js || (echo "❌ ERROR: dist/main.js was removed!" && exit 1)

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["sh", "-c", "npm run prisma:deploy && npm run start:prod"]

