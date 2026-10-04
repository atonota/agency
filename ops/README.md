# ops — https://agency.titanlar.com sunucu yayını (Hetzner)

Bu klasör sitenin **Hetzner sunucusundaki** yayınını tanımlar. Uygulama kodu, build ve GitHub Pages yayını
(`.github/workflows/pages.yml`) bu klasörden etkilenmez.

```
git push main → GitHub Actions "build" (npm ci + tsc + vite build) → GitHub Pages
Sunucu: agency-update.timer (2 dk) → "build" job'ı success olan son commit
        → node:24-alpine konteynerinde npm ci + build → /opt/agency/releases/<sha> → current (atomik symlink)
Caddy:  agency.titanlar.com (public, TLS) → current/
```
- CI'dan geçmeyen commit yayınlanmaz; sunucudaki build başarısızsa mevcut sürüm kalır (`/opt/agency/state/failed`).
- Sunucu GitHub'a sadece dışarı doğru bağlanır; secret/webhook yok. Son 3 sürüm saklanır.
- TLS: `titanlar.com` ayrı DNS zone'u olduğundan Let's Encrypt TLS-ALPN-01 (443) kullanılır; DNS kaydı **DNS only** olmalı.
- Build dosya adları hash'siz (`assets/app.js`) → tüm yanıtlar `Cache-Control: no-cache` (ETag ile doğrulanır).

## Kurulum (sunucuda, root)
```bash
git clone https://github.com/atonota/agency.git /opt/agency/repo
bash /opt/agency/repo/ops/setup.sh
```

## İşletim
| İş | Komut |
|---|---|
| Yayındaki sürüm | `cat /opt/agency/state/deployed` |
| Güncelleme kaydı | `journalctl -u agency-update --since today` |
| Hemen güncelle | `systemctl start agency-update.service` |
| Geri al / sabitle | `echo <sha> > /opt/agency/state/pin` → hemen güncelle |
| Sabitlemeyi kaldır | `rm /opt/agency/state/pin` |
| Başarısız sürümü yeniden dene | `rm /opt/agency/state/failed` → hemen güncelle |
| Caddy ayarı değişince | `cd /opt/agency/repo && git pull && bash ops/setup.sh` |
