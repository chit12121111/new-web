FROM node:20-slim

# Install OpenSSL for Prisma (Debian-based images have better Prisma compatibility)
RUN apt-get update && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Build application with verification
RUN echo "🔨 Starting build..." && \
    npm run build && \
    echo "✅ Build completed" && \
    echo "📁 Contents after build:" && ls -la && \
    echo "📁 Dist folder:" && (ls -la dist/ || echo "❌ dist/ folder does not exist!") && \
    echo "📁 Dist/src folder:" && (ls -la dist/src/ || echo "❌ dist/src/ folder does not exist!") && \
    if [ ! -f dist/src/main.js ]; then \
        echo "❌ ERROR: dist/src/main.js not found after build!" && \
        echo "📁 Searching for main.js:" && \
        find dist -name "main.js" -type f 2>/dev/null && \
        echo "📁 Searching for .js files:" && \
        find dist -name "*.js" -type f 2>/dev/null | head -20 && \
        exit 1; \
    else \
        echo "✅ dist/src/main.js found!" && \
        ls -lh dist/src/main.js; \
    fi

# Remove devDependencies after build to reduce image size
RUN npm prune --production && npm cache clean --force

# Verify dist still exists after prune
RUN if [ ! -f dist/src/main.js ]; then \
        echo "❌ ERROR: dist/src/main.js was removed after prune!" && \
        exit 1; \
    else \
        echo "✅ dist/src/main.js still exists after prune"; \
    fi

# Expose port
EXPOSE 4000

# Health check - เพิ่ม start-period และ retries
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with debug output and error handling
CMD ["sh", "-c", "echo '🚀 Starting application...' && echo '📁 Current directory:' && pwd && echo '📁 Contents:' && ls -la && echo '📁 Dist folder:' && (ls -la dist/ 2>/dev/null || echo '❌ dist/ folder does not exist!') && echo '📁 Dist/src folder:' && (ls -la dist/src/ 2>/dev/null || echo '❌ dist/src/ folder does not exist!') && if [ ! -f dist/src/main.js ]; then echo '❌ ERROR: dist/src/main.js not found in container!' && find dist -name 'main.js' 2>/dev/null && exit 1; fi && echo '✅ dist/src/main.js found' && echo '🔍 Environment variables:' && echo 'PORT='${PORT:-4000} && echo 'DATABASE_URL='${DATABASE_URL:+SET} && echo '📊 Step 1: Running migrations...' && if npm run prisma:deploy 2>&1; then echo '✅ Migrations applied successfully'; else echo '⚠️ Step 2: Migration failed, attempting to resolve...' && npx prisma migrate resolve --applied 20251203081739_add_huggingface_api_key 2>&1 || echo '⚠️ Could not resolve migration' && echo '⚠️ Step 3: Retrying migrations...' && if npm run prisma:deploy 2>&1; then echo '✅ Migrations applied after resolve'; else echo '⚠️ Step 4: Migration still failed, syncing schema with db push...' && echo '🔄 Running: npx prisma db push --accept-data-loss --skip-generate' && npx prisma db push --accept-data-loss --skip-generate 2>&1 && echo '✅ Schema synced successfully with db push' || echo '⚠️ Could not sync schema, but continuing...'; fi; fi && echo '✅ Starting application on port '${PORT:-4000}'...' && exec npm run start:prod"]
