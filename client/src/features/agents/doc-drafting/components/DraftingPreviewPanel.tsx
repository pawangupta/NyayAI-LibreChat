import { useEffect, useMemo, useRef, useState } from 'react';
import * as mammoth from 'mammoth';
import { AlertTriangle, Download, ExternalLink, FileText, Loader2, X } from 'lucide-react';
import { resolveDocDraftingUrl } from '../config';

interface DraftingPreviewPanelProps {
  downloadUrl: string;
  onClose?: () => void;
}

export default function DraftingPreviewPanel({
  downloadUrl,
  onClose,
}: DraftingPreviewPanelProps) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const previousUrlRef = useRef('');

  const resolvedDownloadUrl = useMemo(
    () => resolveDocDraftingUrl(downloadUrl) ?? '',
    [downloadUrl],
  );
  const fileName = useMemo(() => {
    if (!resolvedDownloadUrl) {
      return 'Generated Draft';
    }

    const value = resolvedDownloadUrl.split('/').pop()?.split('?')[0] ?? '';
    return value ? decodeURIComponent(value) : 'Generated Draft';
  }, [resolvedDownloadUrl]);

  useEffect(() => {
    if (!resolvedDownloadUrl) {
      setHtml('');
      setLoading(false);
      setError('Invalid draft download URL');
      previousUrlRef.current = '';
      return;
    }

    if (resolvedDownloadUrl === previousUrlRef.current) {
      return;
    }

    previousUrlRef.current = resolvedDownloadUrl;
    setLoading(true);
    setError('');
    setHtml('');

    fetch(resolvedDownloadUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.arrayBuffer();
      })
      .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
      .then((result) => {
        setHtml(result.value);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load document preview');
        setLoading(false);
      });
  }, [resolvedDownloadUrl]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#1a1916]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-light bg-surface-secondary px-3 py-2 dark:border-white/7 dark:bg-[#221f1b]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary dark:text-[#f3efe5]">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">Draft Preview</span>
          </div>
          <p className="mt-1 truncate text-xs text-text-secondary dark:text-[#a39a8d]">{fileName}</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={resolvedDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border-light bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover dark:border-white/10 dark:bg-white/5 dark:text-[#f3efe5]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
          <a
            href={resolvedDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-indigo-700 bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 dark:border-[#d2b36c] dark:bg-[#d2b36c] dark:text-[#1b1814] dark:hover:bg-[#e0c27c]"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close preview"
              className="rounded p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary dark:text-[#a39a8d] dark:hover:bg-white/10 dark:hover:text-[#f3efe5]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-4 dark:bg-[#1a1916]">
        {loading && (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-text-secondary dark:text-[#b7aea1]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading document…
          </div>
        )}

        {error && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm dark:text-[#b7aea1]">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <p className="font-medium text-text-primary dark:text-[#f3efe5]">Could not load preview</p>
            <p className="text-center text-text-secondary dark:text-[#a39a8d]">{error}</p>
          </div>
        )}

        {html && !loading && (
          <div
            className="prose max-w-none text-sm leading-relaxed text-gray-900 dark:text-[#d2c9bc] dark:prose-headings:text-[#f3efe5] dark:prose-p:text-[#d2c9bc] dark:prose-strong:text-[#f4ede0] dark:prose-li:text-[#d2c9bc] dark:prose-ul:text-[#d2c9bc] dark:prose-ol:text-[#d2c9bc] dark:prose-blockquote:border-[#c9a85c] dark:prose-blockquote:bg-[#1d1a17] dark:prose-blockquote:text-[#efe6d7] dark:prose-hr:border-white/7 dark:prose-a:text-[#d4b46b] dark:prose-code:text-[#ead9b0] dark:prose-pre:bg-[#1d1a17] dark:prose-pre:text-[#e8ddcb] dark:prose-td:text-[#c3b9aa] dark:prose-th:text-[#d3c5a6]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
