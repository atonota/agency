/**
 * Geçerlilik hesabı — defter satırı ve ayrıntı bloğu aynı sonucu kullanır.
 * Tarihler ISO (YYYY-MM-DD); gün farkı UTC gün sınırında hesaplanır (saat dilimi kaymasını önler).
 */
export type ExpiryState = 'none' | 'ok' | 'soon' | 'over';

export interface Expiry {
  state: ExpiryState;
  /** Bitişe kalan gün (negatifse geçmiş). `none` için 0. */
  days: number;
}

const DAY = 86_400_000;

function utcDay(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function expiryOf(expiresAt: string | null | undefined, today: string, warnDays = 90): Expiry {
  if (!expiresAt) return { state: 'none', days: 0 };
  const a = utcDay(expiresAt);
  const b = utcDay(today);
  if (a === null || b === null) return { state: 'none', days: 0 };
  const days = Math.round((a - b) / DAY);
  if (days < 0) return { state: 'over', days };
  if (days <= warnDays) return { state: 'soon', days };
  return { state: 'ok', days };
}

/** Bugünün ISO tarihi (yerel takvim günü). */
export function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
