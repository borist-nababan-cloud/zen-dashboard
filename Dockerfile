# ==========================================
# Multi-Stage Production Dockerfile for Zen Dashboard
# ==========================================

# Stage 1: Build Application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cached if package files unchanged)
COPY package*.json ./
RUN npm ci --no-audit --prefer-offline || npm install

# Build Arguments for Supabase Configuration
ARG VITE_SUPABASE_URL=https://ihdlwogvjfgawgsalgng.supabase.co
ARG VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_KobV2o95Ymfem77b4zVBJg_E_onldRD

# Expose to Vite build environment
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Copy project source code
COPY . .

# Build production bundle to /app/dist
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Remove default Nginx HTML
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration with SPA routing & compression
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Port exposed by Nginx container
EXPOSE 80

# Production Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
