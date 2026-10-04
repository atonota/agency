# ops — Agency sunucu yayını (Hetzner) · çoklu alan adı

Bu klasör sitenin **Hetzner sunucusundaki** yayınını tanımlar. Uygulama kodu, build ve GitHub Pages yayını
(`.github/workflows/pages.yml`) bu klasörden etkilenmez.

```
git push main → GitHub Actions "build" (npm ci + tsc + vite build) → GitHub Pages
Sunucu: agency-update.timer (2 dk) → "build" job'ı success olan son commit
        → node:24-alpine konteynerinde npm ci + build → /opt/agency/releases/<sha> → current (atomik symlink)
Caddy:  <her alan adı> (public, TLS) → aynı current/   (agency.titanlar.com, cronbi.com, …)
```
- CI'dan geçmeyen commit yayınlanmaz; sunucudaki build başarısızsa mevcut sürüm kalır (`/opt/agency/state/failed`).
- Sunucu GitHub'a sadece dışarı doğru bağlanır; secret/webhook yok. Son 3 sürüm saklanır.
- TLS: her alan adı için Let's Encrypt TLS-ALPN-01 (443); DNS sağlayıcı token'ı gerekmez. Cloudflare'de kayıt **DNS only** olmalı.
- Tek build, çok alan adı: alan adları `/opt/agency/state/domains` listesinde; her biri için `/etc/caddy/sites/<domain>.caddy` (şablon `caddy/site.caddy.tmpl`).
- Build dosya adları hash'siz (`assets/app.js`) → tüm yanıtlar `Cache-Control: no-cache` (ETag ile doğrulanır).

## Kurulum (sunucuda, root)
```bash
git clone https://github.com/atonota/agency.git /opt/agency/repo     # ilk kez
bash /opt/agency/repo/ops/setup.sh agency.titanlar.com
```

## Yeni alan adı ekleme (clone yayını)
1. DNS: `A <domain> → 195.201.105.107` (Cloudflare ise DNS only / gri bulut)
2. Sunucuda:
```bash
cd /opt/agency/repo && git pull && bash ops/setup.sh cronbi.com
```
Aynı build yeni alan adında yayına çıkar; SSL otomatik alınır. Kaldırmak: `bash ops/setup.sh --remove cronbi.com`.
Argümansız `bash ops/setup.sh` kayıtlı tüm alan adlarını yeniden uygular.

## İşletim
| İş | Komut |
|---|---|
| Yayındaki sürüm | `cat /opt/agency/state/deployed` |
| Güncelleme kaydı | `journalctl -u agency-update --since today` |
| Hemen güncelle | `systemctl start agency-update.service` |
| Geri al / sabitle | `echo <sha> > /opt/agency/state/pin` → hemen güncelle |
| Sabitlemeyi kaldır | `rm /opt/agency/state/pin` |
| Başarısız sürümü yeniden dene | `rm /opt/agency/state/failed` → hemen güncelle |
| Caddy ayarı değişince | `cd /opt/agency/repo && git pull && bash ops/setup.sh` (tüm alan adları) |
| Kayıtlı alan adları | `cat /opt/agency/state/domains` |
