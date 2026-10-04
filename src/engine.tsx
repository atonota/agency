/**
 * engine.tsx — JSON tabanlı footer motoru
 *
 * 1. DEDEKTÖR   src/content/**\/*.json altındaki tüm dosyaları derleme anında bulur
 *               (Vite import.meta.glob). Yeni dosya eklemek için kod değişmez.
 * 2. DOĞRULAMA  Her dosyanın zarfını (id, type, data) kontrol eder; hatalı olanı atlar ve raporlar.
 * 3. SAYAÇ      Her JSON'un içinde `tier` taşıyan öğeleri sayar → olgunluk grafikleri bunu kullanır.
 * 4. KAYIT      `type` → React bileşeni eşlemesi. Tanınmayan tip Fallback ile yine de gösterilir.
 * 5. RENDER     Klasör adı = bölge (zone). Bölgeler site.json'daki sırayla, dosyalar `order` ile dizilir.
 */
import { useEffect, useMemo, type ComponentType } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Anchor, Box, Container, Group, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  EngineContext,
  useEngine,
  type ContentDoc,
  type DetectedDoc,
  type Manifest,
  type RendererProps,
  type SiteConfig,
  type Tier,
  type TierKey,
  type Zone,
} from './engine/core';
import { Reveal } from './ui/primitives';
import { ZoneBackground } from './ui/ZoneBackground';
import { SparkLayer } from './ui/SparkLayer';
import { PlanHero } from './renderers/PlanHero';
import { MaturityDashboard } from './renderers/MaturityDashboard';
import { ActionCards } from './renderers/ActionCards';
import { BrandBlock } from './renderers/BrandBlock';
import { LinkColumns } from './renderers/LinkColumns';
import { ProductCards } from './renderers/ProductCards';
import { LogoStrip } from './renderers/LogoStrip';
import { GroupStrip } from './renderers/GroupStrip';
import { Memberships } from './renderers/Memberships';
import { Certifications } from './renderers/Certifications';
import { Offices } from './renderers/Offices';
import { Registry } from './renderers/Registry';
import { LegalBar } from './renderers/LegalBar';
import { Fallback } from './renderers/Fallback';
import { TrustLine } from './renderers/TrustLine';
import { TrustQuestions, TrustAreas, ComplianceMatrix, CertRoadmap, StatusBoard } from './renderers/Trust';
import { TrustHero } from './renderers/TrustHero';
import { Procurement } from './renderers/Procurement';
import { EvidenceChain } from './renderers/EvidenceChain';
import { AccessLayers } from './renderers/AccessLayers';
import { Logo } from './renderers/BrandBlock';

/* ------------------------------------------------------------------ */
/*  1 · Dedektör                                                        */
/* ------------------------------------------------------------------ */

const SOURCES = import.meta.glob('./content/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

/** Ayar dosyaları render edilmez; motoru yapılandırır. */
const CONFIG_TYPES = new Set(['site', 'tiers']);

/* ------------------------------------------------------------------ */
/*  4 · Renderer kaydı — yeni bir içerik tipi = buraya bir satır        */
/* ------------------------------------------------------------------ */

export const REGISTRY: Record<string, ComponentType<RendererProps>> = {
  'plan-hero': PlanHero,
  'maturity-dashboard': MaturityDashboard,
  'action-cards': ActionCards,
  'brand-block': BrandBlock,
  'link-columns': LinkColumns,
  'product-cards': ProductCards,
  'logo-strip': LogoStrip,
  'group-strip': GroupStrip,
  memberships: Memberships,
  certifications: Certifications,
  offices: Offices,
  registry: Registry,
  'legal-bar': LegalBar,
  'trust-line': TrustLine,
  'trust-hero': TrustHero,
  'trust-questions': TrustQuestions,
  'trust-areas': TrustAreas,
  'compliance-matrix': ComplianceMatrix,
  'cert-roadmap': CertRoadmap,
  'status-board': StatusBoard,
  procurement: Procurement,
  'evidence-chain': EvidenceChain,
  'access-layers': AccessLayers,
};

/* ------------------------------------------------------------------ */
/*  3 · Aşama sayacı                                                    */
/* ------------------------------------------------------------------ */

const TIER_KEYS: TierKey[] = ['z', 'o', 'e'];
const ITEM_NAME_KEYS = ['label', 'title', 'name', 'code', 'city', 'question'];

/** JSON ağacında `tier` + ad alanı taşıyan her nesneyi bir öğe sayar (iç içe yapılar dahil). */
function countTiers(node: unknown, acc: Record<TierKey, number> = { z: 0, o: 0, e: 0 }) {
  if (Array.isArray(node)) node.forEach((n) => countTiers(n, acc));
  else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const tier = obj.tier as TierKey | undefined;
    if (tier && TIER_KEYS.includes(tier) && ITEM_NAME_KEYS.some((k) => typeof obj[k] === 'string')) acc[tier]++;
    Object.values(obj).forEach((v) => countTiers(v, acc));
  }
  return acc;
}

