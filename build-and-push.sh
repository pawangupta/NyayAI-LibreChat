#!/bin/bash
# NyayAI LibreChat - Docker Build and Push Script
# Builds the Docker image and pushes to GitHub Container Registry (GHCR)
# Usage: ./build-and-push.sh [tag] [push]
# Example: ./build-and-push.sh latest true

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="ghcr.io"
OWNER="pawangupta"
IMAGE_NAME="nyayai-librechat"
TAG="${1:-latest}"
SHOULD_PUSH="${2:-true}"
IMAGE="${REGISTRY}/${OWNER}/${IMAGE_NAME}:${TAG}"

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}NyayAI LibreChat - Docker Build and Push${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "Registry: ${YELLOW}${REGISTRY}${NC}"
echo -e "Image: ${YELLOW}${IMAGE}${NC}"
echo -e "Tag: ${YELLOW}${TAG}${NC}"
echo -e "Push to Registry: ${YELLOW}${SHOULD_PUSH}${NC}"
echo ""

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}Error: Dockerfile not found in current directory${NC}"
    echo "Please run this script from the NyayAI-LibreChat root directory"
    exit 1
fi

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Log in to GHCR if pushing
if [ "$SHOULD_PUSH" = "true" ] || [ "$SHOULD_PUSH" = "1" ]; then
    echo -e "${YELLOW}Authenticating with GitHub Container Registry (GHCR)...${NC}"
    
    if [ -z "$GH_TOKEN" ]; then
        echo -e "${RED}Error: GH_TOKEN environment variable not set${NC}"
        echo "Please set your GitHub Personal Access Token:"
        echo "  export GH_TOKEN=your_token_here"
        echo ""
        echo "Token requires: read:packages, write:packages scopes"
        exit 1
    fi
    
    echo "$GH_TOKEN" | docker login ghcr.io -u pawangupta --password-stdin
    echo -e "${GREEN}✓ GHCR authentication successful${NC}"
    echo ""
fi

# Build Docker image
echo -e "${YELLOW}Building Docker image: ${IMAGE}${NC}"
echo -e "${YELLOW}This may take 15-20 minutes...${NC}"
echo ""

docker build -t "$IMAGE" -f Dockerfile . || {
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
}

echo -e "${GREEN}✓ Docker image built successfully${NC}"
echo ""

# Tag as latest if not already latest
if [ "$TAG" != "latest" ]; then
    echo -e "${YELLOW}Tagging image as latest...${NC}"
    docker tag "$IMAGE" "${REGISTRY}/${OWNER}/${IMAGE_NAME}:latest"
    echo -e "${GREEN}✓ Image tagged as latest${NC}"
    echo ""
fi

# Push to registry if requested
if [ "$SHOULD_PUSH" = "true" ] || [ "$SHOULD_PUSH" = "1" ]; then
    echo -e "${YELLOW}Pushing image to GHCR: ${IMAGE}${NC}"
    docker push "$IMAGE"
    
    if [ "$TAG" != "latest" ]; then
        echo -e "${YELLOW}Pushing latest tag...${NC}"
        docker push "${REGISTRY}/${OWNER}/${IMAGE_NAME}:latest"
    fi
    
    echo -e "${GREEN}✓ Image pushed successfully${NC}"
    echo ""
    echo -e "${GREEN}Image is now available at: ${REGISTRY}/${OWNER}/${IMAGE_NAME}${NC}"
else
    echo -e "${YELLOW}Skipping push (use ./build-and-push.sh $TAG true to push)${NC}"
    echo ""
    echo -e "${GREEN}Image built and ready locally: ${IMAGE}${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Build Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Test image locally: ${YELLOW}docker run -d -p 3080:3080 $IMAGE${NC}"
echo -e "  2. Deploy to EC2: Follow EC2_DEPLOYMENT_GUIDE.md"
echo -e "  3. Verify branding: Check favicon and custom endpoints in browser"
echo ""
