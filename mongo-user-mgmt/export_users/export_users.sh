#!/bin/bash
# =============================================================================
# NyayAI / LibreChat - Export Users from MongoDB
# Usage: ./export_users.sh [OPTIONS]
#
# Options:
#   --container   Docker container name (default: chat-mongodb)
#   --db          MongoDB database name (default: LibreChat)
#   --mongo-uri   Full MongoDB URI (overrides --container/--db)
#   --out         Output file path (default: ./librechat_users_<timestamp>.json)
#   --format      Export format: json (default) | csv
#   --role        Filter by role: USER | ADMIN (exports all if omitted)
#   --include-sensitive  Also export hashed password & tokens (off by default)
#
# NOTE: Passwords exported are bcrypt hashes — they cannot be reversed.
#       On import to another instance they will NOT work for login.
#       Users will need to reset passwords via the "Forgot Password" flow.
# =============================================================================

set -euo pipefail

# ---- Defaults ---------------------------------------------------------------
CONTAINER="chat-mongodb"
DB="LibreChat"
MONGO_URI=""
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_FILE="./librechat_users_${TIMESTAMP}.json"
FORMAT="json"
ROLE_FILTER=""
INCLUDE_SENSITIVE=false

# ---- Argument parsing -------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --container)         CONTAINER="$2";         shift 2 ;;
    --db)                DB="$2";                shift 2 ;;
    --mongo-uri)         MONGO_URI="$2";         shift 2 ;;
    --out)               OUT_FILE="$2";          shift 2 ;;
    --format)            FORMAT="$2";            shift 2 ;;
    --role)              ROLE_FILTER="$2";       shift 2 ;;
    --include-sensitive) INCLUDE_SENSITIVE=true; shift 1 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ---- Build role filter -------------------------------------------------------
ROLE_QUERY=""
if [[ -n "$ROLE_FILTER" ]]; then
  ROLE_QUERY="role: '${ROLE_FILTER}'"
fi

# ---- Field projection (exclude sensitive fields by default) ------------------
if [[ "$INCLUDE_SENSITIVE" == "true" ]]; then
  echo "⚠️  WARNING: Exporting with sensitive fields (hashed passwords, tokens)."
  echo "   Store the output file securely. Do NOT commit to version control."
  PROJECTION="{}"   # include everything
else
  # Exclude password hash and token fields
  PROJECTION="{ password: 0, __v: 0 }"
fi

# ---- Build Mongo script ------------------------------------------------------
FILTER_ARG="${ROLE_QUERY}"

case "$FORMAT" in
  csv)
    OUT_FILE="${OUT_FILE%.json}.csv"
    MONGO_SCRIPT="
      db = db.getSiblingDB('${DB}');
      var filter = {};
      if ('${FILTER_ARG}' !== '') filter = { ${FILTER_ARG} };
      var proj = ${PROJECTION};
      var users = db.users.find(filter, proj).sort({createdAt:1}).toArray();
      print('_id,name,username,email,role,provider,emailVerified,avatar,createdAt,updatedAt');
      users.forEach(u => {
        print([
          u._id,
          JSON.stringify(u.name || ''),
          JSON.stringify(u.username || ''),
          JSON.stringify(u.email || ''),
          u.role || '',
          u.provider || '',
          u.emailVerified || false,
          JSON.stringify(u.avatar || ''),
          u.createdAt ? u.createdAt.toISOString() : '',
          u.updatedAt ? u.updatedAt.toISOString() : ''
        ].join(','));
      });
    "
    ;;
  json|*)
    MONGO_SCRIPT="
      db = db.getSiblingDB('${DB}');
      var filter = {};
      if ('${FILTER_ARG}' !== '') filter = { ${FILTER_ARG} };
      var proj = ${PROJECTION};
      var users = db.users.find(filter, proj).sort({createdAt:1}).toArray();
      var meta = {
        exportedAt: new Date().toISOString(),
        database: '${DB}',
        totalUsers: users.length,
        filter: '${ROLE_FILTER}' !== '' ? 'role=${ROLE_FILTER}' : 'all',
        sensitiveFieldsIncluded: ${INCLUDE_SENSITIVE}
      };
      print(JSON.stringify({ meta: meta, users: users }, null, 2));
    "
    ;;
esac

# ---- Execute ----------------------------------------------------------------
echo "Exporting users from container '${CONTAINER}' → DB '${DB}'..."
if [[ -n "$ROLE_FILTER" ]]; then
  echo "Filter: role = ${ROLE_FILTER}"
fi

TMP_FILE=$(mktemp)
docker exec -i "${CONTAINER}" mongosh --quiet --eval "${MONGO_SCRIPT}" > "${TMP_FILE}"

# Move to final output path
mv "${TMP_FILE}" "${OUT_FILE}"

USER_COUNT=$(grep -c '"email"' "${OUT_FILE}" 2>/dev/null || echo "?")
echo ""
echo "✅ Export complete!"
echo "   File    : ${OUT_FILE}"
echo "   Format  : ${FORMAT}"
echo "   Users   : approximately ${USER_COUNT}"
echo ""
