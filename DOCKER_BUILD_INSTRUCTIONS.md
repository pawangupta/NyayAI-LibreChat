# Docker Build and Push Instructions for NyayAI LibreChat

## Problem Statement
The Docker image build is timing out on macOS during the npm dependency installation phase. This is due to:
- Mac Docker resource limits (CPU/Memory)
- Cross-platform build overhead (arm64 → linux/amd64)
- Long npm/webpack compilation (15-20 minutes)
- Docker daemon timeout during extended builds

## Solution: Build on AWS EC2

### Why EC2?
- Linux native environment (no cross-platform overhead)
- Dedicated resources (no competing processes)
- Stable Docker daemon with longer timeout windows
- Can build and push in one session
- Better suited for production Docker operations

---

## Prerequisites

**You will need:**
- AWS EC2 instance (Ubuntu 22.04 LTS, t3.medium or larger, 2GB+ RAM)
- Public IP address assigned to EC2 instance
- SSH access to EC2 instance
- GitHub Personal Access Token with `read:packages` and `write:packages` scopes

### Create GitHub Token
1. Go to https://github.com/settings/tokens/new
2. Select "Personal access token (classic)"
3. Give it name: "GHCR_TOKEN"
4. Check these scopes:
   - `read:packages` - Download packages
   - `write:packages` - Upload packages
