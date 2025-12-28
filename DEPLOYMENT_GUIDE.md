# SMB Owner - Deployment Guide

## ⚠️ Important: Vercel Limitation

**Vercel's standard Node.js deployment does NOT support Python packages with native C++ dependencies** (like `pdftotext` which requires `poppler`).

You have 3 deployment options:

---

## Option 1: Railway.app (Recommended - FREE & Easy)

Railway supports Docker and system dependencies out of the box.

### Steps:

1. **Sign up at** [railway.app](https://railway.app)
2. **Connect your GitHub repository**
3. **Railway will auto-detect** the Dockerfile and deploy
4. **That's it!** Railway handles everything automatically

**Pricing:** Free tier includes 500 hours/month + $5 credit

---

## Option 2: Render.com (Also Free)

Render also supports Docker deployments.

### Steps:

1. **Sign up at** [render.com](https://render.com)
2. **New → Web Service**
3. **Connect GitHub repository**
4. **Select:** Docker
5. **Deploy!**

**Pricing:** Free tier available

---

## Option 3: DigitalOcean App Platform

More robust but costs $5/month.

### Steps:

1. **Sign up at** [digitalocean.com](https://www.digitalocean.com/products/app-platform)
2. **Create App → GitHub**
3. **Select repository**
4. **Choose:** Dockerfile
5. **Deploy**

**Pricing:** $5/month

---

## Option 4: Self-Host with Docker

### Local Testing:

```bash
# Build Docker image
docker build -t smbowner .

# Run container
docker run -p 3000:3000 smbowner

# Access at http://localhost:3000
```

### Production Deployment:

Deploy to any VPS (AWS EC2, DigitalOcean Droplet, Linode, etc.) using Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

```bash
docker-compose up -d
```

---

## Why Not Vercel?

Vercel's serverless functions don't include:
- ❌ `poppler-cpp` library (required by `pdftotext`)
- ❌ Python build tools for native extensions
- ❌ Persistent filesystem for pip --user installs

**Vercel is optimized for JavaScript/TypeScript**, not Python apps with C++ dependencies.

---

## Recommended: Use Railway.app

**Railway is the easiest option** and handles everything automatically:
- ✅ Detects Dockerfile
- ✅ Installs system dependencies
- ✅ FREE tier (500 hours/month)
- ✅ Auto-deploys from GitHub
- ✅ Supports all Python packages

### Quick Deploy to Railway:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

---

## Alternative: Use the Paid API (Temporary)

If you need to deploy to Vercel urgently:

1. **Revert to previous version** using the paid Bank Statement Converter API
2. **Or fork the StatementSensei Docker** and deploy that separately

Let me know which deployment platform you'd like to use!
