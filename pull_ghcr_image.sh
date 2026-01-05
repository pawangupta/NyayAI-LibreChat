export GHCR_PAT="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"
docker login ghcr.io -u pawangupta --password-stdin <<<"$GHCR_PAT"
docker pull ghcr.io/pawangupta/nyayai-librechat:latest

