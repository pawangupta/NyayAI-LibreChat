#export GHCR_PAT="git-key-frm-file"
docker login ghcr.io -u pawangupta --password-stdin <<<"$GHCR_PAT"
docker pull ghcr.io/pawangupta/nyayai-librechat:latest

