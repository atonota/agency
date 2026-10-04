#!/usr/bin/env bash
# agency.titanlar.com — public statik site (Vite/React). Kaynak: github.com/atonota/agency
# Akış: main'e push → GitHub Actions "build" → sunucu timer'ı 2 dk içinde CI'dan geçen commit'i
#        Node 24 konteynerinde npm ci + build eder → atomik olarak yayınlar. Başarısız build yayınlanmaz.
# Önkoşul: Docker, host Caddy (common snippet'i), UFW. Diğer projelerden bağımsızdır.
# Kullanım (root):
#   git clone https://github.com/atonota/agency.git /opt/agency/repo
#   bash /opt/agency/repo/ops/setup.sh        — tekrar çalıştırılabilir
set -euo pipefail
OPS="$(cd "$(dirname "$0")" && pwd)"
BASE="${AGENCY_BASE:-/opt/agency}"; export AGENCY_BASE="$BASE"
DOMAIN=agency.titanlar.com
log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[!] %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m[x] %s\033[0m\n' "$*"; exit 1; }
setenv() { touch "$1"; grep -q "^$2=" "$1" && sed -i "s|^$2=.*|$2=$3|" "$1" || echo "$2=$3" >> "$1"; }

[ "$(id -u)" -eq 0 ] || die "root olarak çalıştır"
for c in docker caddy ufw git curl python3 flock; do command -v $c >/dev/null || die "$c yok"; done

log "1/5 Public erişim: PUBLIC_IP + UFW 443"
CENV=/etc/caddy/caddy.env
PUB=$(grep -s '^PUBLIC_IP=' "$CENV" | cut -d= -f2-)
[ -n "$PUB" ] || { PUB=$(curl -fsS -4 https://ifconfig.me); setenv "$CENV" PUBLIC_IP "$PUB"; chown root:caddy "$CENV"; chmod 640 "$CENV"; }
r=$(dig +short "$DOMAIN" A | tail -1); [ "$r" = "$PUB" ] || warn "$DOMAIN → '$r'; beklenen $PUB (Cloudflare: DNS only / gri bulut olmalı)"
ufw allow 443/tcp comment 'public https' >/dev/null && echo "PUBLIC_IP=$PUB, UFW 443 açık"

log "2/5 İlk yayın (CI'dan geçen son commit; npm ci + build birkaç dakika sürebilir)"
bash "$OPS/update.sh" || true
[ -L "$BASE/current" ] || die "yayın oluşmadı — yukarıdaki çıktıya bakın (CI bitmemiş olabilir; birkaç dakika sonra tekrar çalıştırın)"
echo "Yayında: $(cut -c1-12 "$BASE/state/deployed")"

log "3/5 Caddy: $DOMAIN"
sed "s|__BASE__|$BASE|g" "$OPS/caddy/$DOMAIN.caddy.tmpl" > "/etc/caddy/sites/$DOMAIN.caddy"
chmod 644 "/etc/caddy/sites/$DOMAIN.caddy"
chmod o+x "$BASE" 2>/dev/null || true
install -o caddy -g caddy -m 640 /dev/null "/var/log/caddy/$DOMAIN.log" 2>/dev/null || true
runuser -u caddy -- env HOME=/var/lib/caddy $(grep -v '^#' "$CENV" | xargs) \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
chown -R caddy:caddy /var/log/caddy
systemctl restart caddy

log "4/5 Otomatik yayın zamanlayıcısı (2 dk)"
for u in service timer; do sed -e "s|__OPS__|$OPS|g" -e "s|__BASE__|$BASE|g" "$OPS/systemd/agency-update.$u" > "/etc/systemd/system/agency-update.$u"; done
systemctl daemon-reload && systemctl enable --now agency-update.timer >/dev/null
systemctl list-timers agency-update.timer --no-pager | head -2

log "5/5 Doğrulama (ilk SSL sertifikası birkaç saniye sürebilir)"
code() { curl -s -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:443:$PUB" "$@"; }
for i in $(seq 1 12); do [ "$(code "https://$DOMAIN/")" = 200 ] && break; sleep 5; done
[ "$(code "https://$DOMAIN/")" = 200 ] && echo "OK  https://$DOMAIN/ → 200" || warn "https://$DOMAIN/ 200 değil (sertifika: journalctl -u caddy | grep -i $DOMAIN)"
[ "$(code "https://$DOMAIN/assets/app.js")" = 200 ] && echo "OK  /assets/app.js → 200" || warn "/assets/app.js 200 değil"

cat <<MSG

Site: https://$DOMAIN/
Yayındaki sürüm:   cat $BASE/state/deployed
Güncelleme kaydı:  journalctl -u agency-update --since today
Hemen güncelle:    systemctl start agency-update.service
Geri al/sabitle:   echo <commit-sha> > $BASE/state/pin && systemctl start agency-update.service
MSG
