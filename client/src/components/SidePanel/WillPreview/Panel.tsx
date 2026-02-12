import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, FileText, ExternalLink, Download } from 'lucide-react';
import { useGetMessagesByConvoId } from '~/data-provider';

const downloadRegex = /(https?:\/\/[\w\-.:%]+\/[\w\-./]*\/v1\/files\/download\/[A-Za-z0-9_-]+)/i;

const buildEmbedUrl = (downloadUrl: string) =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`;

export default function WillPreviewPanel() {
  const { conversationId = '' } = useParams();

  const { data: messages = [] } = useGetMessagesByConvoId(conversationId, {
    enabled: Boolean(conversationId),
  });

  const downloadUrl = useMemo(() => {
    // Search newest-to-oldest WillGen assistant message for a download link
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg.endpoint !== 'WillGen') continue;
      const text = msg.text || '';
      const match = text.match(downloadRegex);
      if (match && match[1]) {
        return match[1];
      }
    }
    return '';
  }, [messages]);

  if (!downloadUrl) {
    return (
      <div className="space-y-3 rounded-md border border-dashed border-border-light bg-surface-secondary p-4 text-sm text-text-secondary">
        <div className="flex items-center gap-2 font-medium text-text-primary">
          <AlertTriangle className="h-4 w-4" />
          No draft available yet
        </div>
        <p className="leading-relaxed">
          Generate a Will draft first. After the assistant returns the download link, the preview
          and download actions will appear here.
        </p>
      </div>
    );
  }

  const embedUrl = buildEmbedUrl(downloadUrl);

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border-light bg-surface-secondary p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <FileText className="h-4 w-4" />
            Latest Will draft
          </div>
          <div className="flex items-center gap-2 text-xs">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1 font-medium text-white hover:bg-accent/90"
            >
              <Download className="h-4 w-4" />
              Download DOCX
            </a>
            <a
              href={embedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border-light px-3 py-1 font-medium text-text-primary hover:bg-surface-1"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-secondary leading-relaxed">
          The preview uses the Office web viewer. If it does not load, open the DOCX in a new tab or
          download it directly.
        </p>
      </div>
      <div className="overflow-hidden rounded-md border border-border-light shadow-sm">
        <iframe
          title="Will draft preview"
          src={embedUrl}
          className="h-[520px] w-full bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
