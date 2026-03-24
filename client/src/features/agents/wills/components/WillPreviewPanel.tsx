import { useState, useEffect, useRef } from 'react';
import * as mammoth from 'mammoth';
import { FileText, Download, Loader2, AlertTriangle } from 'lucide-react';

interface WillPreviewPanelProps {
  downloadUrl: string;
}

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
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
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
  }, [downloadUrl, proxyUrl]);

  return (
    <div className="flex h-full flex-col gap-0 bg-white dark:bg-[#1a1916]">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-light bg-surface-secondary px-3 py-2 dark:border-white/7 dark:bg-[#221f1b]">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary dark:text-[#f3efe5]">
          <FileText className="h-4 w-4" />
          Will Draft Preview
        </div>
        <a
          href={resolvedDownloadUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 dark:bg-[#c9a85c] dark:text-[#1b1814] dark:hover:bg-[#d7b876]"
        >
          <Download className="h-3.5 w-3.5" />
          Download DOCX
        </a>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-4 dark:bg-[#1a1916]">
        {loading && (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-text-secondary dark:text-[#b7aea1]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading document…
          </div>
        )}
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm dark:text-[#b7aea1]">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <p className="font-medium text-text-primary dark:text-[#f3efe5]">Could not load preview</p>
            <p className="text-text-secondary dark:text-[#a39a8d]">{error}</p>
          </div>
        )}
        {html && (
          <div
            className="will-preview prose max-w-none text-sm leading-relaxed text-gray-900 dark:text-[#d2c9bc] dark:prose-headings:text-[#f3efe5] dark:prose-p:text-[#d2c9bc] dark:prose-strong:text-[#f4ede0] dark:prose-li:text-[#d2c9bc] dark:prose-ul:text-[#d2c9bc] dark:prose-ol:text-[#d2c9bc] dark:prose-blockquote:border-[#c9a85c] dark:prose-blockquote:bg-[#1d1a17] dark:prose-blockquote:text-[#efe6d7] dark:prose-hr:border-white/7 dark:prose-a:text-[#d4b46b] dark:prose-code:text-[#ead9b0] dark:prose-pre:bg-[#1d1a17] dark:prose-pre:text-[#e8ddcb] dark:prose-td:text-[#c3b9aa] dark:prose-th:text-[#d3c5a6]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
