import { useMemo } from 'react';
import { useGetMessagesByConvoId } from '~/data-provider';

// Matches http(s)://host:port/v1/files/download/<file_id>
const DOWNLOAD_REGEX = /(https?:\/\/[\w\-.:%]+\/v1\/files\/download\/[\w-]+)/i;

/**
 * Scans assistant messages in a conversation for the most recent Will draft
 * download URL. Returns an empty string when none has been generated yet.
 */
export function useWillDownloadUrl(conversationId: string): string {
  const { data: messages = [] } = useGetMessagesByConvoId(conversationId, {
    enabled: Boolean(conversationId),
  });

  return useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.isCreatedByUser) continue;

      // Check msg.text (raw string from custom endpoint)
      const text = typeof msg.text === 'string' ? msg.text : '';
      const match = text.match(DOWNLOAD_REGEX);
      if (match?.[1]) return match[1];

      // Fallback: check content parts (assistants / agents endpoint)
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part && typeof part === 'object' && 'text' in part) {
            const rawPartText = (part as { text: unknown }).text;
            const partText = typeof rawPartText === 'string' ? rawPartText : '';
            const partMatch = partText.match(DOWNLOAD_REGEX);
            if (partMatch?.[1]) return partMatch[1];
          }
        }
      }
    }
    return '';
  }, [messages]);
}
