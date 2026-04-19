import { CheckCircle2, FileSearch, HelpCircle, Scale, Search, Sparkles } from 'lucide-react';
import type { Agents } from 'librechat-data-provider';
import { cn } from '~/utils';

type LegalResearchAgentUpdate = Agents.AgentUpdate['agent_update'];

const STAGE_META: Record<
  string,
  {
    label: string;
    detail: string;
    Icon: typeof Scale;
  }
> = {
  understanding_facts: {
    label: 'Understanding the facts of your matter',
    detail: 'Sorting the facts that affect the legal route.',
    Icon: Scale,
  },
  identifying_issues: {
    label: 'Identifying the legal issues that matter most',
    detail: 'Separating the main issue from supporting points.',
    Icon: Sparkles,
  },
  retrieval: {
    label: 'Searching the most relevant judgments',
    detail: 'Looking for authorities that closely match your facts and posture.',
    Icon: Search,
  },
  authority_check: {
    label: 'Checking which authorities genuinely support the route',
    detail: 'Filtering out authorities that do not directly help this position.',
    Icon: FileSearch,
  },
  strategy_build: {
    label: 'Preparing strategy options',
    detail: 'Turning the supported authorities into practical legal routes.',
    Icon: Sparkles,
  },
  refinement_update: {
    label: 'Adjusting the strategy to reflect the new fact',
    detail: 'Reworking the position in light of the latest development.',
    Icon: Scale,
  },
  clarification_needed: {
    label: 'Pinpointing the fact that needs confirmation',
    detail: 'A small factual detail may change the legal route.',
    Icon: HelpCircle,
  },
  finalising: {
    label: 'Preparing the final research note',
    detail: 'Putting the supported route and risks into a usable answer.',
    Icon: CheckCircle2,
  },
};

export function isLegalResearchAgentUpdate(update?: Partial<LegalResearchAgentUpdate> | null) {
  if (!update) {
    return false;
  }

  const agentId = update.agentId?.toLowerCase() ?? '';
  return agentId.includes('legal_research') || Boolean(update.stage || update.label || update.detail);
}

export default function LegalResearchProgress({
  update,
}: {
  update?: Partial<LegalResearchAgentUpdate> | null;
}) {
  if (!update) {
    return null;
  }

  const meta = (update.stage && STAGE_META[update.stage]) || STAGE_META.understanding_facts;
  const Icon = meta.Icon;
  const status = update.status ?? 'active';
  const label = update.label ?? meta.label;
  const detail = update.detail ?? meta.detail;

  return (
    <div
      className={cn(
        'my-4 rounded-2xl border bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,249,251,1))] px-4 py-3 shadow-[0_14px_30px_rgba(42,52,57,0.06)] dark:bg-[linear-gradient(180deg,rgba(34,31,27,0.98),rgba(26,25,22,1))]',
        status === 'completed'
          ? 'border-emerald-200/80 dark:border-[#c9a85c]/40'
          : status === 'warning'
            ? 'border-amber-200/80 dark:border-amber-700/40'
            : 'border-slate-200/80 dark:border-white/10',
      )}
      data-legal-research-progress={update.stage ?? 'general'}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
            status === 'completed'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-[#c9a85c]/50 dark:bg-[#2a2418] dark:text-[#d8ba76]'
              : status === 'warning'
                ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-[#2b2117] dark:text-amber-300'
                : 'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-[#24211d] dark:text-[#e8dcc5]',
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-[#f3efe5]">{label}</p>
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]',
                status === 'completed'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-[#3a301e] dark:text-[#d8ba76]'
                  : status === 'warning'
                    ? 'bg-amber-100 text-amber-700 dark:bg-[#3b2618] dark:text-amber-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-[#312d28] dark:text-[#b7aea1]',
              )}
            >
              {status === 'completed' ? 'done' : status}
            </span>
          </div>
          {detail ? <p className="mt-1 text-sm text-slate-600 dark:text-[#b7aea1]">{detail}</p> : null}
        </div>
      </div>
    </div>
  );
}