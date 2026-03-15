#!/bin/bash
# =============================================================================
# NyayAI / LibreChat - Reset a User's Password in MongoDB
#
# Usage:
#   ./reset_password.sh                          # interactive prompts
#   ./reset_password.sh --email user@example.com # prompts for password only
#   ./reset_password.sh --email user@example.com --password "NewPass123!"
#
# Options:
#   --container   Docker container name (default: chat-mongodb)
#   --db          MongoDB database name (default: LibreChat)
#   --email       User's email address
#   --password    New plaintext password (min 8 chars)
#
# Password is bcrypt-hashed (cost=10) inside the container using Node.js.
# All existing sessions are invalidated via passwordVersion update.
# =============================================================================

set -euo pipefail

# ---- Defaults ---------------------------------------------------------------
CONTAINER="chat-mongodb"
DB="LibreChat"
EMAIL=""
PASSWORD=""

# ---- Argument parsing -------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --container) CONTAINER="$2"; shift 2 ;;
    --db)        DB="$2";        shift 2 ;;
    --email)     EMAIL="$2";     shift 2 ;;
    --password)  PASSWORD="$2";  shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ---- Interactive prompts ----------------------------------------------------
if [[ -z "$EMAIL" ]]; then
  read -rp "Email: " EMAIL
fi
EMAIL=$(echo "$EMAIL" | tr '[:upper:]' '[:lower:]' | xargs)

if [[ -z "$EMAIL" ]]; then
  echo "ERROR: Email cannot be empty." >&2
  exit 1
fi

if [[ -z "$PASSWORD" ]]; then
  while true; do
    read -rsp "New password (min 8 chars): " PASSWORD
    echo
    if [[ ${#PASSWORD} -lt 8 ]]; then
      echo "Password must be at least 8 characters. Try again."
      continue
    fi
    read -rsp "Confirm password: " PASSWORD2
    echo
    if [[ "$PASSWORD" != "$PASSWORD2" ]]; then
      echo "Passwords do not match. Try again."
      continue
    fi
    break
  done
fi

if [[ ${#PASSWORD} -lt 8 ]]; then
  echo "ERROR: Password must be at least 8 characters." >&2
  exit 1
fi

# ---- Check user exists ------------------------------------------------------
echo ""
echo "Checking user..."
EXISTS=$(docker exec -i "${CONTAINER}" mongosh --quiet "${DB}" --eval \
  "db.users.countDocuments({ email: '${EMAIL}' })")

if [[ "$EXISTS" == "0" ]]; then
  echo "ERROR: No user found with email: ${EMAIL}" >&2
  exit 1
fi

# Get user info for confirmation
USER_INFO=$(docker exec -i "${CONTAINER}" mongosh --quiet "${DB}" --eval \
  "var u = db.users.findOne({ email: '${EMAIL}' }, { name:1, role:1, company_name:1 });
   print(u.name + ' | ' + u.role + ' | ' + (u.company_name || 'no company'));")

echo "  Found : ${USER_INFO}"
echo "  Email : ${EMAIL}"
echo ""
read -rp "Confirm password reset for this user? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# ---- Hash password using bcryptjs inside the container ----------------------
# Node.js + bcryptjs is available in the LibreChat container image
echo ""
echo "Hashing password..."
HASHED=$(docker exec -i "${CONTAINER}" node -e "
  const bcrypt = require('bcryptjs');
  bcrypt.hash('${PASSWORD}', 10).then(h => { process.stdout.write(h); });
")

if [[ -z "$HASHED" ]]; then
  echo "ERROR: Failed to hash password (is Node.js/bcryptjs available in the container?)." >&2
  exit 1
fi

# ---- Update the user document -----------------------------------------------
echo "Updating password in MongoDB..."
RESULT=$(docker exec -i "${CONTAINER}" mongosh --quiet "${DB}" --eval "
  var result = db.users.updateOne(
    { email: '${EMAIL}' },
    { \$set: {
        password: '${HASHED}',
        passwordVersion: new Date().getTime()
      }
    }
  );
  print(result.matchedCount + ' matched, ' + result.modifiedCount + ' modified');
")

echo ""
echo "Result  : ${RESULT}"
echo "Status  : Password successfully reset for ${EMAIL}"
echo "          All existing sessions have been invalidated."
echo ""
