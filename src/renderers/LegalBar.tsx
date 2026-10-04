import { useState, type ReactNode } from 'react';
import { Anchor, Button, Menu, Modal, Switch, UnstyledButton, useMantineColorScheme } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import {
  ArrowUpIcon, CaretDownIcon, CheckIcon, CookieIcon, DatabaseIcon, DesktopIcon, GlobeIcon, MoonIcon, SunIcon,
} from '@phosphor-icons/react';
import Magnet from '../components/reactbits/Magnet';
import { useEngine, useTier, type RendererProps } from '../engine/core';
import { TierDot } from '../ui/primitives';
import { Hint } from '../ui/Hint';
import '../styles/legal.css';

/* ---------- Veri şeması (JSON) ---------- */
interface L { label: string; href: string; tier?: string; hint?: string }
interface Cookie {
  label: string; tier?: string; title: string; description: string; always?: string;
  categories: { id: string; label: string; description: string; required?: boolean }[];
  save: string; reject: string; saved: string; close: string;
}
interface Choice { label: string; tier?: string; options: string[] }
type Scheme = 'light' | 'auto' | 'dark';
interface Data {
  aria?: string;
  links: L[];
  agreements?: { label: string; href: string; tier?: string; links: L[] };
  cookie: Cookie;
  mersis?: { label: string };
  languages: Choice;
  regions: Choice;
  theme?: { label: string; tier?: string; options: { value: Scheme; label: string }[] };
  backToTop: { label: string; tier?: string };
}

/* ---------- Satır 1–2: bağlantılar ---------- */
function LegalLink({ l }: { l: L }) {
  const { props } = useTier(l.tier);
  return (
    <li {...props}>
      <Hint hint={l.hint}>
        <Anchor href={l.href} className="lb-link" underline="never" data-hint={l.hint ? 'true' : undefined}>
          <TierDot tier={l.tier} />{l.label}
        </Anchor>
      </Hint>
    </li>
  );
}

function CookieButton({ c, onOpen }: { c: Cookie; onOpen: () => void }) {
  const { props } = useTier(c.tier);
  return (
    <li {...props}>
      <UnstyledButton className="lb-link lb-cookie" onClick={onOpen} aria-haspopup="dialog">
        <TierDot tier={c.tier} /><CookieIcon size={16} aria-hidden="true" />{c.label}
      </UnstyledButton>
    </li>
  );
}

function Agreements({ a }: { a: NonNullable<Data['agreements']> }) {
  const { props } = useTier(a.tier);
  return (
    <nav className="lb-agreements" aria-label={a.label}>
      <Anchor href={a.href} className="lb-agreements-title" underline="never" {...props}>
        <TierDot tier={a.tier} />{a.label}
      </Anchor>
      <ul className="lb-links">
        {a.links.map((l) => <LegalLink key={l.label} l={l} />)}
      </ul>
    </nav>
  );
}

