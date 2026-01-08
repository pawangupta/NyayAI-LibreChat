# EC2 Setup Guide for NyayAI LibreChat

## Prerequisites Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo apt install docker-compose -y

# Install git and jq
sudo apt install git jq -y
```

## Clone Repository

```bash
# Navigate to home or desired directory
cd ~

# Clone NyayAI-LibreChat
git clone https://github.com/pawangupta/NyayAI-LibreChat.git
cd NyayAI-LibreChat

# Verify
git branch
git log -1 --oneline
```

## Pull GHCR Image

```bash
# Login to GHCR (if private repo)
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u pawangupta --password-stdin

# Pull multi-arch image (automatically selects amd64 on EC2)
docker pull ghcr.io/pawangupta/nyayai-librechat:latest

# Or specific version
docker pull ghcr.io/pawangupta/nyayai-librechat:v1.0.0

# Verify image
docker images | grep nyayai-librechat
docker manifest inspect ghcr.io/pawangupta/nyayai-librechat:latest | jq '.manifests[].platform'
```

## Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit environment variables
nano .env
# Set required values:
# - OPENAI_API_KEY or other LLM provider keys
# - MONGO_URI (if using external MongoDB)
# - Other custom endpoint configurations
```

## Update docker-compose.yml (if needed)

```bash
# Use GHCR image instead of local build
nano docker-compose.yml
# Change:
#   build: .
# To:
#   image: ghcr.io/pawangupta/nyayai-librechat:latest
```

## Start Services

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify running
docker-compose ps
curl -s http://localhost:3080 | head -20
```

## Update Repository

```bash
# Pull latest code
cd ~/NyayAI-LibreChat
git pull origin main

# Pull latest image
docker pull ghcr.io/pawangupta/nyayai-librechat:latest

# Restart services
docker-compose down
docker-compose up -d
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart api

# Stop all services
docker-compose down

# Remove volumes (clean start)
docker-compose down -v

# Check container status
docker ps
docker stats

# Access container shell
docker-compose exec api bash
```

## Troubleshooting

```bash
# Check Docker version
docker --version
docker-compose --version

# Check image architecture
docker inspect ghcr.io/pawangupta/nyayai-librechat:latest | jq '.[0].Architecture'

# View container logs
docker logs $(docker ps -q --filter ancestor=ghcr.io/pawangupta/nyayai-librechat:latest)

# Clean up
docker system prune -a
docker volume prune
```
