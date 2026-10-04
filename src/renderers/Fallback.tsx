import { Alert, Code, ScrollArea, Text } from '@mantine/core';
import { WarningIcon } from '@phosphor-icons/react';
import type { RendererProps } from '../engine/core';

/** Kayıtlı renderer'ı olmayan bir JSON tipi algılandığında içerik kaybolmasın diye gösterilir. */
export function Fallback({ doc }: RendererProps) {
  return (
    <Alert variant="light" color="yellow" radius="md" icon={<WarningIcon size={18} />}
      title={<Text fw={600} fz={16}>“{doc.type}” için renderer yok — {doc.file}</Text>}>
      <Text fz={16} mb="xs">
        Dedektör bu dosyayı buldu ama tipini tanımıyor. <Code>src/engine.tsx</Code> içindeki <Code>REGISTRY</Code>'ye bir bileşen ekleyin.
      </Text>
      <ScrollArea.Autosize mah={220} type="auto">
        <Code block fz={16}>{JSON.stringify(doc.data, null, 2)}</Code>
      </ScrollArea.Autosize>
    </Alert>
  );
}
