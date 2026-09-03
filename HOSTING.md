# 🚀 Hosting & Deployment Guide

This guide provides step-by-step instructions for hosting the **Indian Army Recruitment Information Assistant** across different deployment environments.

---

## 🛠️ Project Preparation Summary

The codebase has been updated and configured for multi-environment hosting:
- **Dynamic API Base URL**: Frontend automatically connects to the backend in production, containerized, or local setups (`frontend/src/services/api.js`).
- **Unified FastAPI Static Mount**: FastAPI backend automatically serves the built React frontend (`frontend/dist`) at `/` when deployed as a single service.
- **Auto-Initializing Database**: SQLite database and initial seed FAQs automatically initialize if missing on startup.
- **Docker Support**: Pre-configured `Dockerfile` and `docker-compose.yml` for 1-command deployment.

---

## 🐳 Option 1: Docker Deployment (Recommended for Cloud / Servers)

Deploy the entire app (Frontend + Backend) inside a single lightweight Docker container.

### Prerequisites
- [Docker Desktop](https://www.docker.com/) or Docker Engine installed on server.

### 1-Click Launch with Docker Compose
```bash
# Navigate to project root
cd "d:\southern command\project-ChatBot Query"

# Build and start container
docker-compose up -d --build
```

Access the application at: **`http://localhost:8005/`**

### Docker Logs & Management
```bash
# View live application logs
docker-compose logs -f

# Stop application
docker-compose down
```

---

## ☁️ Option 2: Free Cloud Hosting (Render + Vercel / Render Standalone)

### Method A: Single-Service Hosting on Render (Fastest & Free)

Render can build both frontend and backend in one web service.

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Prepare production deployment"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Create New Web Service on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service**.
   - Connect your GitHub repository.

3. **Configure Settings**:
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```bash
     cd frontend && npm install && npm run build && cd .. && pip install -r requirements.txt
     ```
   - **Start Command**: 
     ```bash
     python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Environment Variables**:
     - `ADMIN_KEY` = `your_admin_secret`
     - `GEMINI_API_KEY` = *(optional Gemini API key)*

4. Click **Create Web Service**. Your live web URL will be generated (`https://your-app.onrender.com`).

---

### Method B: Split Hosting (Frontend on Vercel + Backend on Render)

#### Step 1: Deploy Backend to Render
1. Create Web Service on Render.
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Copy your backend live URL (e.g., `https://army-faq-api.onrender.com`).

#### Step 2: Deploy Frontend to Vercel
1. Import repository on [Vercel Dashboard](https://vercel.com/new).
2. Set Root Directory to `frontend`.
3. Add Environment Variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://army-faq-api.onrender.com` *(your Render backend URL)*
4. Click **Deploy**.

---

## 🌐 Option 3: Local Network (LAN / Office) Hosting

To let other devices on your local network (Wi-Fi / Ethernet) access the application without cloud deployment:

### 1. Build Frontend Static Assets
```bash
cd frontend
npm run build
```

### 2. Start Backend bound to Local Network IP (`0.0.0.0`)
```bash
# From project root directory:
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8005
```

### 3. Access from Network Devices
Find your computer's local IP address (e.g., run `ipconfig` on Windows -> look for IPv4 Address like `192.168.1.15`).

Any device on the same Wi-Fi network can access the web application at:
`http://192.168.1.15:8005/`

---

## 📊 Summary of Deployment Files Created

| File | Purpose |
| :--- | :--- |
| [`Dockerfile`](file:///d:/southern%20command/project-ChatBot%20Query/Dockerfile) | Multi-stage build script (Node build + Python server) |
| [`docker-compose.yml`](file:///d:/southern%20command/project-ChatBot%20Query/docker-compose.yml) | 1-command Docker launcher with persisted SQLite volume |
| [`requirements.txt`](file:///d:/southern%20command/project-ChatBot%20Query/requirements.txt) | Python dependencies for cloud platforms |
| [`.dockerignore`](file:///d:/southern%20command/project-ChatBot%20Query/.dockerignore) | Excludes node_modules and build caches |
| [`frontend/dist/`](file:///d:/southern%20command/project-ChatBot%20Query/frontend/dist) | Compiled production React application |
