import { useMemo, type ReactNode } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  Check,
  Download,
  FileOutput,
  FileSearch,
  FileSpreadsheet,
  LoaderCircle,
  Scale,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { ContentTypes, type TMessageContentParts } from 'librechat-data-provider';
import { cn } from '~/utils';

const CONTRACT_REVIEW_ENDPOINTS = new Set(['contract review', 'legalcontract']);
const CONTRACT_REVIEW_MODELS = new Set([
  'tabular contract review',
  'legal contract analyzer',
  'comprehensive contract review',
]);
const PREVIEW_MAX_LENGTH = 260;
const headlineFont = { fontFamily: 'Manrope, Inter, sans-serif' } as const;
const bodyFont = { fontFamily: 'Inter, Manrope, sans-serif' } as const;
const labelFont = { fontFamily: 'Inter, Manrope, sans-serif' } as const;

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

export function isContractReviewResponse({
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

  return (
    CONTRACT_REVIEW_ENDPOINTS.has(normalize(endpoint)) ||
    CONTRACT_REVIEW_MODELS.has(normalize(model))
  );
}

function collectContractReviewText({
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

  return (textParts.join('\n\n') || fallbackText || '').trim();
}

export function extractContractReviewRawText({
  content,
  fallbackText,
}: {
  content?: Array<TMessageContentParts | undefined>;
  fallbackText?: string;
}) {
  return collectContractReviewText({ content, fallbackText });
}

export function extractContractReviewPreview({
  content,
  fallbackText,
}: {
  content?: Array<TMessageContentParts | undefined>;
  fallbackText?: string;
}) {
  const combined = collectContractReviewText({ content, fallbackText })
    .replace(/:::thinking[\s\S]*?:::/g, ' ')
    .replace(/:::artifact\{[\s\S]*?:::/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*Need more help\?[\s\S]*$/i, ' ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_`>|]/g, ' ')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/^\|.*\|$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (combined.length <= PREVIEW_MAX_LENGTH) {
    return combined;
  }

  return `${combined.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}…`;
}

export function sanitizeContractReviewDisplayText(text?: string) {
  if (!text) {
    return '';
  }

  return text
    .replace(
      /^.*(?:Read\s+\d+\s+pages\s+and\s+[\d,]+\s+characters|Starting agent orchestration|Understanding your request|Analysis type:|AI-Powered Deep Analysis|Phase\s+[1-4]:|Identified\s+\d+\s+clauses|Legal Provision Classification complete|Clause Classification complete|High Court Precedent complete|Supreme Court Precedent complete|Entailment Analysis complete|Analysis complete(?:\s*\(\d+\/\d+\s+dimensions\s+successful\))?|Analysis complete!|Generating Excel report).*$/gim,
      '',
    )
    .replace(
      /\n##\s*(?:📈\s*)?Analysis Statistics[\s\S]*?(?=\n##\s|\n#\s|$)/gi,
      '\n',
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractMarkdownLink(markdown: string, labelFragment: string | string[]) {
  const labels = Array.isArray(labelFragment) ? labelFragment : [labelFragment];

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\[[^\\]]*${escaped}[^\\]]*\\]\\((https?:\\/\\/[^)]+)\\)`, 'i');
    const match = markdown.match(pattern)?.[1];
    if (match) {
      return match;
    }
  }

  return markdown.match(/\((https?:\/\/[^)\s]+\/outputs\/[^)\s]+(?:\.xlsx|\.xlsm|\.xls))\)/i)?.[1];
}

type ProgressPhase = {
  key: string;
  title: string;
  status: 'complete' | 'active' | 'pending';
  summary: string;
  tasks?: string[];
};

type ContractProgressData = {
  pages?: number;
  characters?: number;
  clauses?: number;
  confidence?: number;
  reviewMode?: string;
  phases: ProgressPhase[];
};

function cleanProgressLine(line: string) {
  return line
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_`>#]/g, ' ')
    .replace(/^[-•]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function parseContractProgress(markdown: string): ContractProgressData | null {
  const lines = sanitizeContractReviewDisplayText(markdown)
    .split('\n')
    .map(cleanProgressLine)
    .filter(Boolean);

  const progressLines = lines.filter((line) =>
    /read \d+ pages|starting agent orchestration|understanding your request|analysis type:|phase \d+:|identified \d+ clauses|analysis complete/i.test(
      line,
    ),
  );

  if (progressLines.length < 6) {
    return null;
  }

  const pageMatch = progressLines
    .find((line) => /read \d+ pages/i.test(line))
    ?.match(/read\s+(\d+)\s+pages\s+and\s+([\d,]+)\s+characters/i);
  const analysisMatch = progressLines
    .find((line) => /analysis type:/i.test(line))
    ?.match(/analysis type:\s*([^()]+?)(?:\s*\(confidence:\s*(\d+)%\))?$/i);
  const clausesMatch = progressLines
    .find((line) => /identified \d+ clauses/i.test(line))
    ?.match(/identified\s+(\d+)\s+clauses/i);
  const dimensionMatch = progressLines
    .find((line) => /analysis complete \(\d+\/\d+ dimensions successful\)/i.test(line))
    ?.match(/analysis complete \((\d+)\/(\d+) dimensions successful\)/i);

  const phase2Tasks = progressLines.filter(
    (line) =>
      /classification complete|precedent complete|entailment analysis complete|dimensions successful/i.test(
        line,
      ),
  );

  const hasPhase2 = progressLines.some((line) => /phase 2:/i.test(line));
  const hasPhase3 = progressLines.some((line) => /phase 3:/i.test(line));
  const hasPhase4 = progressLines.some((line) => /phase 4:/i.test(line));
  const isCompleted =
    lines.some((line) => /analysis complete!?/i.test(line)) ||
    /download excel report|excel report ready|analysis completed for:/i.test(markdown);
  const activePhase = isCompleted ? 4 : hasPhase4 ? 4 : hasPhase3 ? 3 : hasPhase2 ? 2 : 1;

  const reviewMode = analysisMatch?.[1]?.trim();
  const confidence = analysisMatch?.[2] ? Number(analysisMatch[2]) : undefined;
  const clauses = clausesMatch?.[1] ? Number(clausesMatch[1]) : undefined;
  const dimensionsSummary = dimensionMatch
    ? `${dimensionMatch[1]}/${dimensionMatch[2]} dimensions completed`
    : undefined;

  const phases: ProgressPhase[] = [
    {
      key: 'phase-1',
      title: 'Phase 1: Processing',
      status: isCompleted || activePhase > 1 ? 'complete' : 'active',
      summary: pageMatch
        ? `Document ingestion is complete with ${pageMatch[1]} pages and ${pageMatch[2]} characters parsed. Request understanding and review routing have been initialized.`
        : 'Document ingestion and initial request understanding are underway.',
      tasks: progressLines.filter((line) =>
        /starting agent orchestration|understanding your request|analysis type:/i.test(line),
      ),
    },
    {
      key: 'phase-2',
      title: 'Phase 2: Multi-dimensional Analysis',
      status: isCompleted ? 'complete' : activePhase === 2 ? 'active' : activePhase > 2 ? 'complete' : 'pending',
      summary:
        clauses != null
          ? `${clauses} clauses identified for clause classification, precedent review, and entailment checks${dimensionsSummary ? `. ${dimensionsSummary}.` : '.'}`
          : 'Deep review is running across clause, precedent, and consistency dimensions.',
      tasks: phase2Tasks.map((line) => line.replace(/ complete$/i, '')).map(titleCase),
    },
    {
      key: 'phase-3',
      title: 'Phase 3: Synthesizing Findings',
      status: isCompleted ? 'complete' : activePhase === 3 ? 'active' : activePhase > 3 ? 'complete' : 'pending',
      summary:
        'Findings are being consolidated into negotiation posture, enforceability observations, and clause-level recommendations.',
    },
    {
      key: 'phase-4',
      title: 'Phase 4: Report Generation',
      status: isCompleted ? 'complete' : activePhase === 4 ? 'active' : 'pending',
      summary:
        'Deliverables are being assembled into structured exports, including the Excel review workbook and supporting summaries.',
    },
  ];

  return {
    pages: pageMatch?.[1] ? Number(pageMatch[1]) : undefined,
    characters: pageMatch?.[2] ? Number(pageMatch[2].replace(/,/g, '')) : undefined,
    clauses,
    confidence,
    reviewMode,
    phases,
  };
}

function ProgressPhaseIcon({
  status,
  index,
}: {
  status: ProgressPhase['status'];
  index: number;
}) {
  if (status === 'complete') {
    return <Check className="h-5 w-5" />;
  }

  if (status === 'active') {
    return index === 1 ? <BrainCircuit className="h-5 w-5" /> : <LoaderCircle className="h-5 w-5 animate-spin" />;
  }

  return index === 2 ? <Workflow className="h-5 w-5" /> : index === 3 ? <FileOutput className="h-5 w-5" /> : <FileSearch className="h-5 w-5" />;
}

function ContractProgressTimeline({ progress }: { progress: ContractProgressData }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2.5 border-b border-stone-200/80 pb-5 dark:border-slate-700/80">
        {progress.pages != null ? (
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-stone-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" style={labelFont}>
            {progress.pages} pages
          </span>
        ) : null}
        {progress.characters != null ? (
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-stone-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" style={labelFont}>
            {progress.characters.toLocaleString()} chars
          </span>
        ) : null}
        {progress.clauses != null ? (
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-stone-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" style={labelFont}>
            {progress.clauses} clauses
          </span>
        ) : null}
        {progress.reviewMode ? (
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" style={labelFont}>
            {progress.reviewMode}
          </span>
        ) : null}
        {progress.confidence != null ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" style={labelFont}>
            {progress.confidence}% confidence
          </span>
        ) : null}
      </div>

      <div className="relative">
        <div className="absolute left-[1.45rem] top-0 bottom-0 w-px bg-stone-200 dark:bg-slate-700" />
        <div className="space-y-8">
          {progress.phases.map((phase, index) => {
            const tone =
              phase.status === 'complete'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                : phase.status === 'active'
                  ? 'bg-indigo-100 text-indigo-700 ring-4 ring-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-950/40'
                  : 'bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400';

            const cardTone =
              phase.status === 'active'
                ? 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/70 dark:bg-indigo-950/20'
                : 'border-stone-200/80 bg-stone-50/50 dark:border-slate-700/80 dark:bg-slate-800/30';

            return (
              <div key={phase.key} className="relative flex gap-5">
                <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/70 shadow-sm dark:border-slate-900/60">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', tone)}>
                    <ProgressPhaseIcon status={phase.status} index={index} />
                  </div>
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-[1.02rem] font-bold text-stone-950 dark:text-slate-50" style={headlineFont}>
                      {phase.title}
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-stone-400 dark:text-slate-500" style={labelFont}>
                      {phase.status}
                    </span>
                  </div>

                  <p className="mt-2 text-[15px] leading-7 text-stone-700 dark:text-slate-200" style={bodyFont}>
                    {phase.summary}
                  </p>

                  {phase.tasks && phase.tasks.length > 0 ? (
                    <div className="mt-4 grid gap-3">
                      {phase.tasks.slice(0, 4).map((task) => (
                        <div
                          key={task}
                          className={cn(
                            'flex items-center justify-between rounded-xl border px-4 py-3 text-sm',
                            cardTone,
                          )}
                          style={labelFont}
                        >
                          <span className="text-stone-700 dark:text-slate-200">{task}</span>
                          {phase.status === 'active' ? (
                            <div className="flex gap-1.5">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:0ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:120ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:240ms]" />
                            </div>
                          ) : (
                            <Check className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function extractMetric(markdown: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`\\*\\*${escaped}:\\*\\*\\s*([0-9]+(?:\\.[0-9]+)?)`, 'i'),
    new RegExp(`${escaped}:\\s*([0-9]+(?:\\.[0-9]+)?)`, 'i'),
    new RegExp(`[-*]\\s*${escaped}:\\s*([0-9]+(?:\\.[0-9]+)?)`, 'i'),
  ];

  for (const pattern of patterns) {
    const value = markdown.match(pattern)?.[1];
    if (value) {
      return Number(value);
    }
  }

  return null;
}

function extractDimensions(markdown: string) {
  const match = markdown.match(/Dimensions Analyzed:\s*(\d+)\s*\/\s*(\d+)/i);
  if (!match) {
    return null;
  }

  return {
    successful: Number(match[1]),
    total: Number(match[2]),
  };
}

function extractAnalyzedFile(markdown: string) {
  return markdown.match(/Analysis completed for:\s*([^\n*]+)/i)?.[1]?.trim() ?? '';
}

function extractSectionCount(markdown: string) {
  return (markdown.match(/^##\s+/gm) ?? []).length;
}

function getRiskTone(score: number | null) {
  if (score == null) {
    return {
      label: 'Pending score',
      chipClass: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
      barClass: 'bg-slate-500',
      valueClass: 'text-slate-900 dark:text-slate-50',
    };
  }

  if (score >= 70) {
    return {
      label: 'High risk',
      chipClass: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
      barClass: 'bg-rose-500',
      valueClass: 'text-rose-700 dark:text-rose-300',
    };
  }

  if (score >= 40) {
    return {
      label: 'Moderate risk',
      chipClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
      barClass: 'bg-amber-500',
      valueClass: 'text-amber-700 dark:text-amber-300',
    };
  }

  return {
    label: 'Lower risk',
    chipClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    barClass: 'bg-emerald-500',
    valueClass: 'text-emerald-700 dark:text-emerald-300',
  };
}

type ContractReviewWrapperProps = {
  children: ReactNode;
  previewText?: string;
  rawText?: string;
  className?: string;
};

export default function ContractReviewWrapper({
  children,
  previewText: _previewText,
  rawText,
  className,
}: ContractReviewWrapperProps) {
  const contractText = rawText ?? '';
  const riskScore = useMemo(() => extractMetric(contractText, 'Risk Score'), [contractText]);
  const totalClauses = useMemo(() => extractMetric(contractText, 'Total Clauses'), [contractText]);
  const dimensions = useMemo(() => extractDimensions(contractText), [contractText]);
  const downloadUrl = useMemo(
    () => extractMarkdownLink(contractText, ['Download Excel Report', 'Download Excel']),
    [contractText],
  );
  const analyzedFile = useMemo(() => extractAnalyzedFile(contractText), [contractText]);
  const sectionCount = useMemo(() => extractSectionCount(contractText), [contractText]);
  const riskTone = useMemo(() => getRiskTone(riskScore), [riskScore]);
  const showSidebar = Boolean(downloadUrl);
  const progressData = useMemo(() => parseContractProgress(contractText), [contractText]);

  const sectionChips = useMemo(() => {
    const chips: string[] = [];
    if (/Executive Summary/i.test(contractText)) {
      chips.push('Executive summary');
    }
    if (/Key Recommendations/i.test(contractText)) {
      chips.push('Recommendations');
    }
    if (/Clause Preview/i.test(contractText)) {
      chips.push('Clause preview');
    }
    if (/Comprehensive Report/i.test(contractText) || downloadUrl) {
      chips.push('Export package');
    }
    return chips;
  }, [contractText, downloadUrl]);

  return (
    <div
      data-contract-review-wrapper="true"
      className={cn(
        'my-4 overflow-hidden rounded-[18px] border border-stone-200/80 bg-[#f7f5f1] shadow-[0_20px_60px_rgba(62,56,45,0.08)] dark:border-slate-700/70 dark:bg-[#12161c]',
        className,
      )}
    >
      <div className="border-b border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,251,245,0.92),rgba(247,245,241,1))] px-6 py-8 dark:border-slate-700/70 dark:bg-[linear-gradient(180deg,rgba(18,22,28,0.98),rgba(18,22,28,1))] sm:px-8 sm:py-9">
        <div className="border-l-4 border-stone-900 pl-6 dark:border-slate-100">
          <p
            className="mb-2 text-[10px] uppercase tracking-[0.24em] text-stone-500 dark:text-slate-400"
            style={labelFont}
          >
            Structured Contract Review
          </p>
          <div className="flex flex-wrap items-center gap-2 text-stone-500 dark:text-slate-400">
            <span
              className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={labelFont}
            >
              <Scale className="h-3.5 w-3.5" />
              Contract Review Dossier
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                riskTone.chipClass,
              )}
              style={labelFont}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {riskTone.label}
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            <h3
              className="text-[1.95rem] font-extrabold leading-tight tracking-[-0.04em] text-stone-950 dark:text-slate-50 sm:text-[2.3rem]"
              style={headlineFont}
            >
              Contract risks, clause posture, and negotiation actions
            </h3>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-stone-400 dark:text-slate-500" style={labelFont}>
              Risk score
            </p>
            <p className={cn('text-sm font-bold', riskTone.valueClass)} style={headlineFont}>
              {riskScore != null ? `${riskScore.toFixed(1)}/100` : 'Pending'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-stone-400 dark:text-slate-500" style={labelFont}>
              Clauses
            </p>
            <p className="text-sm font-bold text-stone-950 dark:text-slate-50" style={headlineFont}>
              {totalClauses ?? '—'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-stone-400 dark:text-slate-500" style={labelFont}>
              Dimensions
            </p>
            <p className="text-sm font-bold text-stone-950 dark:text-slate-50" style={headlineFont}>
              {dimensions ? `${dimensions.successful}/${dimensions.total}` : '—'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-stone-400 dark:text-slate-500" style={labelFont}>
              Sections
            </p>
            <p className="text-sm font-bold text-stone-950 dark:text-slate-50" style={headlineFont}>
              {sectionCount || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="min-w-0 rounded-[6px] border border-stone-200/80 bg-white px-6 py-7 shadow-[0_12px_32px_rgba(62,56,45,0.05)] dark:border-slate-700/70 dark:bg-slate-900/82 sm:px-8 sm:py-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-7 bg-stone-300 dark:bg-slate-600" />
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-slate-400" style={headlineFont}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Review findings
            </div>
          </div>

          <div
            className={cn(
              'space-y-4 text-stone-700 dark:text-slate-200',
              '[&_h1]:mt-8 [&_h1]:text-[1.72rem] [&_h1]:font-extrabold [&_h1]:leading-tight [&_h1]:tracking-[-0.04em] [&_h1]:text-stone-950 dark:[&_h1]:text-slate-50',
              '[&_h2]:mt-7 [&_h2]:border-l-4 [&_h2]:border-stone-900 [&_h2]:pl-4 [&_h2]:text-[1.3rem] [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h2]:text-stone-900 dark:[&_h2]:border-slate-100 dark:[&_h2]:text-slate-100',
              '[&_h3]:mt-6 [&_h3]:text-[0.95rem] [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-[0.11em] [&_h3]:text-stone-600 dark:[&_h3]:text-slate-300',
              '[&_p]:text-[15px] [&_p]:leading-[1.7] [&_p]:text-stone-700 dark:[&_p]:text-slate-200',
              '[&_strong]:font-semibold [&_strong]:text-stone-950 dark:[&_strong]:text-slate-50',
              '[&_em]:text-stone-600 dark:[&_em]:text-slate-300',
              '[&_ul]:my-4 [&_ul]:space-y-2 [&_ul]:pl-5',
              '[&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:pl-5',
              '[&_li]:text-[15px] [&_li]:leading-[1.68]',
              '[&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#7c5c27] [&_blockquote]:bg-[#faf4ea] [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:italic [&_blockquote]:text-stone-800 dark:[&_blockquote]:border-[#d2b98a] dark:[&_blockquote]:bg-slate-800/80 dark:[&_blockquote]:text-slate-100',
              '[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse',
              '[&_thead]:bg-[#efe7d9] dark:[&_thead]:bg-slate-800/80',
              '[&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[0.11em] [&_th]:text-stone-900 dark:[&_th]:text-slate-100',
              '[&_tbody_tr]:border-t [&_tbody_tr]:border-stone-200 dark:[&_tbody_tr]:border-slate-700',
              '[&_tbody_tr:nth-child(even)]:bg-stone-50/60 dark:[&_tbody_tr:nth-child(even)]:bg-slate-800/30',
              '[&_td]:px-4 [&_td]:py-3.5 [&_td]:align-top [&_td]:text-[11px] [&_td]:leading-5 [&_td]:text-stone-600 dark:[&_td]:text-slate-300',
              '[&_td_p]:text-[14px]',
              '[&_code]:rounded-md [&_code]:bg-stone-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[12px] dark:[&_code]:bg-slate-800',
              '[&_hr]:my-6 [&_hr]:border-stone-200 dark:[&_hr]:border-slate-700',
            )}
            style={bodyFont}
          >
            {progressData ? (
              <div className="space-y-8">
                <ContractProgressTimeline progress={progressData} />
                <div className="border-t border-stone-200/80 pt-8 dark:border-slate-700/80">{children}</div>
              </div>
            ) : (
              children
            )}
          </div>

          <div className="mt-8 rounded-[4px] border border-stone-200/80 bg-stone-50/80 px-4 py-3 text-[12px] leading-6 text-stone-500 dark:border-slate-700/70 dark:bg-slate-800/40 dark:text-slate-400">
            <p style={labelFont}>
              Review outputs are AI-generated. Confirm clause wording, governing law, fallback
              positions, and negotiation strategy before sharing externally or relying on them.
            </p>
          </div>

          {sectionChips.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-2.5 border-t border-stone-200 pt-6 dark:border-slate-700">
              {sectionChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-sm border border-stone-300/80 bg-stone-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-stone-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  style={labelFont}
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {showSidebar ? (
          <aside className="min-w-0">
            <div className="space-y-4">
              {downloadUrl ? (
                <div className="rounded-[6px] border border-stone-200/80 bg-white p-4 shadow-[0_12px_32px_rgba(62,56,45,0.05)] dark:border-slate-700/70 dark:bg-slate-900/82 sm:p-5">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-stone-400 dark:text-slate-500" style={labelFont}>
                    Deliverables
                  </p>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    style={labelFont}
                  >
                    <Download className="h-4 w-4" />
                    Download Excel report
                  </a>
                  <p className="mt-3 text-[12px] leading-5 text-stone-500 dark:text-slate-400" style={bodyFont}>
                    Export the clause sheet, risk matrix, precedents, and actions for offline review.
                  </p>
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}