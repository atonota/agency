# Footer Engine — tasarım brifi (bölüm ajanları için)

Bu dosya, bölümleri paralel yeniden kuran ajanların ortak sözleşmesidir. Kurallar kesindir.

## Proje
- Vite + React 19 + TypeScript + **Mantine 9** (`@mantine/core`, `@mantine/hooks`), **Phosphor ikonları** (`@phosphor-icons/react`, adlar `XIcon` biçiminde: `ShieldCheckIcon`), **ECharts 6** (`src/ui/EChart.tsx` sarmalayıcısı, `echarts/core` ile; kullanılan seri tipini `EChart.tsx`'te `echarts.use([...])` listesine **eklemeyin** — orada kayıtlı olanlar: bar, radar, gauge, sunburst, scatter, grid, tooltip, legend, radar bileşeni. Başka seri gerekiyorsa (line, pie, heatmap, treemap, polar…) kendi dosyanızda `import * as echarts from 'echarts/core'; import { LineChart } from 'echarts/charts'; echarts.use([LineChart, PolarComponent])` diyerek kaydedin; `echarts.use` idempotenttir).
- **React Bits** bileşenleri `src/components/reactbits/` altında hazır (aşağıda envanter). Yeni bileşen gerekiyorsa `curl -s https://reactbits.dev/r/<Ad>-TS-CSS.json` ile çekip aynı klasöre koyabilirsiniz (bağımlılığı `gsap`, `motion`, `ogl` olanlar kurulu; başka npm paketi **kurmayın**).
- Dil: Türkçe. Marka yer tutucu: "MARKA".

## Motor sözleşmesi
- İçerik `src/content/<bölge>/<sıra>-<ad>.json`: `{ id, type, order, label, data }`. `type` → `src/engine.tsx` içindeki `REGISTRY`'de bir bileşen. **engine.tsx'e dokunmayın**; size verilen `type`'lar zaten kayıtlı.
- Renderer imzası: `export function X({ doc }: RendererProps<Data>)`; `doc.data` JSON'un `data`'sı. Tüm metin/veri JSON'dan gelir; TSX'e sabit içerik gömmeyin (etiket metinleri dahil).
- Aşama sistemi: JSON'daki öğeler `"tier": "z" | "o" | "e"` taşır (z = Gün 1, o = Büyüme, e = Kurumsal olgunluk). Motor, `tier` + (`label|title|name|code|city|question`) alanı olan her nesneyi sayar. Bileşende:
  ```tsx
  import { useTier, useEngine } from '../engine/core';
  const { props, dim, tier } = useTier(item.tier);   // props → elemana yayın: data-tier / data-dim / data-tags
  <a {...props} className="xx-row fe-tier-block">…</a>  // fe-tier-block: etiketler açıkken köşede renkli nokta
  <TierDot tier={item.tier} />                          // satır içi nokta (src/ui/primitives.tsx)
  ```
  `data-dim="true"` olan öğeler seçili aşamada gerekmeyenlerdir; global CSS onları soluklaştırır (siz ayrıca ele almayın). `useEngine()` → `{ manifest, stage, showTags }`; `manifest.tiers`, `manifest.totals`, `manifest.docs`, `manifest.zones`, `manifest.site.brand`.
- Yardımcılar: `src/ui/primitives.tsx` → `Eyebrow`, `MoreLink`, `TierDot`, `Reveal`; `src/ui/Hint.tsx` → `Hint` (kısaltma açılımı ipucu, `hint` alanı); `src/ui/Icon.tsx` → `<Icon name="…" />` (JSON'daki string ikon adları için; **Icon.tsx'i düzenlemeyin**, JSON'da yalnızca kayıtlı adları kullanın — liste: ChatCircleText Lifebuoy Headset ShieldCheck ArrowRight ArrowUpRight LinkedinLogo XLogo YoutubeLogo InstagramLogo FacebookLogo GithubLogo AppleLogo GooglePlayLogo DeviceMobile Buildings Stack Target BookOpen ChartLineUp TreeStructure Truck Lock ChatsCircle TerminalWindow SealCheck Cloud Scales Bank Leaf Handshake Globe HandHeart Medal Flag TrendUp MapPin Clock Phone Cookie CaretDown ArrowUp Sun Moon Database Translate Question Files Warning CheckCircle Copy Sparkle FileText Pulse Circle MonitorPlay Code Table Key UsersThree Bug ArrowsClockwise Brain ClockCounterClockwise ClipboardText Detective Wheelchair CreditCard ListChecks Info IdentificationCard). TSX içinde ikonları doğrudan `@phosphor-icons/react`'ten import edin.

## Görsel dil (kesin)
1. **Kutu yok.** Kart, panel, çerçeveli dikdörtgen kullanılmaz. Ayrım için ince çizgi (`1px solid var(--fe-line)`), tipografi hiyerarşisi, boşluk ve renk kullanılır. Tek istisna: "Olgunluk paneli" (referans dashboard tarzı; ilgili ajanın brifinde).
2. **Yazı boyutu en az 1rem (16px).** Eyebrow, rozet, chip, tooltip, tablo başlığı, grafik ekseni/etiketi, SVG `<text>`, mono etiket — hepsi ≥ 1rem. Mantine `size="xs|sm"` verilirse Badge/Chip yazısı küçülür; `size="md"` veya `"lg"` kullanın. `fz={…}` değerleri ≥ 16. ECharts `fontSize` ≥ 16. Küçük görünmesi gereken şeyler için boyut değil, renk (`--fe-muted`) ve ağırlık kullanın.
3. **Renkler yalnızca token'lardan**: `--fe-ground, --fe-footer, --fe-surface, --fe-surface-2, --fe-line, --fe-line-strong, --fe-ink, --fe-ink-2, --fe-muted, --fe-accent (#00ffbb koyu temada), --fe-accent-ink, --fe-glow, --fe-tier-z/--fe-tier-o/--fe-tier-e, --fe-ok, --fe-mono`. Mantine: `var(--mantine-primary-color-filled)` = vurgu. Açık ve koyu tema ikisi de çalışmalı; tasarım **koyu tema öncelikli** (kullanıcı koyu temada bakıyor). Sabit hex yazmayın (WebGL/canvas bileşenlerine renk geçirmek için `getComputedStyle(document.documentElement).getPropertyValue('--fe-accent')` okuyun; tema değişince yeniden okuyun — `useComputedColorScheme` bağımlılığı).
4. Tipografi: IBM Plex Sans (metin), IBM Plex Mono (eyebrow/kod/sayı). Büyük başlıklar `letter-spacing: -0.03em`, `text-wrap: balance`. Sayılar `font-variant-numeric: tabular-nums`.
5. Hareket: her bölümde en az bir **React Bits** bileşeni gerçekten görünür iş yapmalı (süs değil, içeriği taşıyan). `prefers-reduced-motion` açıkken statik alternatif. Hover ve tıklama etkileşimleri istenir.
6. Erişilebilirlik: klavye odağı görünür (`:focus-visible`), `aria-label`, anlamlı HTML (`nav`, `address`, `button`).
7. Duyarlılık: 1440px ana hedef; 1024 ve 400px'de kırılmamalı; yatay kaydırma yasak (tek istisna kendi kabındaki geniş grafik/tablo).

## Dosya sahipliği (çakışma önleme)
- Her ajan **yalnızca** kendisine verilen renderer/JSON/CSS dosyalarını yazar. `src/styles/global.css`, `src/theme.ts`, `src/engine.tsx`, `src/engine/core.tsx`, `src/ui/Icon.tsx`, `src/content/_config/*` ve başkasının dosyaları **dokunulmaz**.
- Stil: kendi dosyanız `src/styles/<bölüm>.css`, renderer'ın başında `import '../styles/<bölüm>.css'`. Sınıf adlarınız size verilen **önek** ile başlar (ör. `.pf-…`). Eski `.fe-…` sınıflarını (global.css'te hâlâ olanlar hariç: `.fe-eyebrow`, `.fe-eyebrow-accent`, `.fe-h2`, `.fe-display`, `.fe-textlink`, `.fe-more`, `.fe-num`, `.fe-pulse`, `.fe-tier-block`, `.fe-legend-dot`) kullanmayın.
- Footer bantlarının dış boşluğu: `.fe-band[data-type='<type>'] { padding-block: … }` kuralını **kendi CSS'inizde** yazabilirsiniz (global'de varsayılan 40px).
- React Bits bileşen dosyalarını düzenlemeyin; görünümü kendi CSS'inizden geçersiz kılın (`.xx .some-reactbits-class { … }`).

