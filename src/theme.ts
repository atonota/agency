import { createTheme, type CSSVariablesResolver, type MantineColorsTuple } from '@mantine/core';

/* Vurgu: mint #00ffbb (koyu temada dolgu), açık temada okunabilir koyu mint */
const mint: MantineColorsTuple = [
  '#e0fff5', '#b3ffe6', '#80ffd6', '#4dffc7', '#00ffbb',
  '#00e6a8', '#00c48f', '#009a72', '#007556', '#00523c',
];

// Mint tonlu koyu palet — saf gri yerine vurguya eğilimli nötrler
const dark: MantineColorsTuple = [
  '#E6F2EE', '#C1D3CC', '#98ACA5', '#7A908A', '#3A4E48',
  '#273A35', '#1C2C28', '#10191C', '#0B1417', '#070E11',
];

export const theme = createTheme({
  primaryColor: 'mint',
  primaryShade: { light: 7, dark: 4 },
  colors: { mint, dark },
  fontFamily: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  headings: { fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: '600' },
  /* Kural: sayfada 1rem altı yazı yok. xs/sm de 1rem'e sabitlenir. */
  fontSizes: { xs: '1rem', sm: '1rem', md: '1.0625rem', lg: '1.125rem', xl: '1.25rem' },
  defaultRadius: 'md',
  cursorType: 'pointer',
  focusRing: 'auto',
  components: {
    Badge: { defaultProps: { size: 'lg' } },
    Chip: { defaultProps: { size: 'md' } },
    Tooltip: { defaultProps: { fz: 'md' } },
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    '--fe-mono': '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    '--fe-text-min': '1rem',
  },
  light: {
    '--fe-ground': '#EEF3F1',
    '--fe-footer': '#FFFFFF',
    '--fe-surface': '#F4F8F6',
    '--fe-surface-2': '#E9F0ED',
    '--fe-line': '#D9E2DE',
    '--fe-line-strong': '#C0CDC7',
    '--fe-ink': '#0B1A15',
    '--fe-ink-2': '#37493F',
    '--fe-muted': '#66776F',
    '--fe-accent': '#009a72',
    '--fe-accent-ink': '#FFFFFF',
    '--fe-glow': 'rgba(0,154,114,0.12)',
    '--fe-tier-z': '#009a72',
    '--fe-tier-o': '#C98A12',
    '--fe-tier-e': '#7457C9',
    '--fe-ok': '#1F9D5B',
  },
  dark: {
    '--fe-ground': '#070E11',
    '--fe-footer': '#0A1215',
    '--fe-surface': '#0E181B',
    '--fe-surface-2': '#132320',
    '--fe-line': '#1B2A2A',
    '--fe-line-strong': '#28403C',
    '--fe-ink': '#E9F3EF',
    '--fe-ink-2': '#B4C6BF',
    '--fe-muted': '#7E948C',
    '--fe-accent': '#00ffbb',
    '--fe-accent-ink': '#051712',
    '--fe-glow': 'rgba(0,255,187,0.12)',
    '--fe-tier-z': '#00ffbb',
    '--fe-tier-o': '#F0B545',
    '--fe-tier-e': '#A68CF2',
    '--fe-ok': '#3DD68C',
  },
});
