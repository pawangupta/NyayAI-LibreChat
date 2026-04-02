import { useMemo } from 'react';
import { ArrowDown, CheckCircle2, Download, Eye, FileSpreadsheet, WandSparkles } from 'lucide-react';
import { resolveDocDraftingUrl } from '../config';
import { useDraftingSession } from '../hooks/useDraftingSession';
import { cn } from '~/utils';

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function DraftingProgressPanel() {
  const { session } = useDraftingSession();

  const resolvedDownloadUrl = useMemo(() => {
    return resolveDocDraftingUrl(session.lastDraft?.downloadUrl);
  }, [session.lastDraft?.downloadUrl]);

  const formattedGeneratedAt = useMemo(() => {
    const generatedAt = session.lastDraft?.generatedAt;
    if (!generatedAt) {
      return null;
    }

    const date = new Date(generatedAt);
    if (Number.isNaN(date.getTime())) {
      return generatedAt;
    }

    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }, [session.lastDraft?.generatedAt]);

  const progress = useMemo(() => {
    if (session.lastDraft) {
      return {
        eyebrow: 'Step 4 · Draft ready',
        title: 'Your draft is generated and ready for review',
        description:
          'Inspect the refreshed draft preview above or download the DOCX filing copy directly from this panel.',
        tone: 'success' as const,
      };
    }

    if (session.validation) {
      return {
        eyebrow: 'Step 3 · Validation complete',
        title: session.validation.valid ? 'Workbook validated successfully' : 'Validation needs attention',
        description: session.validation.summary ?? 'Review the workbook checks above before generating the draft.',
        tone: session.validation.valid ? ('success' as const) : ('warning' as const),
      };
    }

    if (session.parsedWorkbook) {
      return {
        eyebrow: 'Step 2 · Workbook parsed',
        title: 'Workbook details captured',
        description:
          'Review the parsed workbook summary and required fields above, then validate when the workbook looks complete.',
        tone: 'default' as const,
      };
    }

    return {
      eyebrow: 'Step 1 · Start here',
      title: 'Pick a workbook template and upload it',
      description:
        'Use the template downloads above, complete the workbook, and upload it in the intake section to begin the structured drafting flow.',
      tone: 'default' as const,
    };
  }, [session.lastDraft, session.parsedWorkbook, session.validation]);

  return (
    <div
      id="doc-drafting-progress-panel"
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-[#a79d90]">
            {progress.eyebrow}
          </p>
          <h4 className="text-lg font-semibold text-slate-900 dark:text-[#f3efe5]">
            {progress.title}
          </h4>
          <p
            className={cn(
              'max-w-3xl text-sm leading-6',
              progress.tone === 'success'
                ? 'text-emerald-700 dark:text-emerald-300'
                : progress.tone === 'warning'
                  ? 'text-amber-700 dark:text-amber-200'
                  : 'text-slate-600 dark:text-[#b8afa3]',
            )}
          >
            {progress.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-[420px] lg:justify-end">
          {!session.parsedWorkbook && (
            <button
              type="button"
              onClick={() => scrollToSection('doc-drafting-template-downloads')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#1b1814] dark:text-[#f3efe5]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Template downloads
            </button>
          )}

          {!session.lastDraft && (
            <button
              type="button"
              onClick={() => scrollToSection('doc-drafting-workbook-panel')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-slate-800 dark:bg-[#d2b36c] dark:text-[#1b1814]"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Continue in intake
            </button>
          )}

          {session.validation?.valid && !session.lastDraft && (
            <button
              type="button"
              onClick={() => scrollToSection('doc-drafting-workbook-panel')}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Generate draft
            </button>
          )}

          {session.lastDraft && resolvedDownloadUrl && (
            <>
              <button
                type="button"
                onClick={() => scrollToSection('doc-drafting-generated-preview')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#1b1814] dark:text-[#f3efe5]"
              >
                <Eye className="h-3.5 w-3.5" />
                Review draft
              </button>
              <button
                type="button"
                onClick={() => window.open(resolvedDownloadUrl, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#d2b36c] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1b1814] hover:bg-[#debf78]"
              >
                <Download className="h-3.5 w-3.5" />
                Download .docx
              </button>
            </>
          )}
        </div>
      </div>

      {(session.parsedWorkbook || session.validation || session.lastDraft) && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 dark:border-white/10 dark:bg-[#1b1814]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#a79d90]">
              Workbook
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-[#f3efe5]">
              {session.parsedWorkbook?.fileName ?? 'Awaiting upload'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 dark:border-white/10 dark:bg-[#1b1814]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#a79d90]">
              Validation
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-[#f3efe5]">
              {session.validation
                ? session.validation.valid
                  ? 'Ready for generation'
                  : 'Needs fixes'
                : 'Not run yet'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 dark:border-white/10 dark:bg-[#1b1814]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#a79d90]">
              Draft output
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-[#f3efe5]">
              {session.lastDraft ? formattedGeneratedAt ?? 'Generated' : 'Not generated yet'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}