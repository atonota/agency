import { useEffect, useState } from 'react';
import { useComputedColorScheme } from '@mantine/core';

const VARS = [
  '--fe-tier-z', '--fe-tier-o', '--fe-tier-e',
  '--fe-ink', '--fe-ink-2', '--fe-muted',
  '--fe-line', '--fe-line-strong',
  '--fe-surface', '--fe-footer', '--fe-accent',
] as const;

export type ThemeVarName = (typeof VARS)[number];
export type ThemeVars = Partial<Record<ThemeVarName, string>>;

/**
 * Canvas/ECharts katmanları CSS değişkenlerini okuyamaz; tema her değiştiğinde
 * token'ları hesaplanmış değer olarak okur. Sabit hex yazılmaz.
 */
export function useThemeVars(): ThemeVars {
  const scheme = useComputedColorScheme('light');
  const [vars, setVars] = useState<ThemeVars>({});
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const cs = getComputedStyle(document.documentElement);
      setVars(Object.fromEntries(VARS.map((v) => [v, cs.getPropertyValue(v).trim()])) as ThemeVars);
    });
    return () => cancelAnimationFrame(id);
  }, [scheme]);
  return vars;
}
