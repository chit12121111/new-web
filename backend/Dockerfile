FROM node:20-alpine

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

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with debug output
CMD ["sh", "-c", "echo '🚀 Starting application...' && echo '📁 Current directory:' && pwd && echo '📁 Contents:' && ls -la && echo '📁 Dist folder:' && (ls -la dist/ 2>/dev/null || echo '❌ dist/ folder does not exist!') && echo '📁 Dist/src folder:' && (ls -la dist/src/ 2>/dev/null || echo '❌ dist/src/ folder does not exist!') && if [ ! -f dist/src/main.js ]; then echo '❌ ERROR: dist/src/main.js not found in container!' && find dist -name 'main.js' 2>/dev/null && exit 1; fi && echo '✅ dist/src/main.js found, running migrations...' && npm run prisma:deploy && echo '✅ Migrations completed, starting app...' && npm run start:prod"]

