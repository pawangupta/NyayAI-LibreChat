import { useMemo } from 'react';
import { useGetMessagesByConvoId } from '~/data-provider';

const DOWNLOAD_REGEX = /(https?:\/\/[\w\-.:%]+\/v1\/files\/download\/[\w-]+)/i;

export function useWillDownloadUrl(conversationId: string): string {
  const { data: messages = [] } = useGetMessagesByConvoId(conversationId, {
    enabled: Boolean(conversationId),
  });

  return useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.isCreatedByUser) {
        continue;
      }

      const text = typeof msg.text === 'string' ? msg.text : '';
      const match = text.match(DOWNLOAD_REGEX);
      if (match?.[1]) {
        return match[1];
      }

      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part && typeof part === 'object' && 'text' in part) {
            const rawPartText = (part as { text: unknown }).text;
            const partText = typeof rawPartText === 'string' ? rawPartText : '';
            const partMatch = partText.match(DOWNLOAD_REGEX);
            if (partMatch?.[1]) {
              return partMatch[1];
            }
          }
        }
      }
    }

    return '';
  }, [messages]);
}
