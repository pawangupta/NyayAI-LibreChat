import type { TMessage, TAttachment } from 'librechat-data-provider';
import type { DocumentCardProps, DocumentStatus } from '../ui/DocumentCard';
import type { StatusStep, StatusStepState } from '../ui/ProcessingStatus';
import type { RedlineSuggestionProps } from '../ui/RedlineSuggestion';
import type { QuickAction } from '../ui/QuickActions';

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export type AnalysisCard = {
  id: string;
  title: string;
  body?: string;
  icon?: string;
  badge?: {
    label: string;
    tone?: BadgeTone;
  };
};

export type ContractUiMetadata = {
  documentCard?: DocumentCardProps;
  processingSteps?: StatusStep[];
  analysisCards?: AnalysisCard[];
  redlineSuggestions?: RedlineSuggestionProps[];
  quickActions?: QuickAction[];
  statusBadge?: {
    label: string;
    tone?: BadgeTone;
  };
};

export const getBadgeToneClass = (tone?: BadgeTone) => {
  switch (tone) {
    case 'success':
      return 'badge-success';
    case 'warning':
      return 'badge-warning';
    case 'error':
      return 'badge-error';
    case 'info':
      return 'badge-info';
    default:
      return 'badge-neutral';
  }
};

const readableFileSize = (value?: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return undefined;
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

const normalizeDocumentStatus = (value?: string): DocumentStatus => {
  if (!value) {
    return 'uploaded';
  }

  const normalized = value.toLowerCase();

  if (['uploading', 'receiving'].includes(normalized)) {
    return 'uploading';
  }
  if (['processing', 'analyzing', 'running', 'active'].includes(normalized)) {
    return 'processing';
  }
  if (['complete', 'completed', 'ready', 'done', 'success'].includes(normalized)) {
    return 'complete';
  }
  return 'uploaded';
};

const normalizeStepStatus = (value?: string): StatusStepState => {
  if (!value) {
    return 'pending';
  }

  const normalized = value.toLowerCase();
  if (['active', 'current', 'processing', 'running', 'in_progress'].some((term) => normalized.includes(term))) {
    return 'active';
  }
  if (['complete', 'completed', 'done', 'success', 'finished'].some((term) => normalized.includes(term))) {
    return 'complete';
  }
  return 'pending';
};

const ensureArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
};

const coerceNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const deriveToneFromStatus = (status?: string): BadgeTone => {
  if (!status) {
    return 'neutral';
  }
  const normalized = status.toLowerCase();
  if (['complete', 'completed', 'ready', 'success'].some((term) => normalized.includes(term))) {
    return 'success';
  }
  if (['processing', 'analyzing', 'running', 'active'].some((term) => normalized.includes(term))) {
    return 'info';
  }
  if (['warning', 'attention', 'pending', 'review'].some((term) => normalized.includes(term))) {
    return 'warning';
  }
  if (['risk', 'issue', 'error', 'failed', 'alert'].some((term) => normalized.includes(term))) {
    return 'error';
  }
  return 'neutral';
};

const severityFromScore = (score?: number): BadgeTone => {
  if (typeof score !== 'number') {
    return 'neutral';
  }
  if (score >= 75) {
    return 'error';
  }
  if (score >= 50) {
    return 'warning';
  }
  if (score >= 25) {
    return 'info';
  }
  return 'success';
};

