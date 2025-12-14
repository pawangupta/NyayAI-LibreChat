import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  NotebookPen,
  Scale,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { TMessage } from 'librechat-data-provider';

const analysisIconMap: Record<string, LucideIcon> = {
  risk: ShieldAlert,
  shield: ShieldAlert,
  warning: AlertTriangle,
  summary: NotebookPen,
  notebook: NotebookPen,
  document: FileText,
  clause: FileText,
  law: Scale,
  recommendation: Sparkles,
  lightbulb: Sparkles,
  success: CheckCircle2,
  default: Sparkles,
};

export const renderAnalysisIcon = (key?: string) => {
  const iconKey = (key ?? '').toLowerCase();
  const IconComponent = analysisIconMap[iconKey] ?? analysisIconMap.default;
  return <IconComponent size={18} strokeWidth={2} aria-hidden="true" />;
};

export const getMessageTimestamp = (message?: TMessage | null): string | null => {
  if (!message) {
    return null;
  }

  const candidate =
    (message as Record<string, unknown>).updatedAt ??
    (message as Record<string, unknown>).createdAt ??
    (message as Record<string, unknown>).timestamp ??
    (message as Record<string, unknown>).updated_at ??
    (message as Record<string, unknown>).created_at;

  if (!candidate) {
    return null;
  }

  const date = typeof candidate === 'number' ? new Date(candidate) : new Date(String(candidate));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};
