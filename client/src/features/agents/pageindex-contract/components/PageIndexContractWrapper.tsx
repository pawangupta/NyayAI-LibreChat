import { useState, useMemo, type ReactNode } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  FileText,
  Info,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import { ContentTypes, type TMessageContentParts } from 'librechat-data-provider';
import { cn } from '~/utils';
import {
  isPageIndexContractEndpointName,
  isPageIndexContractModelName,
} from '../config';

// ── Font tokens (matches existing wrappers) ────────────────────────────────
const headlineFont = { fontFamily: 'Manrope, Inter, sans-serif' } as const;
const bodyFont = { fontFamily: 'Inter, Manrope, sans-serif' } as const;
const labelFont = { fontFamily: 'Inter, Manrope, sans-serif' } as const;

// ── Types ──────────────────────────────────────────────────────────────────
type RiskLevel = 'High' | 'Medium' | 'Low';

interface Finding {
  id: string;
  title: string;
  section: string;
  risk_level: RiskLevel;
  pages: number[];
  answer: string;
  recommendation: string;
  quote?: string;
}

interface SummaryRow {
  id: string;
  clause: string;
  issue: string;
  riskLevel: RiskLevel;
  page: number;
}

interface ContractAnalysisPayload {
  executive_summary: string;
  findings: Finding[];
  summary_table: SummaryRow[];
  question: string;
  contract_id?: string;
  document_name?: string;
  preview_path?: string;
  page_count?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Extract the JSON payload from a :::pageindex-contract or :::pageindex-risk block. */
function parsePayload(rawText: string): ContractAnalysisPayload | null {
  // Accept both the new and legacy fence tags
  const match = rawText.match(/:::pageindex-(?:contract|risk)\s*\n([\s\S]*?)\n:::/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as ContractAnalysisPayload;
  } catch {
    return null;
  }
}

function riskColors(level: RiskLevel) {
  switch (level) {
    case 'High':
      return {
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        border: 'border-l-red-500',
        dot: 'bg-red-500',
      };
    case 'Medium':
      return {
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        border: 'border-l-amber-500',
        dot: 'bg-amber-500',
      };
    default:
      return {
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        border: 'border-l-emerald-500',
        dot: 'bg-emerald-500',
      };
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  const { badge } = riskColors(level);
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', badge)}
      style={labelFont}
    >
      {level}
    </span>
  );
}

function PagePill({
  page,
  docName,
  active,
  onClick,
}: {
  page: number;
  docName: string;
  active: boolean;
  onClick: (page: number) => void;
}) {
  const short = docName.length > 16 ? `${docName.slice(0, 14)}…` : docName;
  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        active
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-300'
          : 'border-stone-300 bg-white/60 text-stone-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-stone-600 dark:bg-stone-800/40 dark:text-stone-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400',
      )}
      style={labelFont}
      title={`Jump to page ${page} in the PDF preview`}
    >
      <FileText className="h-3 w-3 opacity-70" />
      {short} p.{page}
    </button>
  );
}

