#!/usr/bin/env bash
# Build and deploy the study page to REDACTED-CT (nginx static site).
# Override any of these via environment, e.g. REMOTE_PATH=/var/www/html/index.html ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

REMOTE="${REMOTE:-root@REDACTED-HOST}"
KEY="${KEY:-$HOME/.ssh/REDACTED-KEY}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/html/az900/index.html}"
URL="${URL:-http://REDACTED-HOST/az900/}"
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes "$REMOTE")

python3 build.py

"${SSH[@]}" "mkdir -p '$(dirname "$REMOTE_PATH")'"
scp -q -i "$KEY" -o IdentitiesOnly=yes dist/index.html "$REMOTE:$REMOTE_PATH.new"
"${SSH[@]}" "mv -f '$REMOTE_PATH.new' '$REMOTE_PATH' && nginx -t 2>&1 | tail -1 && systemctl reload nginx"

local_md5=$(md5sum dist/index.html | cut -d' ' -f1)
remote_md5=$("${SSH[@]}" "md5sum '$REMOTE_PATH'" | cut -d' ' -f1)
[ "$local_md5" = "$remote_md5" ] || { echo "deploy: FAIL - md5 mismatch local=$local_md5 remote=$remote_md5" >&2; exit 1; }

live_md5=$(python3 -c "import urllib.request,hashlib,sys; print(hashlib.md5(urllib.request.urlopen(sys.argv[1]+'?v=deploy').read()).hexdigest())" "$URL")
[ "$local_md5" = "$live_md5" ] || { echo "deploy: FAIL - live page at $URL differs (md5 $live_md5)" >&2; exit 1; }

echo "deploy: OK - $URL serves $local_md5"
