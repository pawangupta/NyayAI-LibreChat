#!/bin/bash
# Fix LibreChat permission issue on EC2

set -e

echo "Stopping containers..."
docker compose down

echo "Creating required directories with proper permissions..."
mkdir -p logs
mkdir -p uploads
mkdir -p images
mkdir -p data-node
mkdir -p meili_data_v1.12

# Make sure directories are writable
chmod 755 logs uploads images data-node meili_data_v1.12

echo "Directories created successfully"
echo ""
echo "✅ Ready to start LibreChat"
echo ""
echo "Run: docker compose up -d"
