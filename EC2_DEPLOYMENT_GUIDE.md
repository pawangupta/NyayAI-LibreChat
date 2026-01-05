# NyayAI LibreChat - EC2 Deployment Guide

This guide explains how to deploy the NyayAI-branded LibreChat on an AWS EC2 instance.

## Prerequisites

- AWS EC2 instance (Ubuntu 22.04 LTS or similar)
- Minimum 2GB RAM (4GB recommended for faster builds)
- At least 10GB free disk space
- Docker and Docker Compose installed

## Deployment Option 1: Build Docker Image on EC2 (Recommended)

This approach builds the custom Docker image directly on EC2 with your branding.

### Step 1: Launch EC2 Instance

```bash
# Instance type: t3.medium or larger (minimum t3.small with 2GB RAM)
# AMI: Ubuntu 22.04 LTS
# Storage: 20GB (for build cache)
```

### Step 2: Install Docker on EC2

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### Step 3: Clone Repository with Custom Branding

```bash
cd /opt
git clone https://github.com/pawangupta/NyayAI-LibreChat.git
cd NyayAI-LibreChat
```

### Step 4: Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit with your settings
nano .env

# Key settings:
# - PORT=3080
# - MONGO_URI=mongodb://mongodb:27017/LibreChat
# - Set API keys as needed
```

### Step 5: Create docker-compose.override.yml (Optional)

For development/testing, create an override file:

```bash
cat > docker-compose.override.yml << 'EOF'
services:
  api:
    build:
      context: .
      target: node
    image: librechat-nyayai:latest
EOF
```

### Step 6: Build and Start

```bash
# Build the image (takes 15-20 minutes)
docker-compose build --no-cache

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f api
```

### Step 7: Access LibreChat

```bash
# Get EC2 public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Access at: http://{EC2_PUBLIC_IP}:3080
```

---

## Deployment Option 2: Use Pre-built Image from GHCR (Faster)

This approach pulls a pre-built image (once the build completes on Mac).

### Step 1-3: Same as Option 1

### Step 4: Make GHCR Package Public

Go to: https://github.com/users/pawangupta/packages/container/nyayai-librechat/settings

Change visibility to **Public**

### Step 5: Update docker-compose.yml

```bash
# The image is already configured in docker-compose.yml
# Just pull and run:
docker-compose pull
docker-compose up -d
```

### Step 6: Access LibreChat

Same as Option 1 - access at http://{EC2_PUBLIC_IP}:3080

---

## Verifying Deployment

### Check Services

```bash
# Check running containers
docker-compose ps

# Check logs
docker-compose logs api
docker-compose logs mongodb
docker-compose logs rag_api
```

### Test LibreChat

```bash
# Test API health
curl http://localhost:3080/api/auth/login

# Access UI
echo "Visit http://{EC2_PUBLIC_IP}:3080"
```

### Verify Branding

- Open http://{EC2_PUBLIC_IP}:3080
- Check browser tab for NyayAI favicon
- Verify custom welcome message loads
- Check model dropdown for custom endpoints

---

## Troubleshooting

### Build Fails with "Out of Memory"

```bash
# Increase Docker memory limits
# Edit: /etc/docker/daemon.json
{
  "memory": "2g"
}

# Restart Docker
sudo systemctl restart docker
```

### Port Already in Use

```bash
# Change port in .env
PORT=3081

# Or kill process on port 3080
sudo lsof -i :3080
sudo kill -9 <PID>
```

### LibreChat Won't Start

```bash
# Check logs
docker-compose logs api

# Restart
docker-compose restart api

# Check MongoDB
docker-compose logs mongodb
```

---

## Production Considerations

### Security

1. **Use HTTPS/SSL**
   - Install certbot and Let's Encrypt
   - Use nginx reverse proxy
   - Update .env with DOMAIN_CLIENT and DOMAIN_SERVER

2. **Environment Variables**
   - Generate new JWT secrets: https://www.librechat.ai/toolkit/creds_generator
   - Set strong database passwords
   - Use AWS Secrets Manager

3. **Database**
   - Use AWS RDS MongoDB instead of Docker
   - Enable encryption
   - Regular backups

### Scaling

```bash
# Use ECS/EKS for container orchestration
# Use ALB for load balancing
# Use CloudFront for CDN
```

### Monitoring

```bash
# Setup CloudWatch logs
# Monitor Docker containers
# Alert on service failures
```

---

## Rollback to Previous Version

If issues occur after deployment:

```bash
# Revert to tagged version
git checkout v0.9.0-checkpoint

# Restart with previous image
docker-compose down
docker-compose up -d
```

---

## Current Branding Status

✅ **Favicons Updated**
- favicon.ico (16x16, 32x32)
- apple-touch-icon.png (180x180)
- android-chrome-*.png (192x192, 512x512)
- site.webmanifest (PWA manifest)

✅ **Configuration Ready**
- Custom LegalContract endpoint (port 8001)
- Custom endpoints (Naya-AI, WillGen, DocGen)
- Disabled built-in endpoints (OpenAI, Google, Anthropic, Assistants)
- Docker image configured in docker-compose.yml

⏳ **Pending**
- Docker image build completion and GHCR push
- Once complete, pull and test on EC2

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- LibreChat docs: https://docs.librechat.ai
- GitHub Issues: https://github.com/pawangupta/NyayAI-LibreChat/issues

---

## Architecture

```
Internet
    ↓
AWS Security Group (ports 80, 443, 3080)
    ↓
EC2 Instance
    ├── Docker Network (paralx-network)
    │   ├── LibreChat (port 3080)
    │   ├── MongoDB (port 27017)
    │   ├── Meilisearch (port 7700)
    │   └── RAG API (port 8000)
    │
    └── External Services
        ├── Legal Contract Backend (port 8001)
        └── Qdrant Vector DB (port 6333)
```

---

**Last Updated:** January 5, 2026
**Version:** 1.0.0
**Branding:** NyayAI
