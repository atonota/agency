/**
 * useVisibilityGate — sürekli rAF döngüleri için görünürlük kapısı.
 * Eleman görünüm alanında (rootMargin payıyla) VE sekme görünür (document.hidden === false)
 * olduğunda `gate.current === true`. State değil ref döndürür: frame döngüsü her karede okur,
 * kapı değişimi yeniden render tetiklemez. IntersectionObserver yoksa hep açık kalır.
 *
 * İsteğe bağlı `onChange` ile açılış/kapanış anında iş yapılabilir (ör. kendi rAF döngüsünü
 * başlatmak/durdurmak). Callback ref üzerinden okunur; kimliği değişince observer yeniden kurulmaz.
 */
import { useEffect, useRef, type RefObject } from 'react';

export function useVisibilityGate<T extends Element>(
  ref: RefObject<T | null>,
  rootMargin = '160px 0px',
  onChange?: (active: boolean) => void,
): RefObject<boolean> {
  const inView = useRef(true);
  const pageVisible = useRef(typeof document === 'undefined' ? true : !document.hidden);
  const gate = useRef(true);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const next = inView.current && pageVisible.current;
      if (next !== gate.current) {
        gate.current = next;
        cb.current?.(next);
      }
    };

    const onVisibility = () => {
      pageVisible.current = !document.hidden;
      sync();
    };
    document.addEventListener('visibilitychange', onVisibility);

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      // Gözlemci ilk raporunu verene dek kapalı; ilk rapor gerçek durumu yazar.
      inView.current = false;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) inView.current = e.isIntersecting;
          sync();
        },
        { rootMargin },
      );
      io.observe(el);
    } else {
      inView.current = true;
    }
    sync();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      io?.disconnect();
    };
  }, [ref, rootMargin]);

  return gate;
}

export default useVisibilityGate;