const toDocumentCard = (metadata: Record<string, any>, attachments?: TAttachment[]): DocumentCardProps | undefined => {
  const docSource =
    metadata.document ||
    metadata.documentInfo ||
    metadata.contract ||
    metadata.contractMetadata ||
    metadata.upload ||
    metadata.document_metadata ||
    metadata.file;

  const attachment = attachments?.[0] as (TAttachment & {
    filename?: string;
    name?: string;
    bytes?: number;
    metadata?: Record<string, any>;
    type?: string;
  }) | undefined;

  const fileName = docSource?.fileName ?? docSource?.filename ?? docSource?.name ?? attachment?.filename ?? attachment?.name;
  if (!fileName) {
    return undefined;
  }

  const fileType = (docSource?.fileType ?? docSource?.file_extension ?? docSource?.type ?? attachment?.type ?? 'Document')
    .toString()
    .toUpperCase();

  const pageCount = coerceNumber(
    docSource?.pages ?? docSource?.pageCount ?? docSource?.page_count ?? docSource?.total_pages ?? attachment?.metadata?.pages,
  );

  const fileSize = readableFileSize(
    docSource?.fileSize ?? docSource?.size ?? docSource?.file_size ?? attachment?.bytes ?? attachment?.metadata?.bytes,
  );

  const status = normalizeDocumentStatus(
    docSource?.status ?? docSource?.state ?? docSource?.stage ?? metadata.documentStatus ?? metadata.document_status ?? metadata.status,
  );

  return {
    fileName,
    fileType,
    pageCount,
    fileSize,
    status,
  };
};

const toProcessingSteps = (metadata: Record<string, any>): StatusStep[] | undefined => {
  const candidates = [
    metadata.processingSteps,
    metadata.processing_status,
    metadata.processing,
    metadata.statusTimeline,
    metadata.workflow?.steps,
    metadata.steps,
  ];

  const steps = candidates.find((candidate) => Array.isArray(candidate)) as Array<Record<string, any>> | undefined;
  if (!steps?.length) {
    return undefined;
  }

  const normalized = steps
    .map((step) => ({
      label: step.label ?? step.title ?? step.name ?? '',
      status: normalizeStepStatus(step.status ?? step.state ?? step.phase ?? step.progress),
    }))
    .filter((step) => step.label);

  return normalized.length ? normalized : undefined;
};

const toAnalysisCards = (metadata: Record<string, any>): AnalysisCard[] | undefined => {
  const cards: AnalysisCard[] = [];

  const analysis =
    metadata.analysis ||
    metadata.analysisResult ||
    metadata.analysis_results ||
    metadata.contractAnalysis ||
    metadata.contract_analysis;

  if (typeof metadata.summary === 'string') {
    cards.push({ id: 'summary-metadata', title: 'Summary', body: metadata.summary, icon: 'summary' });
  }

  if (typeof analysis === 'string') {
    cards.push({ id: 'analysis-string', title: 'Analysis', body: analysis, icon: 'summary' });
  }

  if (analysis?.executive_summary) {
    cards.push({ id: 'executive-summary', title: 'Executive summary', body: analysis.executive_summary, icon: 'notebook' });
  }

  if (analysis?.overall_risk_score != null) {
    const score = Number(analysis.overall_risk_score);
    if (!Number.isNaN(score)) {
      cards.push({
        id: 'risk-score',
        title: 'Overall risk score',
        body: `${score}/100`,
        icon: 'risk',
        badge: {
          label: score >= 75 ? 'Critical' : score >= 50 ? 'Elevated' : 'Low',
          tone: severityFromScore(score),
        },
      });
    }
  }

  if (Array.isArray(analysis?.risks) && analysis.risks.length) {
    const topRisk = analysis.risks[0];
    const description = topRisk?.description || topRisk?.mitigation;
    const title = topRisk?.title || `Top risk (${topRisk?.level ?? 'high'})`;
    cards.push({
      id: 'top-risk',
      title,
      body: description,
      icon: 'shield',
      badge: topRisk?.level
        ? {
            label: String(topRisk.level).toUpperCase(),
            tone: deriveToneFromStatus(topRisk.level),
          }
        : undefined,
    });
  }

  if (Array.isArray(analysis?.recommendations) && analysis.recommendations.length) {
    const topRecommendations = (analysis.recommendations as Array<string | Record<string, any>>)
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        return item?.text ?? item?.summary ?? item?.description;
      })
      .filter(Boolean) as string[];

    if (topRecommendations.length) {
      const recommendations = topRecommendations.slice(0, 2).join('\n\n');
      cards.push({
        id: 'recommendations',
        title: 'Recommendations',
        body: recommendations,
        icon: 'lightbulb',
      });
    }
  }

  if (Array.isArray(metadata.summaryCards)) {
    metadata.summaryCards.forEach((card: Record<string, any>, index: number) => {
      cards.push({
        id: `summary-card-${index}`,
        title: card.title ?? `Insight ${index + 1}`,
        body: card.body ?? card.description,
        icon: card.icon,
        badge: card.badge,
      });
    });
  }

  return cards.length ? cards : undefined;
};

