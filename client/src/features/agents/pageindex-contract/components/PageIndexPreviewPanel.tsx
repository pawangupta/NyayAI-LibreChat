import { useRecoilValue, useSetRecoilState } from 'recoil';
import { AlertTriangle, ExternalLink, FileText, Loader2, X } from 'lucide-react';
import store from '~/store';

const labelFont = { fontFamily: 'Inter, Manrope, sans-serif' } as const;

export default function PageIndexPreviewPanel() {
  const preview = useRecoilValue(store.pageIndexPreview);
  const setPreview = useSetRecoilState(store.pageIndexPreview);

  if (!preview?.previewPath) {
    return (
      <div className="flex h-full flex-col bg-white dark:bg-[#1a1916]">
        <div className="flex shrink-0 items-center justify-end border-b border-border-light bg-surface-secondary px-3 py-2 dark:border-white/7 dark:bg-[#221f1b]">
          <button
            onClick={() => setPreview(null)}
            title="Close preview"
            className="rounded p-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary dark:text-[#a39a8d] dark:hover:bg-white/10 dark:hover:text-[#f3efe5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm">
          <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          <p className="text-stone-500 dark:text-stone-400">Waiting for contract preview…</p>
        </div>
      </div>
    );
  }

  const iframeSrc =
    preview.activePage != null
      ? `${preview.previewPath}#page=${preview.activePage}`
      : preview.previewPath;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#1a1916]">
      {/* Header — mirrors DraftingPreviewPanel */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-light bg-surface-secondary px-3 py-2 dark:border-white/7 dark:bg-[#221f1b]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary dark:text-[#f3efe5]">
            <FileText className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <span className="truncate">Contract Preview</span>
          </div>
          <p className="mt-1 truncate text-xs text-text-secondary dark:text-[#a39a8d]" style={labelFont}>
            {preview.docName}
            {preview.activePage != null && (
              <span className="ml-2 rounded-full bg-indigo-100 px-1.5 py-0.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                p.{preview.activePage}
              </span>
            )}
          </p>
        </div>

        <a
          href={iframeSrc}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border-light bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover dark:border-white/10 dark:bg-white/5 dark:text-[#f3efe5]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </a>

        <button
          onClick={() => setPreview(null)}
          title="Close preview"
          className="rounded p-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary dark:text-[#a39a8d] dark:hover:bg-white/10 dark:hover:text-[#f3efe5]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* PDF iframe */}
      <div className="min-h-0 flex-1 overflow-hidden bg-white dark:bg-[#1a1916]">
        {preview.previewPath ? (
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            title={`PDF – ${preview.docName}`}
            className="h-full w-full border-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-text-secondary dark:text-[#b7aea1]">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            No PDF available
          </div>
        )}
      </div>
    </div>
  );
}
