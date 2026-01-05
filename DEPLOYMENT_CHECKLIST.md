# Quick Deployment Checklist

## ✅ Build Complete
Image: `ghcr.io/pawangupta/nyayai-librechat:latest`
Digest: `sha256:14f9383bb7aa9e8426da6839db90e8ef0bd2bdeb8fb6b7668684cc46a3d43eb8`

## 📋 Pre-Deployment Checklist

### Current EC2 Instance (If deploying here)

- [ ] Docker running: `docker ps`
- [ ] Pull image: `docker pull ghcr.io/pawangupta/nyayai-librechat:latest`
- [ ] Review .env file has required variables
- [ ] Review docker-compose.yml has correct image reference
- [ ] Review librechat.yaml has correct endpoint configuration

### For New EC2 Instance

- [ ] Instance launched (t3.medium+, Ubuntu 22.04)
- [ ] SSH access working
- [ ] Docker installed: `docker --version`
- [ ] Repository cloned
- [ ] .env configured with API keys
- [ ] docker-compose.yml reviewed

---

## 🚀 Deployment Commands

### Option 1: Quick Test (Current Instance)

```bash
# Navigate to repository
cd ~/NyayAI-LibreChat

# Pull latest image
docker pull ghcr.io/pawangupta/nyayai-librechat:latest

# Start services
docker-compose up -d

# Check services
docker-compose ps
docker logs -f librechat_api_1  # View logs
```

### Option 2: Full Deployment (New Instance)

```bash
# Follow EC2_DEPLOYMENT_GUIDE.md section "Deployment Option 2"
# Quick steps:
git clone https://github.com/pawangupta/NyayAI-LibreChat.git
cd NyayAI-LibreChat
nano .env  # Configure API keys
docker-compose pull
docker-compose up -d
```

---

## ✔️ Post-Deployment Verification

### 1. Web UI Access
```bash
curl http://localhost:3080 | head -20
# Or from your machine:
curl http://{EC2_IP}:3080 | head -20
```

### 2. Favicon Check
- Open browser to http://{EC2_IP}:3080
- Tab should show NyayAI favicon/logo
- Assets should load without 404 errors

### 3. Endpoint Verification
- Model dropdown should show:
  - ✅ LegalContract
  - ✅ Naya-AI
  - ✅ WillGen
  - ✅ DocGen
  - ❌ OpenAI (hidden)
  - ❌ Google (hidden)
  - ❌ Anthropic (hidden)

### 4. Container Health
```bash
docker-compose ps
# All containers should show "Up" status

docker-compose logs --tail=20
# Check for errors in logs
```

### 5. Backend Connectivity
```bash
curl http://localhost:8001/v1/models
# Should return model list from Legal Contract backend
```

---

## 🔧 Common Deployment Issues

| Issue | Solution |
|-------|----------|
| "Connection refused on 3080" | Check docker-compose running: `docker-compose ps` |
| "Failed to pull image" | Check Docker login: `docker login ghcr.io` |
| "Image not found" | Verify image in GHCR: `docker pull ghcr.io/pawangupta/nyayai-librechat:latest` |
| "Favicon not loading" | Check assets: `curl http://localhost:3080/assets/favicon.ico` |
| "LegalContract endpoint error" | Verify backend on 8001: `curl http://localhost:8001/v1/models` |
| "MongoDB connection failed" | Check MongoDB container: `docker ps \| grep mongo` |

---

## 📊 Monitoring After Deployment

### View Logs
```bash
# LibreChat API logs
docker-compose logs -f api

# All services logs
docker-compose logs -f

# Specific time range
docker-compose logs --since 10m
```

### Check Resource Usage
```bash
docker stats

# Or check specific container
docker stats librechat_api_1
```

### Health Checks
```bash
# LibreChat health
curl http://localhost:3080/api/health

# Legal Contract backend
curl http://localhost:8001/v1/models

# Database connectivity
docker-compose exec mongodb mongosh
```

---

## 🔄 Updating the Deployment

### When Image Updates Available
```bash
# Pull latest
docker-compose pull

# Restart services
docker-compose down
docker-compose up -d

# Verify
docker-compose ps
```

### If Issues After Update
```bash
# View logs
docker-compose logs --tail=50

# Restart specific service
docker-compose restart api

# Full restart
docker-compose down
docker-compose up -d
```

---

## 📁 Key Files

- **docker-compose.yml** - Service definitions
- **librechat.yaml** - Endpoint configuration
- **.env** - Environment variables
- **EC2_DEPLOYMENT_GUIDE.md** - Full deployment guide
- **DOCKER_BUILD_SUCCESS.md** - Build details

---

## ✅ Ready to Deploy!

All files are committed to GitHub. You can now:

1. **Test locally** on current EC2 instance
2. **Deploy to production** on new EC2 instance
3. **Monitor** using provided commands

**No further code changes needed - just deploy!**
