import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { PolarComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';

// EChart.tsx'e dokunmadan polar koordinat sistemini kaydeder (echarts.use idempotent).
echarts.use([BarChart, PolarComponent, TooltipComponent, CanvasRenderer]);

interface EventParams { componentType?: string; name?: string; seriesIndex?: number; dataIndex?: number }

export interface PolarChartProps {
  option: EChartsCoreOption;
  height?: number;
  /** Açı ekseni kategorileri — dizinden gelen vurguyu dataIndex'e çevirmek için. */
  categories: string[];
  /** Yığındaki seri sayısı — highlight/downplay tüm katmanlara uygulanır. */
  seriesCount: number;
  /** Dışarıdan (dizin satırı) gelen vurgu; null → vurgu yok. */
  highlight?: string | null;
  onHover?: (name: string | null) => void;
  onSelect?: (name: string) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * ECharts polar sarmalayıcısı: örneği dışarı sızdırmaz; iki yönlü vurgu için
 * `highlight` prop'u ile dispatchAction(highlight/downplay) yapar, grafik
 * üzerindeki hover/click'i geri bildirir.
 */
export function PolarChart({ option, height = 380, categories, seriesCount, highlight = null, onHover, onSelect, className, ariaLabel }: PolarChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  const hoverRef = useRef(onHover);
  const selectRef = useRef(onSelect);
  hoverRef.current = onHover;
  selectRef.current = onSelect;

  useEffect(() => {
    if (!ref.current) return;
    const c = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chart.current = c;
    const isSeries = (p: EventParams) => p.componentType === 'series' && typeof p.name === 'string';
    c.on('mouseover', (p) => { const e = p as EventParams; if (isSeries(e)) hoverRef.current?.(e.name ?? null); });
    c.on('mouseout', (p) => { const e = p as EventParams; if (isSeries(e)) hoverRef.current?.(null); });
    c.on('click', (p) => { const e = p as EventParams; if (isSeries(e) && e.name) selectRef.current?.(e.name); });
    c.getZr().on('click', (e: { target?: unknown }) => { if (!e.target) selectRef.current?.(''); });
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      c.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption(option);
  }, [option]);

  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    const dataIndex = highlight ? categories.indexOf(highlight) : -1;
    if (dataIndex < 0) return;
    const seriesIndex = Array.from({ length: seriesCount }, (_, i) => i);
    c.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
    return () => { if (!c.isDisposed()) c.dispatchAction({ type: 'downplay', seriesIndex, dataIndex }); };
  }, [highlight, categories, seriesCount]);

  return <div ref={ref} className={className} role="img" aria-label={ariaLabel} style={{ width: '100%', height }} />;
}
