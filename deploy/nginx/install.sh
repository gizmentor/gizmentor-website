#!/usr/bin/env bash
# Adds gizmentor.com's caching and security headers to nginx. Run on the server, from the
# site's checkout:   sudo bash /opt/gizmentor-website/deploy/nginx/install.sh
# Safe to run again. Backs up the site's config first, and puts everything back if
# `nginx -t` fails, so a mistake never takes the site down.
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
HERE="$(cd "$(dirname "$0")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"

# The enabled site file that serves gizmentor.com.
SITE="$(grep -lE 'server_name[^;]*gizmentor\.com' /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf 2>/dev/null | grep -v gizmentor-cache.conf | head -1 || true)"
[ -n "$SITE" ] || { echo "No nginx config with server_name gizmentor.com found."; exit 1; }
SITE="$(readlink -f "$SITE")"
echo "Site config: $SITE"

# Back up everything this script may change, so a failed test puts it all back exactly.
CACHE=/etc/nginx/conf.d/gizmentor-cache.conf
SNIPPET=/etc/nginx/snippets/gizmentor-headers.conf
cp -a "$SITE" "$SITE.bak-$STAMP"
for f in "$CACHE" "$SNIPPET"; do [ -e "$f" ] && cp -a "$f" "$f.bak-$STAMP"; done
restore() {
  cp -a "$SITE.bak-$STAMP" "$SITE"
  for f in "$CACHE" "$SNIPPET"; do
    if [ -e "$f.bak-$STAMP" ]; then mv -f "$f.bak-$STAMP" "$f"; else rm -f "$f"; fi
  done
}
install -m 644 "$HERE/gizmentor-cache.conf" "$CACHE"
install -d /etc/nginx/snippets
install -m 644 "$HERE/gizmentor-headers.conf" "$SNIPPET"

# Include the snippet once, right after each gizmentor.com server_name line.
if ! grep -q 'snippets/gizmentor-headers.conf' "$SITE"; then
  sed -i -E '/server_name[^;]*gizmentor\.com[^;]*;/a\    include snippets/gizmentor-headers.conf;' "$SITE"
fi

if nginx -t; then
  systemctl reload nginx
  rm -f "$CACHE.bak-$STAMP" "$SNIPPET.bak-$STAMP"
  echo "Done: headers are live. Previous site config kept as $SITE.bak-$STAMP"
else
  echo "nginx -t failed; putting everything back."
  restore
  nginx -t && systemctl reload nginx
  exit 1
fi

# Locations with their own add_header lines do not inherit the server's; say so.
if grep -nE '^\s*location' -A20 "$SITE" | grep -q 'add_header'; then
  echo "Note: a location block in $SITE has its own add_header lines; the new headers do not"
  echo "apply inside it. Add 'include snippets/gizmentor-headers.conf;' to that block too."
fi
