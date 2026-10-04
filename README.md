# Agency

Ajans sitesi taslağı. Çalışma footer'dan başladı: kurumsal bir footer'da ve Güven Merkezi'nde bulunan her öğenin hangi olgunluk aşamasında (Gün 1, Büyüme, Kurumsal olgunluk) gerektiğini gösteren, JSON içerikten beslenen bir motor.

Yayın: https://atonota.github.io/agency/

## Yığın

- Vite, React 19, TypeScript
- Mantine 9, Phosphor ikonları, ECharts 6
- Hareket: React Bits bileşenleri (`src/components/reactbits/`), GSAP, motion, ogl

## Yapı

- `src/content/<bölge>/<sıra>-<ad>.json`: içerik. Her dosya `{ id, type, order, label, data }` taşır.
- `src/engine.tsx`, `src/engine/core.tsx`: içerik dosyalarını toplayıp `type` alanına göre renderer'a bağlayan motor.
- `src/renderers/`: bölüm bileşenleri.
- `src/styles/`: tasarım token'ları (`global.css`) ve bölüm stilleri.
- `DESIGN-BRIEF.md`: görsel dil ve motor sözleşmesi.
- `research/`: footer bağlantı etiketleri araştırması (`build_menu.py`, `menu-items.json`).

## Komutlar

```bash
npm ci
npm run dev
npm run lint
npm run build
```

## Yayınlama

`main` dalına her push'ta `.github/workflows/pages.yml` projeyi derler ve GitHub Pages'e yayınlar.

## Lisans

Proje lisansı henüz belirlenmedi. `src/components/reactbits/` altındaki bileşenler React Bits'ten alınmıştır ve `REACT-BITS-LICENSE.md` koşullarına tabidir.
