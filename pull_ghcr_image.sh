#export GHCR_PAT=
docker login ghcr.io -u pawangupta --password-stdin <<<"$GHCR_PAT"
docker pull ghcr.io/pawangupta/nyayai-librechat:latest