5. Generate and **copy the token immediately** (you won't see it again!)

---

## Step 1: Launch EC2 Instance

```bash
# Use AWS Console or CLI to launch:
# - AMI: Ubuntu 22.04 LTS (ami-0c55b159cbfafe1f0 or similar)
# - Instance Type: t3.medium (or larger)
# - Storage: 20GB minimum
# - Security Group: Allow port 22 (SSH), optionally 3080 for testing
```

---

## Step 2: SSH into EC2 and Install Docker

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose git

# Add current user to docker group (avoid sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker is working
docker --version
docker run hello-world
```

---

## Step 3: Clone Repository and Build

```bash
# Clone the repository
git clone https://github.com/pawangupta/NyayAI-LibreChat.git
cd NyayAI-LibreChat

# Verify build script exists
ls -la build-and-push.sh

# Make script executable (if needed)
chmod +x build-and-push.sh
```

---

## Step 4: Build and Push to GHCR

### Option A: Using Build Script (Recommended)

```bash
# Set your GitHub token as environment variable
export GH_TOKEN=your_github_token_here

# Run the build and push script
./build-and-push.sh latest true

# This will:
# 1. Authenticate with GHCR
# 2. Build the image
# 3. Tag as 'latest'
# 4. Push to ghcr.io/pawangupta/nyayai-librechat:latest
```

**Monitoring the build:**
- Expect 15-20 minutes for initial build
- Watch for step progress (19/29, 20/29, etc.)
- No timeouts expected on EC2

### Option B: Manual Build and Push

```bash
# Login to GHCR
echo $GH_TOKEN | docker login ghcr.io -u pawangupta --password-stdin

# Build the image
docker build -t ghcr.io/pawangupta/nyayai-librechat:latest -f Dockerfile .

# Tag for version (optional)
docker tag ghcr.io/pawangupta/nyayai-librechat:latest \
  ghcr.io/pawangupta/nyayai-librechat:v1.0.0

# Push to GHCR
docker push ghcr.io/pawangupta/nyayai-librechat:latest
docker push ghcr.io/pawangupta/nyayai-librechat:v1.0.0
```

---

## Step 5: Verify Image in GHCR

After the push completes:

```bash
# List local image
docker images | grep nyayai-librechat

# Check GHCR package
# Visit: https://github.com/users/pawangupta/packages/container/nyayai-librechat

# Or use curl to verify image exists
curl -H "Authorization: token $GH_TOKEN" \
  https://api.github.com/user/packages | jq '.[] | select(.name=="nyayai-librechat")'
```

---

## Step 6: Test Image on EC2 (Optional)

Before moving to production, test the image locally on EC2:

```bash
# Pull the image
docker pull ghcr.io/pawangupta/nyayai-librechat:latest

# Run with docker-compose (if available)
# Or manually:
docker run -d \
  --name librechat-test \
  -p 3080:3080 \
  -e PORT=3080 \
  ghcr.io/pawangupta/nyayai-librechat:latest

# Check if running
docker ps | grep librechat-test

# Test endpoint
curl http://localhost:3080 | head -20
```

---

## Build Output Examples

### Successful Build Progress
```
[+] Building 45.3s (20/29)
=> [node  9/16] COPY --chown=node:node api/package.json ...
=> [node 10/16] COPY --chown=node:node client/package.json ...
=> [node 11/16] COPY --chown=node:node packages/data-provider/package.json ...
=> [node 14/16] RUN touch .env ; mkdir -p /app/client/public ...
```

### Build Completion
```
=> [stage-1 1/4] FROM docker.io/library/node:20-alpine ...
=> [stage-1 2/4] COPY --from=node /app ...
=> => naming to ghcr.io/pawangupta/nyayai-librechat:latest
=> [stage-1 3/4] EXPOSE 3080 5900
=> exporting to oci image format
The push refers to repository [ghcr.io/pawangupta/nyayai-librechat]
v1.0.0: digest: sha256:abc123... size: 1.5GB
```

---

## Troubleshooting

### "failed to read dockerfile"
- Verify you're in `/NyayAI-LibreChat` directory
- Check: `ls -la Dockerfile` shows the file
- Solution: `cd NyayAI-LibreChat && pwd`

### "GHCR authentication failed"
- Check token is set: `echo $GH_TOKEN`
- Verify token scopes include `write:packages`
- Try manual login: `docker login ghcr.io` (enter username and token when prompted)

### Build still times out (rare on EC2)
- Increase instance size (t3.large or xlarge)
- Check available disk space: `df -h`
- Check memory: `free -h`
- Monitor during build: `docker stats` in another terminal

### Image doesn't push
- Verify authentication: `docker login ghcr.io`
- Check Docker daemon: `docker ps`
- Check network: `curl -I https://ghcr.io`
- Try manual push: `docker push ghcr.io/pawangupta/nyayai-librechat:latest`

### "permission denied while trying to connect to Docker daemon"
- Add user to docker group: `sudo usermod -aG docker $USER`
- Activate new group: `newgrp docker`
- Verify: `docker ps` (should work without sudo)

---

## Next Steps After Build Completes

### 1. Update Deployment
Once image is in GHCR, update your docker-compose.yml:
```yaml
api:
  image: ghcr.io/pawangupta/nyayai-librechat:latest
```

### 2. Deploy to Production EC2
Follow [EC2_DEPLOYMENT_GUIDE.md](EC2_DEPLOYMENT_GUIDE.md) using:
- **Option 2: Use Pre-built Image from GHCR** (since you now have the image)
- This is much faster than building on the production instance

### 3. Verify Branding
After deployment:
- Visit `http://YOUR_EC2_IP:3080`
- Check favicon loads (NyayAI logo in browser tab)
- Test LegalContract endpoint in the model dropdown
- Verify built-in endpoints are hidden (OpenAI, Google, etc.)

---

## Cleanup

After successful build and push:

```bash
# On EC2 (optional, to save disk space)
docker rmi ghcr.io/pawangupta/nyayai-librechat:latest

# On your Mac (optional)
docker rmi ghcr.io/pawangupta/nyayai-librechat:latest
```

---

## Summary

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | Launch EC2 instance |
| 2 | 10 min | Install Docker |
| 3 | 2 min | Clone repo |
| 4 | 20 min | Build image |
| 5 | 5 min | Push to GHCR |
| **Total** | **~45 min** | Complete build & push |

After this, deployment to production is just pulling the pre-built image!

---

## Resources

- [EC2_DEPLOYMENT_GUIDE.md](EC2_DEPLOYMENT_GUIDE.md) - Full deployment guide
- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Official Docs](https://docs.docker.com/)
