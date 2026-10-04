import { useState, type FormEvent } from 'react';
import { Anchor, Box, Checkbox, Group, Text, TextInput, Title } from '@mantine/core';
import { ArrowRightIcon } from '@phosphor-icons/react';
import Dock from '../components/reactbits/Dock';
import ShinyText from '../components/reactbits/ShinyText';
import StarBorder from '../components/reactbits/StarBorder';
import { useEngine, useTier, type RendererProps } from '../engine/core';
import { Icon } from '../ui/Icon';

interface Link { icon?: string; label: string; href: string; tier?: string; caption?: string }
interface Data {
  status: Link;
  social: Link[];
  newsletter: {
    tier?: string; eyebrow: string; title: string; description: string; placeholder: string; button: string;
    consent: { before: string; linkLabel: string; href: string; after: string };
    success: string; errorEmail: string; errorConsent: string;
  };
  stores: Link[];
  entity?: { label: string; name: string; link: Link; hq?: string; tier?: string };
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="fe-logo-mark">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--mantine-primary-color-filled)" />
      <path d="M9 22V10l7 7 7-7v12" fill="none" stroke="var(--fe-footer)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** React Bits Dock: sosyal ikon yığını — imleçle büyüyen ikonlar. Aşama noktası ikonun üstünde. */
function SocialDock({ social }: { social: Link[] }) {
  const { manifest, stage, showTags } = useEngine();
  const rank = (k?: string) => manifest.tiers.find((t) => t.key === k)?.rank ?? 1;
  return (
    <Box className="fe-dock-wrap">
      <Dock
        className="fe-dock"
        baseItemSize={40}
        magnification={58}
        distance={140}
        panelHeight={52}
        dockHeight={72}
        items={social.map((s) => ({
          icon: (
            <span className="fe-dock-icon" data-tier={s.tier} data-dim={rank(s.tier) > stage ? 'true' : undefined} data-tags={showTags ? 'true' : undefined}>
              <Icon name={s.icon} size={18} />
            </span>
          ),
          label: s.label,
          onClick: () => { window.location.hash = s.href.replace('#', ''); },
        }))}
      />
    </Box>
  );
}

function Store({ s }: { s: Link }) {
  const { props } = useTier(s.tier);
  return (
    <a href={s.href} className="fe-store" {...props}>
      <Icon name={s.icon} size={18} weight="fill" />
      <span><small>{s.caption}</small><b>{s.label}</b></span>
    </a>
  );
}

export function BrandBlock({ doc }: RendererProps<Data>) {
  const { manifest } = useEngine();
  const { brand } = manifest.site;
  const { status, social, newsletter: n, stores, entity } = doc.data;
  const statusTier = useTier(status.tier);
  const entityTier = useTier(entity?.tier);
  const newsTier = useTier(n.tier);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setMsg({ ok: false, text: n.errorEmail });
    if (!consent) return setMsg({ ok: false, text: n.errorConsent });
    setMsg({ ok: true, text: n.success });
  };

  return (
    <Box className="fe-brandrow">
      <Box className="fe-brand">
        <Group gap={14} wrap="nowrap">
          <Logo size={44} />
          <Box>
            <Text fw={700} fz={24} lts="0.05em" c="var(--fe-ink)" lh={1}>{brand.name}</Text>
            <Text className="fe-eyebrow" mt={6}>{brand.descriptor}</Text>
          </Box>
        </Group>
        <Text c="var(--fe-ink-2)" fz={16} lh={1.6} maw="44ch" mt={20}>{brand.tagline}</Text>
        {entity && (
          <Box className="fe-entity" {...entityTier.props}>
            <span className="fe-entity-label">{entity.label}</span>
            <span className="fe-entity-name">{entity.name}</span>
            {entity.hq && <span className="fe-entity-hq">{entity.hq}</span>}
            <Anchor href={entity.link.href} className="fe-textlink" underline="never">{entity.link.label} <ArrowRightIcon size={14} weight="bold" /></Anchor>
          </Box>
        )}
        <a href={status.href} className="fe-status" {...statusTier.props}>
          <span className="fe-pulse" aria-hidden="true" />
          <ShinyText text={status.label} speed={3} color="var(--fe-ink-2)" shineColor="var(--fe-ink)" className="fe-status-text" />
        </a>
        <SocialDock social={social} />
      </Box>

      <Box className="fe-news" {...newsTier.props}>
        <Text className="fe-eyebrow fe-eyebrow-accent">{n.eyebrow}</Text>
        <Title order={3} className="fe-news-title">{n.title}</Title>
        <Text fz={16} c="var(--fe-muted)" mt={6}>{n.description}</Text>
        <form onSubmit={submit} noValidate className="fe-news-form">
          <TextInput id="news-email" aria-label="E-posta adresi" placeholder={n.placeholder} value={email}
            onChange={(e) => setEmail(e.currentTarget.value)} variant="unstyled" size="lg" className="fe-news-input" autoComplete="email" />
          <StarBorder as="button" type="submit" className="fe-star" color="var(--mantine-primary-color-4)" speed="5s" thickness={1}
            backgroundColor="var(--mantine-primary-color-filled)" textColor="var(--fe-footer)" borderColor="transparent">
            <span className="fe-star-inner">{n.button}<ArrowRightIcon size={15} weight="bold" /></span>
          </StarBorder>
        </form>
        <Checkbox id="news-consent" mt="md" size="md" checked={consent} onChange={(e) => setConsent(e.currentTarget.checked)}
          label={<Text span fz={16} c="var(--fe-muted)">{n.consent.before}<Anchor href={n.consent.href} fz={16} inherit>{n.consent.linkLabel}</Anchor>{n.consent.after}</Text>} />
        {msg && <Text fz={16} mt={8} c={msg.ok ? 'var(--fe-ok)' : 'red.6'} role="status">{msg.text}</Text>}
        <Group gap={28} mt={28}>{stores.map((s) => <Store key={s.label} s={s} />)}</Group>
      </Box>
    </Box>
  );
}
