# Stage 1: Build
FROM node:20-alpine AS builder

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

# Debug: Verify nest CLI is installed
RUN echo "🔍 Checking NestJS CLI:" && \
    npx nest --version || echo "⚠️ nest CLI not found, will use tsc directly" && \
    echo "📁 Contents before build:" && ls -la && \
    echo "📁 Source files:" && ls -la src/ | head -20 && \
    echo "📄 Checking nest-cli.json:" && (cat nest-cli.json || echo "⚠️ nest-cli.json not found")

# Build application (with verbose output and error handling)
RUN echo "🔨 Starting build..." && \
    (npm run build 2>&1 | tee /tmp/build.log || \
     (echo "⚠️ npm run build failed, trying tsc directly..." && \
      npx tsc && \
      echo "✅ tsc build completed")) && \
    echo "✅ Build command completed" && \
    echo "📁 Contents after build:" && ls -la && \
    echo "📁 Dist folder contents:" && (ls -la dist/ || echo "❌ dist/ folder does not exist!") && \
    echo "📄 Build log:" && cat /tmp/build.log 2>/dev/null || echo "No build log"

# Verify build output exists with detailed error
RUN if [ ! -f dist/main.js ]; then \
        echo "❌ ERROR: dist/main.js not found after build!" && \
        echo "📁 Current directory contents:" && ls -la && \
        echo "📁 Dist folder (if exists):" && (ls -la dist/ || echo "dist/ folder does not exist!") && \
        echo "📁 Source files:" && ls -la src/ | head -10 && \
        exit 1; \
    else \
        echo "✅ dist/main.js found!" && \
        ls -lh dist/main.js && \
        echo "📦 Build artifacts:" && find dist -type f | head -20; \
    fi

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma schema (needed for migrations)
COPY --from=builder /app/prisma ./prisma

# Generate Prisma Client (needed at runtime)
RUN npm run prisma:generate

# Verify dist exists in final image
RUN echo "🔍 Verifying dist in final image:" && \
    ls -la && \
    ls -la dist/ && \
    test -f dist/main.js && echo "✅ dist/main.js exists!" || \
    (echo "❌ ERROR: dist/main.js not found in final image!" && exit 1)

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["sh", "-c", "npm run prisma:deploy && npm run start:prod"]

