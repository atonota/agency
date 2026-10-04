#!/usr/bin/env bash
# atonota/agency main dalındaki son commit'i, GitHub Actions "build" job'ı başarılıysa build edip yayınlar.
# agency-update.timer 2 dakikada bir çalıştırır. Elle çalıştırmak güvenlidir.
#   Sabitleme / geri alma: commit SHA'yı $BASE/state/pin dosyasına yaz. Silince main'i takip eder.
# Çalışma dosyaları repo dışında: $BASE (varsayılan /opt/agency) → src/, releases/, current, state/
set -euo pipefail
BASE="${AGENCY_BASE:-/opt/agency}"
REPO_URL=https://github.com/atonota/agency.git
API=https://api.github.com/repos/atonota/agency
CHECK_NAME=build
NODE_IMAGE=node:24-alpine
SRC="$BASE/src"; REL="$BASE/releases"; mkdir -p "$BASE/state" "$REL"
exec 9>"$BASE/state/lock"; flock -n 9 || { echo "başka bir güncelleme çalışıyor"; exit 0; }

[ -d "$SRC/.git" ] || git clone --quiet "$REPO_URL" "$SRC"
git -C "$SRC" fetch --quiet origin main
if [ -s "$BASE/state/pin" ]; then SHA=$(cat "$BASE/state/pin"); else SHA=$(git -C "$SRC" rev-parse origin/main); fi
CUR=$(cat "$BASE/state/deployed" 2>/dev/null || true)
[ "$SHA" = "$CUR" ] && exit 0
[ "$SHA" = "$(cat "$BASE/state/failed" 2>/dev/null || true)" ] && exit 0

# CI kapısı: "build" job'ı bu commit için success olmalı (pin'li sürümde atlanır)
if [ ! -s "$BASE/state/pin" ]; then
  C=$(curl -fsS -H 'Accept: application/vnd.github+json' "$API/commits/$SHA/check-runs?check_name=$CHECK_NAME" \
      | python3 -c "import json,sys;r=json.load(sys.stdin)['check_runs'];print(r[0]['status']+':'+str(r[0]['conclusion']) if r else 'none')") \
      || { echo "GitHub API'ye ulaşılamadı, sonra denenecek"; exit 0; }
  case "$C" in
    completed:success) ;;
    completed:*) echo "${SHA:0:12} CI başarısız ($C), yayınlanmıyor"; echo "$SHA" > "$BASE/state/failed"; exit 0;;
    *) echo "${SHA:0:12} CI henüz bitmedi ($C)"; exit 0;;
  esac
fi

echo "build: ${SHA:0:12}"
git -C "$SRC" checkout --quiet --detach "$SHA"
OUT="$REL/$SHA"; rm -rf "$OUT"
# npm önbelleği kalıcı volume'da (her build'de baştan indirmesin)
if docker run --rm -v "$SRC:/src:ro" -v "$REL:/out" -v agency-npm-cache:/root/.npm "$NODE_IMAGE" \
     sh -c "cp -r /src /tmp/w && cd /tmp/w && rm -rf node_modules dist && npm ci --no-audit --no-fund --loglevel=error && npm run build && cp -r dist /out/$SHA"; then
  [ -f "$OUT/index.html" ] || { echo "dist/index.html yok"; echo "$SHA" > "$BASE/state/failed"; exit 1; }
  chmod -R a+rX "$OUT"
  ln -sfn "$OUT" "$BASE/current.new" && mv -T "$BASE/current.new" "$BASE/current"
  echo "$SHA" > "$BASE/state/deployed"; rm -f "$BASE/state/failed"
  ls -1dt "$REL"/*/ | tail -n +4 | xargs -r rm -rf   # son 3 sürümü tut
  echo "yayınlandı: ${SHA:0:12}"
else
  echo "${SHA:0:12} build başarısız, mevcut sürüm (${CUR:0:12}) korunuyor"; echo "$SHA" > "$BASE/state/failed"; exit 1
fi
