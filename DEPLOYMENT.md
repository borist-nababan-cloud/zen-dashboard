# Zen Family Spa & Reflexology - Executive Dashboard
## Production Deployment Guide (Coolify)

This document provides step-by-step instructions for deploying the Zen Executive Dashboard to **Coolify** using Docker or Nixpacks.

---

### 1. Architecture Overview
- **Framework**: Vite 6 + React 18 + TypeScript + TailwindCSS
- **Runtime Web Server**: Nginx Alpine (Multi-stage Docker container)
- **Database / API**: Supabase Cloud / Staging REST API
- **Default Port**: `80` (HTTP inside container)
- **Healthcheck Endpoint**: `/healthz`

---

### 2. Deployment via Coolify (Git Repository - Recommended)

#### Step 2.1: Add Project & Resource
1. Log in to your Coolify dashboard.
2. Select your **Project** and **Environment** (e.g., `Production`).
3. Click **+ New Resource** $\to$ **Public Repository** or **Private Repository (GitHub / GitLab / Gitea)**.
4. Fill in the repository URL and branch:
   - **Repository**: `https://github.com/<your-org>/zen-dashboard`
   - **Branch**: `main` (or your active branch)
   - **Base Directory**: `/frontend/dashboard` (or `/` if the dashboard is at the root of the repository)

#### Step 2.2: Build Pack Configuration
- Select **Dockerfile** as the Build Pack.
- Coolify will automatically detect the `Dockerfile` inside the specified directory.

#### Step 2.3: Configure Environment Variables
Navigate to the **Environment Variables** tab in Coolify and add the following keys:

| Variable Name | Value | Build Time |
| :--- | :--- | :---: |
| `VITE_SUPABASE_URL` | `https://ihdlwogvjfgawgsalgng.supabase.co` | **Checked (Yes)** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_KobV2o95Ymfem77b4zVBJg_E_onldRD` | **Checked (Yes)** |

> **Important**: In Vite, `VITE_*` variables are bundled during compilation. Make sure the **Build Time** checkbox in Coolify is checked so they are passed to `docker build`.

#### Step 2.4: Domain & SSL Configuration
1. In the **General** settings of your resource:
   - **Domains**: Enter your desired production domain, for example:
     `https://dashboard.zenfamilyspa.com`
2. Coolify will automatically provision and renew a free Let's Encrypt SSL certificate via Traefik.
3. Set the **Exposed Port** to `80`.

#### Step 2.5: Health Check Setup
1. In the **Health Checks** section:
   - **Path**: `/healthz`
   - **Port**: `80`
   - **Interval**: `30s`
   - **Timeout**: `5s`
2. Click **Save** and then click **Deploy**.

---

### 3. Deployment via Coolify (Docker Compose)

If you prefer to deploy using Docker Compose:
1. In Coolify, choose **+ New Resource** $\to$ **Docker Compose**.
2. Paste the contents of `docker-compose.yml`:
```yaml
version: '3.8'

services:
  zen-dashboard:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:-https://ihdlwogvjfgawgsalgng.supabase.co}
        VITE_SUPABASE_PUBLISHABLE_KEY: ${VITE_SUPABASE_PUBLISHABLE_KEY:-sb_publishable_KobV2o95Ymfem77b4zVBJg_E_onldRD}
    restart: unless-stopped
    ports:
      - "80:80"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
```
3. Set your domain and click **Deploy**.

---

### 4. Local Testing Before Push

You can test the production Docker build locally with Docker Desktop:
```bash
# Build the container
docker build -t zen-dashboard:latest .

# Run the container
docker run -d -p 8080:80 --name zen-dashboard-test zen-dashboard:latest

# Check health endpoint
curl http://localhost:8080/healthz
# Expected output: OK
```
Open `http://localhost:8080` in your browser to verify the live dashboard.
