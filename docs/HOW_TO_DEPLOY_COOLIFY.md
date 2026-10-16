# Coolify Deployment Guide: Zen Family Spa Dashboard

This guide provides instructions for deploying the **Zen Family Spa and Reflexology** dashboard on a Coolify server (DigitalOcean / VPS).

---

## 1. Coolify Application Configuration

1. In your Coolify dashboard, select your **Project** and **Environment** (e.g. `Production`).
2. Click **+ Add Resource** ➔ **Public / Private Git Repository**.
3. Provide the GitHub repository URL:
   ```
   https://github.com/borist-nababan-cloud/zen-dashboard.git
   ```
4. Set **Branch** to: `main`.

---

## 2. Build Configuration (Static / Nginx)

Coolify can deploy this Vite application using **Nixpacks** or **Docker (Nginx)**:

### Option A: Using Nixpacks (Recommended - Zero Configuration)
* **Build Pack:** `Nixpacks`
* **Install Command:** `bun install` (or `npm install`)
* **Build Command:** `bun run build` (or `npm run build`)
* **Publish Directory:** `dist`
* **Ports Exposed:** `80` (or leave default for Nixpacks static server)

### Option B: Using Custom Dockerfile (Nginx)
If you prefer a lightweight Alpine Nginx container:
```dockerfile
FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Domain & SSL Setup

1. In Coolify ➔ **Domains**, enter your desired domain name (e.g. `https://dashboard.zenfamilyspa.id`).
2. Coolify will automatically provision a free **Let's Encrypt SSL/TLS Certificate** via Traefik.
3. Click **Deploy** to trigger the automated build pipeline.
