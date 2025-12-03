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

# Build application
RUN npm run build

# Remove devDependencies after build to reduce image size
RUN npm prune --production && npm cache clean --force

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["sh", "-c", "npm run prisma:deploy && npm run start:prod"]