/* ---------- Satır 3: kontroller ---------- */
function ChoiceMenu({ c, icon }: { c: Choice; icon: ReactNode }) {
  const { props } = useTier(c.tier);
  const [value, setValue] = useState(c.options[0] ?? '');
  return (
    <Menu position="top-end" offset={10} withinPortal shadow="none"
      classNames={{ dropdown: 'lb-menu-dd', item: 'lb-menu-item', label: 'lb-menu-label', itemSection: 'lb-menu-sec' }}
      transitionProps={{ transition: 'fade-up', duration: 140 }}>
      <Menu.Target>
        <UnstyledButton className="lb-menu-btn" aria-label={`${c.label}: ${value}`} {...props}>
          <TierDot tier={c.tier} />
          <span className="lb-menu-ico" aria-hidden="true">{icon}</span>
          <span>{value}</span>
          <CaretDownIcon size={14} weight="bold" className="lb-menu-caret" aria-hidden="true" />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{c.label}</Menu.Label>
        {c.options.map((o) => (
          <Menu.Item key={o} onClick={() => setValue(o)} data-selected={o === value || undefined}
            rightSection={o === value ? <CheckIcon size={16} weight="bold" aria-hidden="true" /> : null}
            aria-current={o === value ? 'true' : undefined}>
            {o}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

const SCHEME_ICON: Record<Scheme, ReactNode> = {
  light: <SunIcon size={16} aria-hidden="true" />,
  auto: <DesktopIcon size={16} aria-hidden="true" />,
  dark: <MoonIcon size={16} aria-hidden="true" />,
};

function ThemeSwitch({ t }: { t: NonNullable<Data['theme']> }) {
  const { props } = useTier(t.tier);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  return (
    <div className="lb-theme" role="group" aria-label={t.label} {...props}>
      <TierDot tier={t.tier} />
      {t.options.map((o) => (
        <UnstyledButton key={o.value} className="lb-theme-btn" aria-label={`${t.label}: ${o.label}`} title={o.label}
          aria-pressed={colorScheme === o.value} onClick={() => setColorScheme(o.value)}>
          {SCHEME_ICON[o.value]}
        </UnstyledButton>
      ))}
    </div>
  );
}

function BackToTop({ b }: { b: Data['backToTop'] }) {
  const { props } = useTier(b.tier);
  const reduced = useReducedMotion();
  return (
    <Magnet padding={48} magnetStrength={3.5} disabled={!!reduced} wrapperClassName="lb-top-wrap">
      <UnstyledButton className="lb-top" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })} {...props}>
        <TierDot tier={b.tier} />
        <ArrowUpIcon size={16} weight="bold" className="lb-top-arrow" aria-hidden="true" />
        {b.label}
      </UnstyledButton>
    </Magnet>
  );
}

/* ---------- Çerez tercih paneli ---------- */
function CookieModal({ c, opened, onClose }: { c: Cookie; opened: boolean; onClose: () => void }) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const finish = () => { setSaved(true); setTimeout(() => { onClose(); setSaved(false); }, 900); };
  return (
    <Modal opened={opened} onClose={onClose} centered size="md" radius="md" withCloseButton
      closeButtonProps={{ 'aria-label': c.close, size: 'lg' }}
      classNames={{ content: 'lb-modal', header: 'lb-modal-head', title: 'lb-modal-title', body: 'lb-modal-body' }}
      title={<span className="lb-modal-title-in"><CookieIcon size={20} aria-hidden="true" />{c.title}</span>}>
      <p className="lb-modal-desc">{c.description}</p>
      <ul className="lb-cookie-list">
        {c.categories.map((cat) => (
          <li key={cat.id} className="lb-cookie-row">
            <div className="lb-cookie-text">
              <label htmlFor={`lb-ck-${cat.id}`} className="lb-cookie-name">{cat.label}</label>
              <span className="lb-cookie-desc">{cat.description}</span>
            </div>
            {cat.required
              ? <span className="lb-cookie-always">{c.always ?? cat.label}<Switch id={`lb-ck-${cat.id}`} size="md" checked disabled aria-label={cat.label} /></span>
              : <Switch id={`lb-ck-${cat.id}`} size="md" checked={!!prefs[cat.id]} aria-label={cat.label}
                  onChange={(e) => setPrefs((p) => ({ ...p, [cat.id]: e.currentTarget.checked }))} />}
          </li>
        ))}
      </ul>
      <div className="lb-modal-actions">
        <span className="lb-modal-saved" role="status" aria-live="polite">{saved ? c.saved : ''}</span>
        <UnstyledButton className="lb-modal-reject" onClick={() => { setPrefs({}); finish(); }}>{c.reject}</UnstyledButton>
        <Button size="md" radius="md" onClick={finish}>{c.save}</Button>
      </div>
    </Modal>
  );
}

/* ---------- Bölüm ---------- */
export function LegalBar({ doc }: RendererProps<Data>) {
  const { manifest } = useEngine();
  const { aria, links, agreements, cookie, mersis, languages, regions, theme, backToTop } = doc.data;
  const [open, setOpen] = useState(false);

  return (
    <div className="lb-legal">
      <nav aria-label={aria}>
        <ul className="lb-links">
          {links.map((l) => <LegalLink key={l.label} l={l} />)}
          <CookieButton c={cookie} onOpen={() => setOpen(true)} />
        </ul>
      </nav>

      {agreements && <Agreements a={agreements} />}

      <div className="lb-bottom">
        <p className="lb-copy">
          <span>{manifest.site.copyright}</span>
          {manifest.site.mersis && (
            <span className="lb-mersis"><span className="lb-mersis-label">{mersis?.label}</span> {manifest.site.mersis}</span>
          )}
        </p>
        <div className="lb-controls">
          <ChoiceMenu c={languages} icon={<GlobeIcon size={16} />} />
          <ChoiceMenu c={regions} icon={<DatabaseIcon size={16} />} />
          {theme && <><span className="lb-sep" aria-hidden="true" /><ThemeSwitch t={theme} /></>}
          <span className="lb-sep" aria-hidden="true" />
          <BackToTop b={backToTop} />
        </div>
      </div>

      <CookieModal c={cookie} opened={open} onClose={() => setOpen(false)} />
    </div>
  );
}
