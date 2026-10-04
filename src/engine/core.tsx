import { createContext, useContext } from 'react';

/* ------------------------------------------------------------------ */
/*  İçerik sözleşmesi — her JSON dosyası bu zarfı taşır                */
/* ------------------------------------------------------------------ */

export type TierKey = 'z' | 'o' | 'e';

export interface ContentDoc<T = unknown> {
  id: string;
  type: string;
  order?: number;
  label?: string;
  /** İçerik modeli (kurumsal bilgi sistemi alanları) */
  owner?: string;
  reviewedAt?: string;
  expiresAt?: string;
  lifecycle?: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'controlled';
  data: T;
}

export interface DetectedDoc<T = unknown> extends ContentDoc<T> {
  path: string;
  file: string;
  zone: string;
  order: number;
  label: string;
  status: 'config' | 'registered' | 'fallback';
  itemCount: number;
  tierCounts: Record<TierKey, number>;
  issues: string[];
}

export interface Tier {
  key: TierKey;
  rank: number;
  label: string;
  hint: string;
  icon?: string;
}

export interface Zone {
  key: string;
  label: string;
  as: 'section' | 'footer';
  anchor: string;
  background?: import('../ui/ZoneBackground').ZoneBg;
  docs: DetectedDoc[];
}

export interface SiteConfig {
  brand: { name: string; legalName: string; descriptor: string; tagline: string };
  zones: { key: string; label: string; as?: 'section' | 'footer'; anchor?: string; background?: import('../ui/ZoneBackground').ZoneBg }[];
  copyright: string;
  mersis: string;
}

export interface Manifest {
  docs: DetectedDoc[];
  zones: Zone[];
  errors: { path: string; message: string }[];
  site: SiteConfig;
  tiers: Tier[];
  totals: Record<TierKey, number> & { all: number };
}

export interface RendererProps<T = any> {
  doc: DetectedDoc<T>;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

export interface EngineState {
  manifest: Manifest;
  stage: number;
  setStage: (s: number) => void;
  showTags: boolean;
  setShowTags: (v: boolean) => void;
}

export const EngineContext = createContext<EngineState | null>(null);

export function useEngine(): EngineState {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine yalnızca <Engine> içinde kullanılabilir');
  return ctx;
}

/** Bir öğenin seçili aşamada soluklaşıp soluklaşmayacağını ve etiket durumunu döndürür. */
export function useTier(tier?: string) {
  const { manifest, stage, showTags } = useEngine();
  const t = manifest.tiers.find((x) => x.key === tier);
  const dim = !!t && t.rank > stage;
  return {
    tier: t,
    dim,
    props: tier
      ? { 'data-tier': tier, 'data-dim': dim ? 'true' : undefined, 'data-tags': showTags ? 'true' : undefined }
      : {},
  };
}
