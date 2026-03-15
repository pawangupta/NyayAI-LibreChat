#!/bin/bash
# =============================================================================
# NyayAI / LibreChat - List Users from MongoDB
# Usage: ./list_users.sh [OPTIONS]
#
# Options:
#   --container   Docker container name (default: chat-mongodb)
#   --db          MongoDB database name (default: LibreChat)
#   --mongo-uri   Full MongoDB URI (overrides --container/--db)
#                 e.g. mongodb://user:pass@localhost:27017/LibreChat
#   --role        Filter by role: USER or ADMIN
#   --format      Output format: table (default) | json | csv
# =============================================================================

set -euo pipefail

# ---- Defaults ---------------------------------------------------------------
CONTAINER="chat-mongodb"
DB="LibreChat"
MONGO_URI=""
ROLE_FILTER=""
FORMAT="table"

# ---- Argument parsing -------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --container) CONTAINER="$2"; shift 2 ;;
    --db)        DB="$2";        shift 2 ;;
    --mongo-uri) MONGO_URI="$2"; shift 2 ;;
    --role)      ROLE_FILTER="$2"; shift 2 ;;
    --format)    FORMAT="$2";    shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ---- Build role filter -------------------------------------------------------
# Build a proper JS object fragment: either {} or {role:'X'}
if [[ -n "$ROLE_FILTER" ]]; then
  ROLE_QUERY="{ role: '${ROLE_FILTER}' }"
else
  ROLE_QUERY="{}"
fi

# ---- Choose output format ---------------------------------------------------
case "$FORMAT" in
  json)
    MONGO_SCRIPT="
      db = db.getSiblingDB('${DB}');
      db.users.find(${ROLE_QUERY}, {
        name:1, username:1, email:1, role:1, provider:1,
        company_name:1, company_slug:1,
        emailVerified:1, createdAt:1, updatedAt:1
      }).sort({createdAt:1}).forEach(u => printjson(u));
    "
    ;;
  csv)
    MONGO_SCRIPT="
      db = db.getSiblingDB('${DB}');
      print('_id,name,username,email,role,provider,company_name,company_slug,emailVerified,createdAt');
      db.users.find(${ROLE_QUERY}, {
        name:1, username:1, email:1, role:1, provider:1,
        company_name:1, company_slug:1, emailVerified:1, createdAt:1
      }).sort({createdAt:1}).forEach(u => {
        print([
          u._id,
          u.name || '',
          u.username || '',
          u.email || '',
          u.role || '',
          u.provider || '',
          u.company_name || '',
          u.company_slug || '',
          u.emailVerified || false,
          u.createdAt ? u.createdAt.toISOString() : ''
        ].join(','));
      });
    "
    ;;
  table|*)
    MONGO_SCRIPT="
      db = db.getSiblingDB('${DB}');
      var users = db.users.find(${ROLE_QUERY}, {
        name:1, username:1, email:1, role:1, provider:1,
        company_name:1, company_slug:1, createdAt:1
      }).sort({createdAt:1}).toArray();

      var total = users.length;
      print('');
      print('='.repeat(140));
      print(' LibreChat Users  (DB: ${DB})');
      if ('${ROLE_FILTER}' !== '') print(' Filter: role = ${ROLE_FILTER}');
      print('='.repeat(140));
      print(
        'No. | ' +
        'Name'.padEnd(22) + '| ' +
        'Username'.padEnd(18) + '| ' +
        'Email'.padEnd(32) + '| ' +
        'Role'.padEnd(8) + '| ' +
        'Provider'.padEnd(10) + '| ' +
        'Company'.padEnd(20) + '| ' +
        'Created'
      );
      print('-'.repeat(140));
      users.forEach((u, i) => {
        var created = u.createdAt ? u.createdAt.toISOString().split('T')[0] : 'N/A';
        print(
          String(i+1).padStart(3) + ' | ' +
          (u.name || '').substring(0,20).padEnd(22) + '| ' +
          (u.username || '').substring(0,16).padEnd(18) + '| ' +
          (u.email || '').substring(0,30).padEnd(32) + '| ' +
          (u.role || '').padEnd(8) + '| ' +
          (u.provider || '').padEnd(10) + '| ' +
          (u.company_name || 'N/A').substring(0,18).padEnd(20) + '| ' +
          created
        );
      });
      print('-'.repeat(140));
      print('Total: ' + total + ' user(s)');
      print('');
    "
    ;;
esac

# ---- Execute ----------------------------------------------------------------
if [[ -n "$MONGO_URI" ]]; then
  echo "Connecting via URI to ${DB}..."
  mongosh --quiet "$MONGO_URI" --eval "$MONGO_SCRIPT"
else
  echo "Connecting to container: ${CONTAINER} -> ${DB}..."
  docker exec -i "${CONTAINER}" mongosh --quiet --eval "$MONGO_SCRIPT"
fi
