# Multi-stage Dockerfile for Love Claude Code

# Base stage for dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
RUN npm ci --only=production

# Development stage
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3000 8000
CMD ["npm", "run", "dev"]

# Builder stage for frontend
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Builder stage for backend
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Production stage for frontend (static files served by nginx)
FROM nginx:alpine AS frontend-prod
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Production stage for backend
FROM node:20-alpine AS backend-prod
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=base /app/node_modules ./node_modules

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

EXPOSE 8000
CMD ["node", "dist/index.js"]

# Security scanning stage (optional)
FROM aquasec/trivy:latest AS security-scan
COPY --from=frontend-prod / /frontend
COPY --from=backend-prod / /backend
RUN trivy fs --no-progress /frontend && \
    trivy fs --no-progress /backend