function FindingCard({
  finding,
  docName,
  activePage,
  onPageClick,
}: {
  finding: Finding;
  docName: string;
  activePage: number | null;
  onPageClick: (page: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const { border } = riskColors(finding.risk_level);

  return (
    <div
      className={cn(
        'rounded-xl border-l-4 bg-white/70 px-5 py-4 shadow-sm dark:bg-stone-800/50',
        border,
      )}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={finding.risk_level} />
          {finding.section ? (
            <span
              className="text-xs text-stone-500 dark:text-stone-400"
              style={labelFont}
            >
              {finding.section}
            </span>
          ) : null}
        </div>

        {/* Page pills */}
        <div className="flex flex-wrap gap-1.5">
          {finding.pages.map((p) => (
            <PagePill
              key={p}
              page={p}
              docName={docName}
              active={activePage === p}
              onClick={onPageClick}
            />
          ))}
        </div>
      </div>

      {/* Title */}
      <h4
        className="mt-2 text-[0.95rem] font-semibold leading-snug text-stone-900 dark:text-[#f2ebde]"
        style={headlineFont}
      >
        {finding.title}
      </h4>

      {/* Collapsible body */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
        style={labelFont}
      >
        <ChevronRight
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')}
        />
        {open ? 'Hide details' : 'Show details'}
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          <p
            className="text-[0.88rem] leading-6 text-stone-700 dark:text-[#cfc4b5]"
            style={bodyFont}
          >
            {finding.answer}
          </p>

          {finding.quote ? (
            <blockquote
              className="border-l-2 border-stone-300 pl-3 text-[0.82rem] italic text-stone-500 dark:border-stone-600 dark:text-stone-400"
              style={bodyFont}
            >
              "{finding.quote}"
            </blockquote>
          ) : null}

          {finding.recommendation ? (
            <div className="flex gap-2 rounded-lg bg-stone-50 px-3 py-2 dark:bg-stone-700/40">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
              <p
                className="text-[0.82rem] leading-5 text-stone-600 dark:text-stone-300"
                style={bodyFont}
              >
                {finding.recommendation}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryTable({ rows }: { rows: SummaryRow[] }) {
  if (!rows || rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => {
    const order: Record<RiskLevel, number> = { High: 0, Medium: 1, Low: 2 };
    return (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3);
  });

  return (
    <div className="mt-8">
      <h3
        className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400"
        style={labelFont}
      >
        <Scale className="h-4 w-4" />
        Risk Summary
      </h3>
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
        <table className="w-full text-[0.84rem]" style={bodyFont}>
          <thead>
            <tr className="bg-stone-100 dark:bg-stone-800">
              {['#', 'Clause', 'Issue', 'Risk', 'Page'].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left font-semibold text-stone-600 dark:text-stone-300"
                  style={labelFont}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const { badge, dot } = riskColors(row.riskLevel);
              return (
                <tr
                  key={row.id}
                  className="border-t border-stone-100 transition-colors even:bg-stone-50/60 hover:bg-stone-50 dark:border-stone-700/60 dark:even:bg-stone-800/30 dark:hover:bg-stone-800/50"
                >
                  <td className="px-3 py-2.5 text-stone-400">{i + 1}</td>
                  <td className="max-w-[12rem] truncate px-3 py-2.5 text-stone-700 dark:text-stone-300">
                    {row.clause}
                  </td>
                  <td className="px-3 py-2.5 text-stone-700 dark:text-stone-300">{row.issue}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                        badge,
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
                      {row.riskLevel}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-stone-500 dark:text-stone-400">p.{row.page}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Public helpers ─────────────────────────────────────────────────────────

export function isPageIndexContractResponse({
  endpoint,
  model,
  isCreatedByUser,
}: {
  endpoint?: string | null;
  model?: string | null;
  isCreatedByUser?: boolean | null;
}) {
  if (isCreatedByUser) return false;
  return isPageIndexContractEndpointName(endpoint) || isPageIndexContractModelName(model);
}

const PREVIEW_MAX_LENGTH = 260;

function collectText({
  content,
  fallbackText,
}: {
  content?: Array<TMessageContentParts | undefined>;
  fallbackText?: string;
}) {
  const parts: string[] = [];
  for (const part of content ?? []) {
    if (!part || part.type !== ContentTypes.TEXT) continue;
    const value = typeof part.text === 'string' ? part.text : part.text?.value;
    if (typeof value === 'string' && value.trim().length > 0) parts.push(value.trim());
  }
  return (parts.join('\n\n') || fallbackText || '').trim();
}

export function extractPageIndexContractPreview({
  content,
  fallbackText,
}: {
  content?: Array<TMessageContentParts | undefined>;
  fallbackText?: string;
}) {
  const combined = collectText({ content, fallbackText })
    .replace(/:::pageindex-(?:contract|risk)[\s\S]*?:::/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (combined.length <= PREVIEW_MAX_LENGTH) return combined;
  return `${combined.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}…`;
}

export function extractPageIndexContractRawText({
  content,
  fallbackText,
}: {
  content?: Array<TMessageContentParts | undefined>;
  fallbackText?: string;
}) {
  return collectText({ content, fallbackText });
}

// ── Main wrapper component ─────────────────────────────────────────────────

export default function PageIndexContractWrapper({
  previewText,
  rawText,
  children,
}: {
  previewText?: string;
  rawText?: string;
  children: ReactNode;
}) {
  const payload = useMemo(() => (rawText ? parsePayload(rawText) : null), [rawText]);

  // Track which page is currently shown in the PDF iframe
  const [activePage, setActivePage] = useState<number | null>(() => {
    if (!payload) return null;
    const firstPage = payload.findings?.[0]?.pages?.[0];
    return firstPage ?? 1;
  });

  // Build the iframe URL
  const iframeSrc = useMemo(() => {
    if (!payload?.preview_path) return null;
    const base = payload.preview_path.startsWith('/')
      ? `${window.location.protocol}//${window.location.host}${payload.preview_path}`
      : payload.preview_path;
    return activePage != null ? `${base}#page=${activePage}` : base;
  }, [payload, activePage]);

  function handlePageClick(page: number) {
    setActivePage(page);
    // Force iframe reload to the new page hash by updating state
  }

  // ── When no payload is found, fall through to the default markdown render ──
  if (!payload) {
    return <>{children}</>;
  }

  const docName = payload.document_name || 'Contract';
  const findings = payload.findings || [];
  const summaryTable = payload.summary_table || [];

  // Severity counts
  const counts = findings.reduce(
    (acc, f) => {
      const level = f.risk_level as RiskLevel;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    },
    {} as Record<RiskLevel, number>,
  );

  return (
    <div
      className="flex w-full flex-col gap-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/50 shadow-md dark:border-stone-700 dark:bg-[#1a1714]"
      style={{
        width: 'min(calc(100vw - 2.5rem), 1600px)',
        marginLeft: 'calc((100% - min(calc(100vw - 2.5rem), 1600px)) / 2)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-white/80 px-6 py-4 dark:border-stone-700 dark:bg-stone-900/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2
              className="text-[1.05rem] font-bold text-stone-900 dark:text-[#f2ebde]"
              style={headlineFont}
            >
              Contract Analysis
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400" style={labelFont}>
              {docName}
            </p>
          </div>
        </div>

        {/* Risk counts */}
        <div className="flex items-center gap-3">
          {(['High', 'Medium', 'Low'] as RiskLevel[]).map((level) =>
            counts[level] ? (
              <span
                key={level}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                  riskColors(level).badge,
                )}
                style={labelFont}
              >
                <span className={cn('h-2 w-2 rounded-full', riskColors(level).dot)} />
                {counts[level]} {level}
              </span>
            ) : null,
          )}
        </div>
      </div>

      {/* ── Body: split pane ────────────────────────────────────────── */}
      <div className="flex min-h-[600px] flex-col gap-0 lg:flex-row">
        {/* Left pane: findings */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 lg:max-h-[820px]">
          {/* Question */}
          {payload.question ? (
            <div className="flex gap-2 rounded-xl bg-indigo-50/70 px-4 py-3 dark:bg-indigo-950/30">
              <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
              <p
                className="text-[0.88rem] leading-6 text-indigo-800 dark:text-indigo-300"
                style={bodyFont}
              >
                {payload.question}
              </p>
            </div>
          ) : null}

          {/* Executive summary */}
          {payload.executive_summary ? (
            <div className="rounded-xl bg-white/80 px-5 py-4 shadow-sm dark:bg-stone-800/50">
              <p
                className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                style={labelFont}
              >
                Summary
              </p>
              <p
                className="mt-2 text-[0.92rem] leading-6 text-stone-700 dark:text-[#cfc4b5]"
                style={bodyFont}
              >
                {payload.executive_summary}
              </p>
            </div>
          ) : null}

          {/* Findings */}
          {findings.length > 0 ? (
            <div className="space-y-3">
              <h3
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400"
                style={labelFont}
              >
                <AlertTriangle className="h-4 w-4" />
                Findings ({findings.length})
              </h3>
              {findings.map((f) => (
                <FindingCard
                  key={f.id}
                  finding={f}
                  docName={docName}
                  activePage={activePage}
                  onPageClick={handlePageClick}
                />
              ))}
            </div>
          ) : null}

          {/* Summary table */}
          <SummaryTable rows={summaryTable} />
        </div>

        {/* Right pane: PDF preview */}
        {iframeSrc ? (
          <div className="flex flex-col border-l border-stone-200 dark:border-stone-700 lg:w-[42%]">
            <div className="flex items-center justify-between border-b border-stone-200 bg-white/60 px-4 py-2.5 dark:border-stone-700 dark:bg-stone-900/40">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400" style={labelFont}>
                PDF Preview
                {activePage != null ? (
                  <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    p.{activePage}
                  </span>
                ) : null}
              </span>
              <a
                href={iframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                style={labelFont}
              >
                Open ↗
              </a>
            </div>
            <iframe
              key={iframeSrc}
              src={iframeSrc}
              title={`PDF preview – ${docName}`}
              className="flex-1 border-0"
              style={{ minHeight: 720 }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
