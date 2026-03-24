import { useMemo, type ReactNode } from 'react';
import { LibraryBig, Scale, Sparkles } from 'lucide-react';
import { ContentTypes, type SearchResultData, type TMessageContentParts } from 'librechat-data-provider';
import { useSearchContext } from '~/Providers';
import { cn } from '~/utils';
import {
  isLegalResearchEndpointName,
  isLegalResearchModelName,
} from '../config';

const PREVIEW_MAX_LENGTH = 280;
const headlineFont = { fontFamily: 'Manrope, Inter, sans-serif' } as const;
const bodyFont = { fontFamily: 'Newsreader, Georgia, serif' } as const;
const labelFont = { fontFamily: 'Inter, Manrope, sans-serif' } as const;

export function isLegalResearchResponse({
  endpoint,
  model,
  isCreatedByUser,
}: {
  endpoint?: string | null;
  model?: string | null;
  isCreatedByUser?: boolean | null;
}) {
  if (isCreatedByUser) {
    return false;
  }

  return isLegalResearchEndpointName(endpoint) || isLegalResearchModelName(model);
}

export function extractLegalResearchPreview({
  content,
  fallbackText,
}: {
  content?: Array<TMessageContentParts | undefined>;
  fallbackText?: string;
}) {
  const textParts: string[] = [];

  for (const part of content ?? []) {
    if (!part || part.type !== ContentTypes.TEXT) {
      continue;
    }

    const value = typeof part.text === 'string' ? part.text : part.text?.value;
    if (typeof value === 'string' && value.trim().length > 0) {
      textParts.push(value.trim());
    }

    if (textParts.join(' ').length >= PREVIEW_MAX_LENGTH * 1.5) {
      break;
    }
  }

  const combined = (textParts.join(' ') || fallbackText || '')
    .replace(/:::thinking[\s\S]*?:::/g, ' ')
    .replace(/\[(\d+:\d+)\]/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>]+/g, ' ')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (combined.length <= PREVIEW_MAX_LENGTH) {
    return combined;
  }

  return `${combined.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}…`;
}

function getResearchStats(searchResults?: { [key: string]: SearchResultData }) {
  const stats = {
    turns: 0,
    sources: 0,
    files: 0,
    images: 0,
  };

  if (!searchResults) {
    return stats;
  }

  for (const result of Object.values(searchResults)) {
    if (!result) {
      continue;
    }

    stats.turns += 1;
    stats.sources += (result.organic?.length ?? 0) + (result.topStories?.length ?? 0);
    stats.images += result.images?.length ?? 0;
    stats.files +=
      result.references?.filter((reference) => (reference as { type?: string }).type === 'file')
        .length ?? 0;
  }

  return stats;
}

type LegalResearchWrapperProps = {
  children: ReactNode;
  sources?: ReactNode;
  previewText?: string;
  className?: string;
};

