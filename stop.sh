#!/bin/bash
# Stop LibreChat UI Service

cd "$(dirname "$0")"

echo "Stopping LibreChat..."
docker compose down

echo "✓ LibreChat stopped"
