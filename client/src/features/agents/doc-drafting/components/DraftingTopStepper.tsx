import { cn } from '~/utils';
import { DRAFTING_STEP_METADATA, DRAFTING_STEP_ORDER } from '../lib/stepMetadata';
import type { DraftingStepKey } from '../types';

type DraftingTopStepperProps = {
  activeStep: DraftingStepKey;
};

export default function DraftingTopStepper({ activeStep }: DraftingTopStepperProps) {
  const activeIndex = DRAFTING_STEP_ORDER.indexOf(activeStep);

  return (
    <div className="grid gap-2 md:grid-cols-4">
      {DRAFTING_STEP_ORDER.map((step, index) => {
        const meta = DRAFTING_STEP_METADATA[step];
        const isActive = activeStep === step;
        const isComplete = index < activeIndex;

        return (
          <div
            key={step}
            className={cn(
              'rounded-2xl border px-3 py-2.5 transition-colors',
              isActive
                ? 'border-slate-900 bg-slate-900 text-white dark:border-[#d2b36c] dark:bg-[#221d16]'
                : isComplete
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100'
                  : 'border-slate-200/80 bg-white/80 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-[#b8afa3]',
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">Step {index + 1}</p>
            <p className="mt-1.5 text-sm font-semibold">{meta.label}</p>
            <p className="mt-0.5 text-[11px] leading-5 opacity-80">{meta.description}</p>
          </div>
        );
      })}
    </div>
  );
}