export default function LegalResearchWrapper({
  children,
  sources,
  previewText: _previewText,
  className,
}: LegalResearchWrapperProps) {
  const { searchResults } = useSearchContext();

  const stats = useMemo(() => getResearchStats(searchResults), [searchResults]);

  const statChips = useMemo(() => {
    const chips = [] as string[];

    if (stats.turns > 0) {
      chips.push(`${stats.turns} search ${stats.turns === 1 ? 'turn' : 'turns'}`);
    }
    if (stats.sources > 0) {
      chips.push(`${stats.sources} cited sources`);
    }
    if (stats.files > 0) {
      chips.push(`${stats.files} referenced files`);
    } else if (stats.images > 0) {
      chips.push(`${stats.images} related images`);
    }

    return chips;
  }, [stats]);

  const hasResearchMaterials = stats.sources > 0 || stats.files > 0 || stats.images > 0;
  const showSourcesPanel = hasResearchMaterials && Boolean(sources);
  const reportId = `LR-${String(stats.sources || stats.turns || 1).padStart(3, '0')}-${String(
    Math.max(stats.turns, 1),
  ).padStart(2, '0')}`;

  return (
    <div
      data-legal-research-wrapper="true"
      className={cn(
        'my-4 overflow-hidden rounded-[18px] border border-slate-200/80 bg-[#f8f9fb] shadow-[0_20px_60px_rgba(42,52,57,0.07)] dark:border-slate-700/70 dark:bg-[#111827]',
        className,
      )}
    >
      <div className="border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(248,249,251,1))] px-6 py-8 dark:border-slate-700/70 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(17,24,39,1))] sm:px-8 sm:py-10">
        <div className="border-l-4 border-slate-900 pl-6 dark:border-slate-100">
          <p
            className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400"
            style={labelFont}
          >
            Automated Legal Analysis
          </p>
          <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
            <span
              className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={labelFont}
            >
              <Scale className="h-3.5 w-3.5" />
              Legal Research Brief
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em]"
              style={labelFont}
            >
              <Sparkles className="h-3.5 w-3.5" />
              The Digital Jurist style
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            <h3
              className="text-[1.9rem] font-extrabold leading-tight tracking-[-0.04em] text-slate-900 dark:text-slate-50 sm:text-[2.35rem]"
              style={headlineFont}
            >
              Research findings and cited authorities
            </h3>
            <p
              className="max-w-3xl text-[14px] leading-6 text-slate-600 dark:text-slate-300"
              style={bodyFont}
            >
              Structured legal analysis with supporting authorities, extracted findings, and a
              refined editorial report experience.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
          <div>
            <p
              className="mb-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500"
              style={labelFont}
            >
              Report ID
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50" style={headlineFont}>
              {reportId}
            </p>
          </div>
          <div>
            <p
              className="mb-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500"
              style={labelFont}
            >
              Status
            </p>
            <p
              className="text-sm font-bold uppercase text-emerald-700 dark:text-emerald-400"
              style={headlineFont}
            >
              Verified law
            </p>
          </div>
          <div>
            <p
              className="mb-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500"
              style={labelFont}
            >
              Search turns
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50" style={headlineFont}>
              {stats.turns || 1}
            </p>
          </div>
          <div>
            <p
              className="mb-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500"
              style={labelFont}
            >
              Authorities
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50" style={headlineFont}>
              {stats.sources || 0}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'grid gap-6 px-5 py-6 sm:px-6 sm:py-8 lg:px-8',
          showSourcesPanel
            ? 'lg:grid-cols-[minmax(0,1.62fr)_minmax(17.5rem,0.78fr)]'
            : 'lg:grid-cols-[minmax(0,1fr)]',
        )}
      >
        <section
          className={cn(
            'min-w-0 rounded-[6px] border border-slate-200/80 bg-white px-6 py-7 shadow-[0_12px_32px_rgba(42,52,57,0.04)] dark:border-slate-700/70 dark:bg-slate-900/82 sm:px-8 sm:py-8',
            !showSourcesPanel && 'max-w-none',
          )}
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-7 bg-slate-300 dark:bg-slate-600" />
            <div
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
              style={headlineFont}
            >
              <LibraryBig className="h-3.5 w-3.5" />
              Detailed analysis
            </div>
          </div>

          <div
            className={cn(
              'space-y-4 text-slate-700 dark:text-slate-200',
              '[&_h1]:mt-9 [&_h1]:text-[1.72rem] [&_h1]:font-extrabold [&_h1]:leading-tight [&_h1]:tracking-[-0.04em] [&_h1]:text-slate-950 dark:[&_h1]:text-slate-50',
              '[&_h2]:mt-8 [&_h2]:border-l-4 [&_h2]:border-slate-900 [&_h2]:pl-4 [&_h2]:text-[1.4rem] [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h2]:text-slate-900 dark:[&_h2]:border-slate-100 dark:[&_h2]:text-slate-100',
              '[&_h3]:mt-6 [&_h3]:text-[0.94rem] [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-[0.11em] [&_h3]:text-slate-600 dark:[&_h3]:text-slate-300',
              '[&_p]:text-[16px] [&_p]:leading-[1.68] [&_p]:text-slate-700 dark:[&_p]:text-slate-200',
              '[&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-slate-50',
              '[&_em]:text-slate-600 dark:[&_em]:text-slate-300',
              '[&_ul]:my-4 [&_ul]:space-y-2 [&_ul]:pl-5',
              '[&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:pl-5',
              '[&_li]:text-[16px] [&_li]:leading-[1.68]',
              '[&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#4c56af] [&_blockquote]:bg-[#f0f4f7] [&_blockquote]:px-5 [&_blockquote]:py-5 [&_blockquote]:italic [&_blockquote]:text-slate-800 dark:[&_blockquote]:border-[#929bfa] dark:[&_blockquote]:bg-slate-800/80 dark:[&_blockquote]:text-slate-100',
              '[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse',
              '[&_thead]:bg-[#e1e9ee] dark:[&_thead]:bg-slate-800/80',
              '[&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[0.11em] [&_th]:text-slate-900 dark:[&_th]:text-slate-100',
              '[&_tbody_tr]:border-t [&_tbody_tr]:border-slate-200 dark:[&_tbody_tr]:border-slate-700',
              '[&_tbody_tr:nth-child(even)]:bg-slate-50/60 dark:[&_tbody_tr:nth-child(even)]:bg-slate-800/30',
              '[&_td]:px-4 [&_td]:py-3.5 [&_td]:align-top [&_td]:text-[11px] [&_td]:leading-5 [&_td]:text-slate-600 dark:[&_td]:text-slate-300',
              '[&_td_p]:text-[15px]',
              '[&_code]:rounded-md [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] dark:[&_code]:bg-slate-800',
              '[&_hr]:my-6 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-700',
            )}
            style={bodyFont}
          >
            {children}
          </div>

          <div className="mt-8 rounded-[4px] border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-[12px] leading-6 text-slate-500 dark:border-slate-700/70 dark:bg-slate-800/40 dark:text-slate-400">
            <p style={labelFont}>
              This research summary is AI-generated. Confirm controlling statutes, regulations,
              and case law before relying on it for advice or filing strategy.
            </p>
          </div>

          {statChips.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2.5 border-t border-slate-200 pt-6 dark:border-slate-700">
              {statChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-sm border border-slate-300/80 bg-slate-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  style={labelFont}
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </section>

        {showSourcesPanel ? (
          <aside className="min-w-0 lg:sticky lg:top-3 lg:self-start">
            <div className="rounded-[6px] border border-slate-200/80 bg-white p-4 shadow-[0_12px_32px_rgba(42,52,57,0.04)] dark:border-slate-700/70 dark:bg-slate-900/82 sm:p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-sm border border-slate-200 bg-slate-50 p-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100">
                  <Scale className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p
                    className="mb-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500"
                    style={labelFont}
                  >
                    Citation Library
                  </p>
                  <h4
                    className="text-[1rem] font-bold tracking-[-0.02em] text-slate-950 dark:text-slate-50"
                    style={headlineFont}
                  >
                    Authorities & sources
                  </h4>
                  <p className="mt-1 text-[12px] leading-5 text-slate-600 dark:text-slate-300" style={bodyFont}>
                    Review supporting links, files, and cited materials used in this response.
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  'min-w-0 max-h-[72vh] overflow-y-auto pr-1',
                  '[&_[role=region]]:min-w-0',
                  '[&_[role=tablist]]:mb-3 [&_[role=tablist]]:gap-1.5 [&_[role=tablist]]:border-none',
                  '[&_[role=tab]]:rounded-sm [&_[role=tab]]:border [&_[role=tab]]:border-slate-200 [&_[role=tab]]:bg-slate-50 [&_[role=tab]]:px-2.5 [&_[role=tab]]:py-1 [&_[role=tab]]:text-[10px] [&_[role=tab]]:font-medium [&_[role=tab]]:uppercase [&_[role=tab]]:tracking-[0.12em] [&_[role=tab]]:text-slate-600 dark:[&_[role=tab]]:border-slate-700 dark:[&_[role=tab]]:bg-slate-800/60 dark:[&_[role=tab]]:text-slate-300',
                  '[&_[role=tab][data-state=active]]:border-slate-900 [&_[role=tab][data-state=active]]:bg-slate-900 [&_[role=tab][data-state=active]]:text-white dark:[&_[role=tab][data-state=active]]:border-slate-200 dark:[&_[role=tab][data-state=active]]:bg-slate-100 dark:[&_[role=tab][data-state=active]]:text-slate-900',
                  '[&_.scrollbar-none.grid]:grid-cols-1 [&_.scrollbar-none.grid]:gap-2 sm:[&_.scrollbar-none.grid]:grid-cols-2 lg:[&_.scrollbar-none.grid]:grid-cols-1',
                  '[&_a]:rounded-[4px] [&_a]:border [&_a]:border-slate-200 [&_a]:bg-slate-50/70 [&_a]:px-2.5 [&_a]:py-2 [&_a]:shadow-none hover:[&_a]:border-slate-300 hover:[&_a]:bg-white dark:[&_a]:border-slate-700 dark:[&_a]:bg-slate-800/50 dark:hover:[&_a]:border-slate-600 dark:hover:[&_a]:bg-slate-800/80',
                  '[&_button]:rounded-[4px] [&_button]:border [&_button]:border-slate-200 [&_button]:bg-slate-50/70 [&_button]:px-2.5 [&_button]:py-2 dark:[&_button]:border-slate-700 dark:[&_button]:bg-slate-800/50',
                  '[&_a_span]:leading-5 [&_button_span]:leading-5',
                  '[&_a_.line-clamp-2]:text-[12px] [&_button_.line-clamp-2]:text-[12px]',
                  '[&_a_.text-xs]:text-[10px] [&_button_.text-xs]:text-[10px]',
                )}
                style={labelFont}
              >
                {sources}
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