const toRedlineSuggestions = (metadata: Record<string, any>): RedlineSuggestionProps[] | undefined => {
  const redlineRoot = metadata.redlines || metadata.redline_report || metadata.redlineSuggestions;

  let suggestions: Array<Record<string, any>> | undefined;
  if (Array.isArray(redlineRoot)) {
    suggestions = redlineRoot;
  } else if (Array.isArray(redlineRoot?.changes)) {
    suggestions = redlineRoot?.changes;
  } else if (Array.isArray(redlineRoot?.top_changes)) {
    suggestions = redlineRoot?.top_changes;
  }

  if (!suggestions?.length) {
    return undefined;
  }

  const normalized = suggestions
    .map((suggestion, index) => {
      const clauseLabel =
        suggestion.clauseLabel || suggestion.clause_reference || suggestion.clause || `Clause ${index + 1}`;
      const currentText = suggestion.currentText || suggestion.current || suggestion.before;
      const suggestedText = suggestion.suggestedText || suggestion.suggested || suggestion.after;
      const reason = suggestion.reason || suggestion.justification || suggestion.rationale;

      if (!currentText || !suggestedText || !reason) {
        return undefined;
      }

      return {
        number: suggestion.number ?? index + 1,
        clauseLabel,
        currentText,
        suggestedText,
        reason,
      } satisfies RedlineSuggestionProps;
    })
    .filter(Boolean) as RedlineSuggestionProps[];

  return normalized.length ? normalized : undefined;
};

const toQuickActions = (metadata: Record<string, any>): QuickAction[] | undefined => {
  const actionRoot = metadata.quickActions || metadata.quick_actions || metadata.suggestedActions || metadata.next_steps;

  if (!Array.isArray(actionRoot) || !actionRoot.length) {
    return undefined;
  }

  const normalized = actionRoot
    .map((action: Record<string, any>) => ({
      text: action.text ?? action.label ?? action.title ?? '',
      icon: action.icon,
      onClick: action.onClick,
    }))
    .filter((action) => action.text);

  return normalized.length ? normalized : undefined;
};

const toStatusBadge = (metadata: Record<string, any>, analysis?: Record<string, any>): ContractUiMetadata['statusBadge'] => {
  const badgeSource = metadata.statusBadge || metadata.status_badge;
  if (badgeSource?.label) {
    return {
      label: badgeSource.label,
      tone: badgeSource.tone ?? deriveToneFromStatus(badgeSource.label),
    };
  }

  const statusLabel = metadata.documentStatus || metadata.document_status || metadata.status;
  if (typeof statusLabel === 'string' && statusLabel.trim().length) {
    return {
      label: statusLabel,
      tone: deriveToneFromStatus(statusLabel),
    };
  }

  if (analysis?.overall_risk_score != null) {
    const score = Number(analysis.overall_risk_score);
    if (!Number.isNaN(score)) {
      return {
        label: `Risk ${score}/100`,
        tone: severityFromScore(score),
      };
    }
  }

  return undefined;
};

export const parseContractUiMetadata = (
  message?: TMessage,
  attachments?: TAttachment[],
): ContractUiMetadata => {
  const metadata = ((message as Record<string, any>)?.metadata ?? {}) as Record<string, any>;

  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const documentCard = toDocumentCard(metadata, attachments);
  const processingSteps = toProcessingSteps(metadata);
  const analysisCards = toAnalysisCards(metadata);
  const redlineSuggestions = toRedlineSuggestions(metadata);
  const quickActions = toQuickActions(metadata);
  const statusBadge = toStatusBadge(metadata, metadata.analysis || metadata.contractAnalysis);

  return {
    documentCard,
    processingSteps,
    analysisCards,
    redlineSuggestions,
    quickActions,
    statusBadge,
  };
};