## React Bits envanteri (`src/components/reactbits/`)
- `FlowingMenu` — tam genişlik satır menüsü; hover'da satırın içinde marquee akar. props: `items: {link, text, image}[]`, `speed`, `textColor`, `bgColor`, `marqueeBgColor`, `marqueeTextColor`, `borderColor`. (`image` marquee'de `<img>`; data-URI SVG verilebilir.)
- `ScrollVelocity` — kaydırma hızına göre hızlanan marquee metin. props: `texts: ReactNode[]`, `velocity`, `numCopies`, `className`, `parallaxClassName`, `scrollerClassName`.
- `TextType` — daktilo yazıp silen döngü. props: `text: string|string[]`, `typingSpeed`, `deletingSpeed`, `pauseDuration`, `loop`, `showCursor`, `cursorCharacter`, `textColors`, `as`, `className`, `startOnVisible`.
- `Stepper` + `Step` (named export) — çok adımlı akış; `initialStep`, `onStepChange`, `onFinalStepCompleted`, `backButtonText`, `nextButtonText`, `renderStepIndicator`, sınıf prop'ları. CSS: `Stepper.css` (koyu kutu stilleri var — kendi CSS'inizden geçersiz kılın).
- `ElectricBorder` — elektrik akımı gibi titreyen kenarlık. props: `color`, `speed`, `chaos`, `borderRadius`, `className`, `style`; children sarar.
- `TrueFocus` — cümledeki kelimeler arasında gezen odak çerçevesi; props: `sentence`, `separator`, `manualMode`, `blurAmount`, `borderColor`, `glowColor`, `animationDuration`, `pauseBetweenAnimations`.
- `AnimatedList` — kaydırmalı, klavye ile gezilen animasyonlu liste (`items: string[]`, `onItemSelect`, `showGradients`, `enableArrowNavigation`).
- `Cubes` — etkileşimli 3B küp ızgarası (hover'da eğilir, tıklamada dalga). props: `gridSize`, `cubeSize`, `maxAngle`, `radius`, `cellGap`, `borderStyle`, `faceColor`, `shadow`, `autoAnimate`, `rippleOnClick`, `rippleColor`, `rippleSpeed`.
- `LetterGlitch` — harf yağmuru/glitch canvas arka planı (`glitchColors`, `glitchSpeed`, `centerVignette`, `outerVignette`, `smooth`).
- `Counter` — haneleri kayarak dönen sayaç (`value`, `fontSize`, `places`, `gap`, `textColor`, `fontWeight`, `gradientFrom/To`).
- `CountUp` — sayarak artan sayı (`to`, `from`, `duration`, `separator`).
- `GradientText` — gradyan (isteğe bağlı animasyonlu) metin (`colors`, `animationSpeed`, `showBorder`).
- `DecryptedText` — şifre çözülür gibi yazılan metin (`text`, `animateOn: 'view'|'hover'`, `speed`, `sequential`, `revealDirection`, `characters`).
- `BlurText` — kelime/harf bazlı bulanıktan gelen başlık (`text`, `animateBy`, `direction`, `delay`, `animationFrom`, `animationTo`). Not: `animationFrom` opaklığını 0 yapmayın (≥ 0.3) — animasyon çalışmazsa metin görünür kalsın.
- `ShinyText`, `StarBorder`, `Magnet`, `SpotlightCard`, `GlareHover`, `LogoLoop`, `Dock`, `CircularText`, `RotatingText` (kararsız; kullanmayın), `AnimatedContent`, `Threads`, `LightRays` (ogl WebGL).
- Ek: `src/ui/IsoField.tsx` (etkileşimli isometric arka plan, bölge düzeyinde zaten var), `src/ui/IsoStack.tsx` (isometric katman yığını SVG), `src/ui/Seal.tsx` (dairesel mühür — küçük yazı içerir, 1rem kuralına uymaz; kullanılacaksa yeniden yazılmalı).

## Doğrulama
- Tip kontrolü (yalnızca kendi dosyalarınızı süzün): `npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -E "src/(renderers|styles|ui)/(…dosyalarınız…)"` — sıfır satır bekleniyor. Başkalarının dosyalarındaki hatalar sizi ilgilendirmez.
- Tarayıcı araçlarını ve dev sunucusunu **kullanmayın** (paylaşımlı kaynak); görsel doğrulama ana oturumda yapılır.
- Bitirirken JSON döndürün: `{ files: string[], reactbits: string[], echarts: string[], notes: string, risks: string }`.
