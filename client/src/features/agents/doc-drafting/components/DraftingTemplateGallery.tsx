import { useMemo, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Loader2, Lock, Plus } from 'lucide-react';
import { useDraftingRegistry } from '../hooks/useDraftingRegistry';
import { useDraftingSession } from '../hooks/useDraftingSession';
import type { DraftingDocumentType, DraftingTemplate } from '../types';
import { cn } from '~/utils';

const PRIMARY_TEMPLATE_ORDER: DraftingDocumentType[] = [
  'affidavit',
  'will',
  'power_of_attorney',
  'civil_proceedings',
  'plaint',
  'income_tax',
  'income_tax_reply',
  'writ_petition',
  'contract',
  'legal_notice',
];

function resolvePrimaryTemplates(templates: DraftingTemplate[]) {
  const templateMap = new Map(templates.map((template) => [template.type, template]));
  return PRIMARY_TEMPLATE_ORDER.map((type) => templateMap.get(type)).filter(
    (template): template is DraftingTemplate => Boolean(template),
  );
}

export default function DraftingTemplateGallery() {
  const { templates, isLoading, error } = useDraftingRegistry();
  const { session, setDocumentType } = useDraftingSession();
  const [showMore, setShowMore] = useState(false);
  const selectionLocked = useMemo(
    () => Boolean(session.selectedDocumentType && session.activeStep !== 'select'),
    [session.activeStep, session.selectedDocumentType],
  );
  const primaryTemplates = useMemo(() => resolvePrimaryTemplates(templates), [templates]);
  const secondaryTemplates = useMemo(
    () => templates.filter((template) => !PRIMARY_TEMPLATE_ORDER.includes(template.type)),
    [templates],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-[#b8afa3]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading drafting templates…
      </div>
    );
  }

  return (
    <div id="doc-drafting-template-selection" className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#a79d90]">
            Step 1 · Select
          </p>
          <p className="mt-1 text-sm text-slate-700 dark:text-[#d0c5b7]">
            Select the document family to draft. Template variants and workbook downloads unlock in Step 2.
          </p>
        </div>
        {selectionLocked && (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Selection locked
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {error}. Showing local fallback templates.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {primaryTemplates.map((template) => {
          const isSelected = session.selectedDocumentType === template.type;
          const isDisabled = !template.enabled;

          return (
            <button
              key={template.id}
              type="button"
              disabled={isDisabled || selectionLocked}
              onClick={() => {
                setDocumentType(template.type);
              }}
              className={cn(
                'min-h-[176px] rounded-2xl border p-4 text-left transition-all',
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-[#d2b36c] dark:bg-[#221d16]'
                  : 'border-slate-200/80 bg-white/90 text-slate-900 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-[#f3efe5] dark:hover:border-[#d2b36c]/40',
                (isDisabled || selectionLocked) && 'cursor-not-allowed opacity-60',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-slate-900/5 p-2 dark:bg-white/10">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                    isSelected
                      ? 'bg-white/10 text-white'
                      : template.enabled
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100'
                        : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-[#b8afa3]',
                  )}
                >
                  {isSelected ? 'Selected' : template.enabled ? 'Enabled' : 'Coming soon'}
                </span>
              </div>

              <h4 className="mt-4 text-base font-semibold">{template.label}</h4>
              <p className={cn('mt-2 text-sm leading-6', isSelected ? 'text-white/85' : 'text-slate-600 dark:text-[#b8afa3]')}>
                {template.description}
              </p>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          className="min-h-[176px] rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-left transition-all hover:border-slate-400 hover:bg-slate-100/70 dark:border-white/15 dark:bg-white/5 dark:hover:border-[#d2b36c]/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-xl bg-slate-900/5 p-2 dark:bg-white/10">
              <Plus className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-white/10 dark:text-[#b8afa3]">
              More +
            </span>
          </div>

          <h4 className="mt-4 text-base font-semibold text-slate-900 dark:text-[#f3efe5]">More drafting types</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#b8afa3]">
            Reveal additional document families as the drafting studio expands.
          </p>
        </button>
      </div>

      {selectionLocked && (
        <p className="mt-4 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#a79d90]">
          <Lock className="h-3 w-3" />
          Start a new workflow to change the selected document family.
        </p>
      )}

      {showMore && (
        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-[#1b1814]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#f3efe5]">Additional drafting modules</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#b8afa3]">
                Secondary document families can be introduced here without changing the primary grid.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-white/10 dark:text-[#b8afa3]">
              {secondaryTemplates.length} modules
            </span>
          </div>

          {secondaryTemplates.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {secondaryTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl border border-slate-200 bg-white/90 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-[#f3efe5]">{template.label}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-white/10 dark:text-[#b8afa3]">
                      {template.enabled ? 'Enabled' : 'Coming soon'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#b8afa3]">{template.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/85 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-[#b8afa3]">
              No secondary modules are configured yet. Future categories can be added here without expanding Step 1.
            </div>
          )}
        </div>
      )}
    </div>
  );
}