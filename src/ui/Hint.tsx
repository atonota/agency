import type { ReactElement } from 'react';
import { Tooltip } from '@mantine/core';

/** Kısaltma açılımları ve kısa açıklamalar için ortak ipucu. `hint` yoksa çocuğu olduğu gibi döndürür. */
export function Hint({ hint, children }: { hint?: string; children: ReactElement }) {
  if (!hint) return children;
  return (
    <Tooltip label={hint} multiline w={260} withArrow openDelay={200} transitionProps={{ transition: 'pop', duration: 150 }} fz={16}>
      {children}
    </Tooltip>
  );
}
