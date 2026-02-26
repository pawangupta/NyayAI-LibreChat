import { useState, useEffect, useRef } from 'react';
import * as mammoth from 'mammoth';
import { FileText, Download, Loader2, AlertTriangle } from 'lucide-react';

interface WillPreviewPanelProps {
  /** Absolute URL to the DOCX file, e.g. http://localhost:8003/v1/files/download/<id> */
  downloadUrl: string;
}

/** Rewrite absolute WillGen URLs through LibreChat's same-origin proxy to avoid CORS. */
function toProxyUrl(url: string): string {
  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(url, baseOrigin);

    const alreadyProxiedV1 = parsed.pathname.match(/^\/api\/willgen\/v1\/files\/download\/([^/?#]+)/);
    if (alreadyProxiedV1?.[1]) {
      return `/api/willgen/files/download/${alreadyProxiedV1[1]}`;
    }

    const alreadyProxied = parsed.pathname.match(/^\/api\/willgen\/files\/download\/([^/?#]+)/);
    if (alreadyProxied?.[1]) {
      return `/api/willgen/files/download/${alreadyProxied[1]}`;
    }

    const match = parsed.pathname.match(/^\/v1\/files\/download\/([^/?#]+)/);
    if (match?.[1]) {
      return `/api/willgen/files/download/${match[1]}`;
    }
    return '';
  } catch {
    return '';
  }
}

export default function WillPreviewPanel({ downloadUrl }: WillPreviewPanelProps) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const prevUrlRef = useRef('');

  const proxyUrl = downloadUrl ? toProxyUrl(downloadUrl) : '';
  const resolvedDownloadUrl = proxyUrl || downloadUrl;

  useEffect(() => {
    if (!proxyUrl || proxyUrl === prevUrlRef.current) {
      if (!proxyUrl) {
        setError('Invalid download URL');
      }
      return;
    }
    prevUrlRef.current = proxyUrl;

    setLoading(true);
    setError('');
    setHtml('');

    fetch(proxyUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => mammoth.convertToHtml({ arrayBuffer: buf }))
      .then((result) => {
        setHtml(result.value);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setLoading(false);
      });
  }, [downloadUrl]);

  return (
    <div className="flex h-full flex-col gap-0">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-light bg-surface-secondary px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <FileText className="h-4 w-4" />
          Will Draft Preview
        </div>
        <a
          href={resolvedDownloadUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
        >
          <Download className="h-3.5 w-3.5" />
          Download DOCX
        </a>
      </div>

      {/* Content area */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-4">
        {loading && (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading document…
          </div>
        )}
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <p className="font-medium text-text-primary">Could not load preview</p>
            <p className="text-text-secondary">{error}</p>
          </div>
        )}
        {html && (
          <div
            className="will-preview prose max-w-none text-sm leading-relaxed text-gray-900"
            /* mammoth output is safe — no user-supplied HTML */
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