/* ------------------------------------------------------------------ */
/*  2 · Doğrulama + manifest                                            */
/* ------------------------------------------------------------------ */

function isDoc(x: unknown): x is ContentDoc {
  if (!x || typeof x !== 'object') return false;
  const d = x as Record<string, unknown>;
  return typeof d.id === 'string' && typeof d.type === 'string' && typeof d.data === 'object' && d.data !== null;
}

const DEFAULT_SITE: SiteConfig = {
  brand: { name: 'MARKA', legalName: '', descriptor: '', tagline: '' },
  zones: [],
  copyright: '',
  mersis: '',
};

export function detect(sources: Record<string, unknown> = SOURCES): Manifest {
  const errors: Manifest['errors'] = [];
  const docs: DetectedDoc[] = [];
  const seen = new Set<string>();

  for (const [path, raw] of Object.entries(sources)) {
    const rel = path.replace(/^\.\/content\//, '');
    const parts = rel.split('/');
    const zone = parts.length > 1 ? parts[0] : 'root';
    const file = rel;

    if (!isDoc(raw)) {
      errors.push({ path: rel, message: 'Geçersiz zarf: id, type ve data alanları gerekli.' });
      continue;
    }
    const issues: string[] = [];
    if (seen.has(raw.id)) issues.push(`Yinelenen id: ${raw.id}`);
    seen.add(raw.id);

    const isConfig = CONFIG_TYPES.has(raw.type);
    const tierCounts = isConfig ? { z: 0, o: 0, e: 0 } : countTiers(raw.data);
    docs.push({
      ...raw,
      path,
      file,
      zone,
      order: typeof raw.order === 'number' ? raw.order : 999,
      label: raw.label ?? raw.id,
      status: isConfig ? 'config' : REGISTRY[raw.type] ? 'registered' : 'fallback',
      tierCounts,
      itemCount: tierCounts.z + tierCounts.o + tierCounts.e,
      issues,
    });
  }

  docs.sort((a, b) => a.zone.localeCompare(b.zone) || a.order - b.order || a.file.localeCompare(b.file));

  const site = (docs.find((d) => d.type === 'site')?.data as SiteConfig | undefined) ?? DEFAULT_SITE;
  const tiers = ((docs.find((d) => d.type === 'tiers')?.data as { tiers: Tier[] } | undefined)?.tiers ?? [
    { key: 'z', rank: 1, label: 'Gün 1', hint: '' },
    { key: 'o', rank: 2, label: 'Büyüme', hint: '' },
    { key: 'e', rank: 3, label: 'Kurumsal olgunluk', hint: '' },
  ]).slice().sort((a, b) => a.rank - b.rank);

  // Bölgeler: site.json'da tanımlı sıra, ardından tanımsız ama algılanan klasörler
  const renderable = docs.filter((d) => d.status !== 'config');
  const zoneKeys = [
    ...site.zones.map((z) => z.key),
    ...Array.from(new Set(renderable.map((d) => d.zone))).filter((k) => !site.zones.some((z) => z.key === k)),
  ];
  const zones: Zone[] = zoneKeys
    .map((key) => {
      const def = site.zones.find((z) => z.key === key);
      return { key, label: def?.label ?? key, as: def?.as ?? 'section', anchor: def?.anchor ?? key, background: def?.background, docs: renderable.filter((d) => d.zone === key) };
    })
    .filter((z) => z.docs.length > 0);

  const totals = renderable.reduce(
    (t, d) => ({ z: t.z + d.tierCounts.z, o: t.o + d.tierCounts.o, e: t.e + d.tierCounts.e, all: t.all + d.itemCount }),
    { z: 0, o: 0, e: 0, all: 0 },
  );

  if (import.meta.env.DEV) {
    console.info(`[engine] ${docs.length} JSON algılandı`, docs.map((d) => `${d.file} → ${d.type} (${d.status})`));
    errors.forEach((e) => console.warn(`[engine] ${e.path}: ${e.message}`));
  }

  return { docs, zones, errors, site, tiers, totals };
}

/* ------------------------------------------------------------------ */
/*  5 · Render                                                          */
/* ------------------------------------------------------------------ */

function RenderDoc({ doc }: { doc: DetectedDoc }) {
  const Cmp = REGISTRY[doc.type] ?? Fallback;
  return <Cmp doc={doc} />;
}

function ZoneView({ zone }: { zone: Zone }) {
  if (zone.as === 'footer') {
    return (
      <Box component="footer" id={zone.anchor} className="fe-footer" aria-label="Site alt bilgisi">
        <ZoneBackground bg={zone.background} />
        {zone.docs.map((doc, i) => (
          <Box key={doc.path} id={doc.id} className="fe-band" data-type={doc.type}>
            <Container size="xl">
              <Reveal delay={Math.min(i, 3) * 0.04}>
                <RenderDoc doc={doc} />
              </Reveal>
            </Container>
          </Box>
        ))}
        <Wordmark />
      </Box>
    );
  }
  return (
    <Box component="section" id={zone.anchor} className="fe-zone" data-zone={zone.key} aria-label={zone.label}>
      <ZoneBackground bg={zone.background} />
      <Container size="xl" className="fe-zone-inner">
        {zone.docs.map((doc, i) => (
          <Box key={doc.path} id={doc.id} className="fe-zone-item" data-type={doc.type}>
            {i === 0 ? <RenderDoc doc={doc} /> : <Reveal><RenderDoc doc={doc} /></Reveal>}
          </Box>
        ))}
      </Container>
    </Box>
  );
}

/** Bölgeler arası yapışkan gezinme — site.json'daki bölgelerden üretilir. */
function TopNav({ zones }: { zones: Zone[] }) {
  const { manifest } = useEngine();
  return (
    <Box component="header" className="fe-topnav">
      <Container size="xl">
        <Group justify="space-between" h={56} wrap="nowrap">
          <Group gap={10} wrap="nowrap">
            <Logo size={26} />
            <Text fw={700} fz={16} lts="0.04em">{manifest.site.brand.name}</Text>
          </Group>
          <Group gap={4} component="nav" aria-label="Bölümler" wrap="nowrap" className="fe-topnav-links">
            {zones.map((z) => (
              <Anchor key={z.key} href={`#${z.anchor}`} underline="never" className="fe-topnav-link" data-zone={z.key}>{z.label}</Anchor>
            ))}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}

function Wordmark() {
  const { manifest } = useEngine();
  return (
    <Box className="fe-wordmark" aria-hidden="true">
      <Text component="span">{manifest.site.brand.name}</Text>
    </Box>
  );
}

/** Grafikler ve şeritler çizildikçe sayfa uzar; animasyon tetik noktalarını güncel tutar. */
function useScrollTriggerRefresh() {
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __ST: typeof ScrollTrigger }).__ST = ScrollTrigger;
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 120);
    });
    ro.observe(document.body);
    return () => { clearTimeout(t); ro.disconnect(); };
  }, []);
}

export function Engine() {
  useScrollTriggerRefresh();
  const manifest = useMemo(() => detect(), []);
  const [stage, setStage] = useLocalStorage<number>({ key: 'fe-stage', defaultValue: 3 });
  const [showTags, setShowTags] = useLocalStorage<boolean>({ key: 'fe-tags', defaultValue: true });

  const value = useMemo(
    () => ({ manifest, stage, setStage, showTags, setShowTags }),
    [manifest, stage, setStage, showTags, setShowTags],
  );

  return (
    <EngineContext.Provider value={value}>
      <Box className="fe-page" data-tags={showTags || undefined}>
        <TopNav zones={manifest.zones} />
        {manifest.zones.map((z) => <ZoneView key={z.key} zone={z} />)}
      </Box>
      <SparkLayer />
    </EngineContext.Provider>
  );
}
