# Stage 1: Build
FROM node:20-slim AS builder

# Install OpenSSL for Prisma (Debian-based images have better Prisma compatibility)
RUN apt-get update && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

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
    echo "📦 npm version:" && npm --version && \
    echo "📦 node version:" && node --version && \
    echo "📦 Checking if @nestjs/cli is installed:" && \
    (npm list @nestjs/cli || echo "⚠️ @nestjs/cli not found in node_modules") && \
    echo "🔨 Running npm run build..." && \
    npm run build 2>&1 | tee /tmp/build.log && \
    BUILD_EXIT_CODE=${PIPESTATUS[0]} && \
    if [ $BUILD_EXIT_CODE -ne 0 ]; then \
        echo "⚠️ npm run build failed with exit code $BUILD_EXIT_CODE" && \
        echo "📄 Build log:" && cat /tmp/build.log && \
        echo "⚠️ Trying tsc directly..." && \
        npx tsc 2>&1 | tee /tmp/tsc.log && \
        TSC_EXIT_CODE=${PIPESTATUS[0]} && \
        if [ $TSC_EXIT_CODE -ne 0 ]; then \
            echo "❌ tsc also failed with exit code $TSC_EXIT_CODE" && \
            echo "📄 TSC log:" && cat /tmp/tsc.log && \
            exit 1; \
        else \
            echo "✅ tsc build completed"; \
        fi; \
    else \
        echo "✅ npm run build completed successfully"; \
    fi && \
    echo "📁 Contents after build:" && ls -la && \
    echo "📁 Dist folder contents:" && (ls -la dist/ || echo "❌ dist/ folder does not exist!") && \
    echo "📄 Final build log:" && cat /tmp/build.log 2>/dev/null || echo "No build log"

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
FROM node:20-slim

# Install OpenSSL for Prisma (Debian-based images have better Prisma compatibility)
RUN apt-get update && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

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

# Verify dist exists in final image with detailed output
RUN echo "🔍 Verifying dist in final image:" && \
    echo "📁 Current directory:" && pwd && \
    echo "📁 Contents:" && ls -la && \
    echo "📁 Dist folder:" && (ls -la dist/ 2>/dev/null || echo "❌ dist/ folder does not exist!") && \
    if [ -f dist/main.js ]; then \
        echo "✅ dist/main.js exists!" && \
        ls -lh dist/main.js && \
        echo "📄 First few lines of dist/main.js:" && \
        head -5 dist/main.js; \
    else \
        echo "❌ ERROR: dist/main.js not found in final image!" && \
        echo "📁 Full directory tree:" && \
        find . -type f -name "*.js" | head -20 && \
        exit 1; \
    fi

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Debug: Show what's in the container before starting
RUN echo "🔍 Final verification before CMD:" && \
    echo "📁 Working directory:" && pwd && \
    echo "📁 Contents:" && ls -la && \
    echo "📁 Dist folder:" && (ls -la dist/ 2>/dev/null || echo "❌ dist/ folder does not exist!") && \
    echo "📁 Package.json:" && cat package.json | grep -A 5 scripts && \
    if [ -f dist/main.js ]; then \
        echo "✅ dist/main.js exists - ready to start!" && \
        ls -lh dist/main.js; \
    else \
        echo "❌ CRITICAL: dist/main.js not found!" && \
        echo "📁 Searching for any .js files:" && \
        find . -name "*.js" -type f 2>/dev/null | head -20 && \
        exit 1; \
    fi

# Start application with debug output
CMD ["sh", "-c", "echo '🚀 Starting application...' && echo '📁 Current directory:' && pwd && echo '📁 Contents:' && ls -la && echo '📁 Dist folder:' && (ls -la dist/ 2>/dev/null || echo '❌ dist/ folder does not exist!') && if [ ! -f dist/main.js ]; then echo '❌ ERROR: dist/main.js not found in container!' && exit 1; fi && echo '✅ dist/main.js found, running migrations...' && npm run prisma:deploy && echo '✅ Migrations completed, starting app...' && npm run start:prod"]

