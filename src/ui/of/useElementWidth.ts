import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Bir elemanın piksel genişliğini izler (ResizeObserver). İlk ölçümden önce 0 döner;
 * çağıran taraf 0 için yüzde tabanlı bir geri dönüş kullanmalıdır.
 */
export function useElementWidth<T extends Element>(ref: RefObject<T | null>) {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}
