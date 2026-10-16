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

# Install curl and wget to ensure all healthcheck commands succeed reliably
RUN apk add --no-cache curl wget

# Remove default Nginx HTML
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration with SPA routing & compression
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Port exposed by Nginx container
EXPOSE 80

# Production Healthcheck using explicit IPv4 loopback (127.0.0.1:80)
HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD curl -fs http://127.0.0.1:80/healthz || wget -q -O - http://127.0.0.1:80/healthz || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
