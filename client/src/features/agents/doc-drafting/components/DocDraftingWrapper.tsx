import { useMemo, type ReactNode } from 'react';
import { FileStack, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { ContentTypes, type TMessageContentParts } from 'librechat-data-provider';
import { cn } from '~/utils';
import { isDocDraftingEndpointName, isDocDraftingModelName } from '../config';
import { DRAFTING_STEP_METADATA } from '../lib/stepMetadata';
import DraftingTemplateGallery from './DraftingTemplateGallery';
import DraftingTopStepper from './DraftingTopStepper';
import DraftingWorkbookPanel from './DraftingWorkbookPanel';
import { useDraftingSession } from '../hooks/useDraftingSession';

const PREVIEW_MAX_LENGTH = 260;
const headlineFont = { fontFamily: 'Manrope, Inter, sans-serif' } as const;
const bodyFont = { fontFamily: 'Inter, Manrope, sans-serif' } as const;
const labelFont = { fontFamily: 'Inter, Manrope, sans-serif' } as const;

export function isDocDraftingResponse({
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

  return isDocDraftingEndpointName(endpoint) || isDocDraftingModelName(model);
}

export function extractDocDraftingPreview({
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
  }

  const combined = (textParts.join(' ') || fallbackText || '')
    .replace(/:::thinking[\s\S]*?:::/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*Need more help\?[\s\S]*$/i, ' ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_`>|]/g, ' ')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (combined.length <= PREVIEW_MAX_LENGTH) {
    return combined;
  }

  return `${combined.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}…`;
}

type DocDraftingWrapperProps = {
  children: ReactNode;
  previewText?: string;
  className?: string;
};

export default function DocDraftingWrapper({
  children,
  previewText,
  className,
}: DocDraftingWrapperProps) {
  const { session, resetDraftingSession } = useDraftingSession();
  const summary = useMemo(
    () =>
      previewText?.trim() ||
      'Template-guided drafting with workflow visibility, validation readiness, and revision support.',
    [previewText],
  );
  const currentStep = DRAFTING_STEP_METADATA[session.activeStep];

  return (
    <div
      data-doc-drafting-wrapper="true"
      className={cn(
        'my-4 overflow-hidden rounded-[20px] border border-slate-200/80 bg-[#faf8f3] shadow-[0_20px_60px_rgba(42,52,57,0.07)] dark:border-white/10 dark:bg-[#171512] dark:shadow-[0_24px_64px_rgba(0,0,0,0.32)]',
        className,
      )}
    >
      <div className="border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(250,248,243,1))] px-6 py-6 dark:border-white/7 dark:bg-[linear-gradient(180deg,rgba(30,27,22,0.98),rgba(23,21,18,1))] sm:px-8 sm:py-8">
        <div className="border-l-4 border-slate-900 pl-6 dark:border-[#c9a85c]">
          <p
            className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-[#8f887c]"
            style={labelFont}
          >
            Structured Legal Drafting
          </p>
          <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-[#938a7c]">
            <span
              className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={labelFont}
            >
              <FileStack className="h-3.5 w-3.5" />
              Drafting Assistant
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em]"
              style={labelFont}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Affidavit-first workflow
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <h3
              className="text-[1.75rem] font-extrabold leading-tight tracking-[-0.04em] text-slate-900 dark:text-[#f3efe5] sm:text-[2.15rem]"
              style={headlineFont}
            >
              Structured drafting with guided validation and export-ready output
            </h3>
            <p
              className="max-w-3xl text-[14px] leading-6 text-slate-600 dark:text-[#b7aea1]"
              style={bodyFont}
            >
              {summary}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_320px]">
          <DraftingTopStepper activeStep={session.activeStep} />
          <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-900/5 p-2 dark:bg-white/10">
                <ShieldCheck className="h-5 w-5 text-slate-900 dark:text-[#d2b36c]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#a79d90]" style={labelFont}>
                  Current focus
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-[#f3efe5]" style={headlineFont}>
                  {currentStep.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#b8afa3]" style={bodyFont}>
                  {currentStep.description}
                </p>
                {(session.selectedDocumentType || session.parsedWorkbook || session.lastDraft) && (
                  <button
                    type="button"
                    onClick={resetDraftingSession}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#1b1814] dark:text-[#f3efe5]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Start new workflow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
        <DraftingTemplateGallery />
        <DraftingWorkbookPanel />
        {!session.parsedWorkbook && !session.validation && !session.lastDraft ? children : null}
      </div>
    </div>
  );
}
