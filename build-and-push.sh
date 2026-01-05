#!/bin/bash
# Build and push NyayAI LibreChat Docker image to GHCR
# This script is optimized for building on EC2 where you have more resources

set -e

echo "=========================================="
echo "NyayAI LibreChat Docker Build Script"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install Git."
    exit 1
fi

echo "✓ Docker installed"
echo "✓ Git installed"
echo ""

# Configuration
GITHUB_USER="${GITHUB_USER:-pawangupta}"
IMAGE_NAME="ghcr.io/${GITHUB_USER}/nyayai-librechat"
TAG="${TAG:-latest}"
VERSION="${VERSION:-v1.0.0}"

echo "Build Configuration:"
echo "  Image: $IMAGE_NAME"
echo "  Latest tag: $TAG"
echo "  Version tag: $VERSION"
echo ""

# Check if logged in to GHCR
echo "Checking GitHub Container Registry login..."
if ! docker logout ghcr.io &> /dev/null; then
    echo "⚠️  Not logged in to GHCR. Logging in..."
    docker login ghcr.io -u "$GITHUB_USER"
fi
echo "✓ Logged in to GHCR"
echo ""

# Build image
echo "Building Docker image..."
echo "This may take 15-20 minutes on EC2..."
echo ""

docker build \
    -t "${IMAGE_NAME}:${TAG}" \
    -t "${IMAGE_NAME}:${VERSION}" \
    -f Dockerfile \
    .

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✓ Image built successfully"
docker images | grep nyayai-librechat
echo ""

# Push to GHCR
echo "Pushing image to GitHub Container Registry..."
echo ""

docker push "${IMAGE_NAME}:${TAG}"
docker push "${IMAGE_NAME}:${VERSION}"

if [ $? -ne 0 ]; then
    echo "❌ Push failed"
    exit 1
fi

echo ""
echo "✓ Image pushed successfully"
echo ""
echo "=========================================="
echo "Build Complete!"
echo "=========================================="
echo ""
echo "Image is now available at:"
echo "  - ${IMAGE_NAME}:${TAG}"
echo "  - ${IMAGE_NAME}:${VERSION}"
echo ""
echo "To use in docker-compose.yml, ensure:"
echo "  image: ${IMAGE_NAME}:${TAG}"
echo ""
echo "To make package public on GitHub:"
echo "  https://github.com/users/${GITHUB_USER}/packages/container/nyayai-librechat/settings"
echo ""
