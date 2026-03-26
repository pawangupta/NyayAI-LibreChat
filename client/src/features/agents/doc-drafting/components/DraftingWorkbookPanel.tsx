import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileDown,
  FileText,
  FileUp,
  Loader2,
  Lock,
  WandSparkles,
} from 'lucide-react';
import { DOC_DRAFTING_API_BASE_URL } from '../config';
import { useDraftingRegistry } from '../hooks/useDraftingRegistry';
import { useDraftingApi } from '../hooks/useDraftingApi';
import { useDraftingSession } from '../hooks/useDraftingSession';
import { cn } from '~/utils';

type WorkflowCardProps = {
  stepNumber: number;
  title: string;
  description: string;
  isActive: boolean;
  isComplete?: boolean;
  children: ReactNode;
};

function WorkflowCard({
  stepNumber,
  title,
  description,
  isActive,
  isComplete,
  children,
}: WorkflowCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border p-5 transition-all',
        isActive
          ? 'border-slate-900 bg-slate-50/80 shadow-[0_14px_40px_rgba(15,23,42,0.06)] dark:border-[#d2b36c] dark:bg-[#1b1814]'
          : isComplete
            ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10'
            : 'border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-white/5',
      )}
    >
      <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-4 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#a79d90]">
            Step {stepNumber}
          </p>
          {isComplete && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </span>
          )}
        </div>
        <div>
          <h4 className="text-lg font-semibold text-slate-900 dark:text-[#f3efe5]">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#b8afa3]">{description}</p>
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function DraftingWorkbookPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { templates } = useDraftingRegistry();
  const { parseWorkbook, validate, generate } = useDraftingApi();
  const {
    session,
    markTemplateDownloaded,
    setDocumentType,
    setParsedWorkbook,
    setValidation,
    setLastDraft,
    setLoading,
  } = useDraftingSession();
  const [error, setError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');

  const parsedWorkbook = session.parsedWorkbook;
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.type === session.selectedDocumentType),
    [session.selectedDocumentType, templates],
  );
  const sampleDownloads = useMemo(() => {
    if (!selectedTemplate?.sampleFiles?.length) {
      return [];
    }

    return selectedTemplate.sampleFiles.map((fileName) => ({
      fileName,
      href: `${DOC_DRAFTING_API_BASE_URL}/templates/${encodeURIComponent(fileName)}`,
      label: fileName.replace(/\.xlsx$/i, '').replace(/_/g, ' '),
    }));
  }, [selectedTemplate]);

  const normalizedPayload = useMemo(
    () => ({
      ...(parsedWorkbook?.normalizedPayload ?? {}),
      ...(session.validation?.normalizedPayload ?? {}),
    }),
    [parsedWorkbook?.normalizedPayload, session.validation?.normalizedPayload],
  );
  const requiredFieldCount =
    session.validation?.requiredFieldCount ?? parsedWorkbook?.requiredFieldCount ?? 0;
  const completedRequiredCount =
    session.validation?.completedRequiredCount ?? parsedWorkbook?.completedRequiredCount ?? 0;
  const missingRequiredFields = parsedWorkbook?.missingRequiredFields ?? [];
  const completionRatio = requiredFieldCount > 0 ? completedRequiredCount / requiredFieldCount : 0;
  const previewFields = (parsedWorkbook?.fields ?? []).filter((field) => field.required).slice(0, 6);

  const canDownloadTemplate = Boolean(selectedTemplate && session.activeStep === 'download');
  const canUploadWorkbook = Boolean(session.templateDownloaded && session.activeStep === 'upload');
  const canValidate = Boolean(canUploadWorkbook && session.selectedDocumentType && parsedWorkbook);
  const canGenerate = Boolean(
    session.activeStep === 'generate' && session.selectedDocumentType && session.validation?.valid,
  );

  const resolvedDownloadUrl = useMemo(() => {
    const downloadUrl = session.lastDraft?.downloadUrl;
    if (!downloadUrl) {
      return null;
    }

    if (/^https?:\/\//i.test(downloadUrl)) {
      return downloadUrl;
    }

    const apiOrigin = DOC_DRAFTING_API_BASE_URL.replace(/\/v1\/drafting$/, '');
    return `${apiOrigin}${downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`}`;
  }, [session.lastDraft?.downloadUrl]);

  const generatedDraftView = useMemo(() => {
    const markdown = session.lastDraft?.markdown;
    if (!markdown) {
      return null;
    }

    const lines = markdown.split('\n');
    const titleIndex = lines.findIndex((line) => /^\*\*.+\*\*$/.test(line.trim()));
    const verificationIndex = lines.findIndex((line) => line.trim() === '## Verification');
    const title = titleIndex >= 0 ? lines[titleIndex].replace(/^\*\*|\*\*$/g, '').trim() : 'Generated Draft';
    const captionLines =
      titleIndex >= 0
        ? lines
            .slice(titleIndex + 2)
            .filter((line, index, source) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return source.slice(index + 1).some((nextLine) => nextLine.trim().length > 0);
              }
              return !/^I,\s+\*\*/.test(trimmed);
            })
            .slice(0, 8)
        : [];
    const bodyStartIndex = lines.findIndex((line) => /^I,\s+\*\*/.test(line.trim()));
    const bodyLines =
      bodyStartIndex >= 0
        ? lines
            .slice(bodyStartIndex, verificationIndex > bodyStartIndex ? verificationIndex : undefined)
            .filter((line) => line.trim().length > 0)
        : [];
    const verificationLines =
      verificationIndex >= 0
        ? lines.slice(verificationIndex + 1).filter((line) => line.trim().length > 0)
        : [];

    return {
      title,
      captionLines,
      bodyLines,
      verificationLines,
    };
  }, [session.lastDraft?.markdown]);

  const draftFileName = useMemo(() => {
    const downloadUrl = session.lastDraft?.downloadUrl;
    if (!downloadUrl) {
      return 'Draft export';
    }

    const fileName = downloadUrl.split('/').pop();
    return fileName ? decodeURIComponent(fileName) : 'Draft export';
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsed = await parseWorkbook(file);

      if (parsed.inferredDocumentType && parsed.inferredDocumentType !== session.selectedDocumentType) {
        setDocumentType(parsed.inferredDocumentType);
        markTemplateDownloaded(session.templateDownloadFileName);
      }

      setParsedWorkbook(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse workbook');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!session.selectedDocumentType) {
      setError('Select a document type before validation.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await validate({
        documentType: session.selectedDocumentType,
        payload: normalizedPayload,
      });
      setValidation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!session.selectedDocumentType) {
      setError('Select a document type before generation.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generate({
        documentType: session.selectedDocumentType,
        sessionId: session.sessionId,
        userInstructions: instructions,
        payload: normalizedPayload,
      });
      setLastDraft(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDraft = async () => {
    if (!session.lastDraft?.markdown || typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyNotice('Clipboard copy is unavailable in this browser context.');
      return;
    }

    try {
      await navigator.clipboard.writeText(session.lastDraft.markdown);
      setCopyNotice('Draft text copied to clipboard.');
      window.setTimeout(() => setCopyNotice(null), 2500);
    } catch {
      setCopyNotice('Unable to copy draft text.');
    }
  };

  return (
    <div id="doc-drafting-workflow-panels" className="space-y-4">
      {session.isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-[#b8afa3]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing drafting workflow…
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <WorkflowCard
        stepNumber={2}
        title="Download template"
        description="Download the correct workbook template for the document selected in Step 1. Only the immediate next action is active here."
        isActive={session.activeStep === 'download'}
        isComplete={Boolean(session.templateDownloaded)}
      >
        {!selectedTemplate ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-[#1b1814] dark:text-[#b8afa3]">
            Select a document type in Step 1 to unlock template downloads.
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-[#1b1814]">
              <p className="text-sm font-semibold text-slate-900 dark:text-[#f3efe5]">{selectedTemplate.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#b8afa3]">{selectedTemplate.description}</p>
              {session.templateDownloaded && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {session.templateDownloadFileName ?? 'Template'} downloaded
                </p>
              )}
            </div>

            {sampleDownloads.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sampleDownloads.map((sample) => {
                  const disabled = !canDownloadTemplate;

                  return (
                    <a
                      key={sample.fileName}
                      href={sample.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => {
                        if (disabled) {
                          event.preventDefault();
                          return;
                        }

                        markTemplateDownloaded(sample.fileName);
                      }}
                      aria-disabled={disabled}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]',
                        disabled
                          ? 'pointer-events-none cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-[#7f786d]'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#221d16] dark:text-[#f3efe5]',
                      )}
                    >
                      {disabled ? <Lock className="h-3.5 w-3.5" /> : <FileDown className="h-3.5 w-3.5" />}
                      {sample.label}
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                No template files are configured for this document yet.
              </div>
            )}
          </>
        )}
      </WorkflowCard>

      <WorkflowCard
        stepNumber={3}
        title="Upload and validate"
        description="Upload the completed workbook, review the captured fields, and validate the required inputs."
        isActive={session.activeStep === 'upload'}
        isComplete={Boolean(session.validation?.valid)}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!canUploadWorkbook || Boolean(session.validation?.valid) || session.isLoading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
              canUploadWorkbook && !session.validation?.valid && !session.isLoading
                ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#d2b36c] dark:text-[#1b1814] dark:hover:bg-[#debf78]'
                : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-[#8f887c]',
            )}
          >
            {canUploadWorkbook && !session.validation?.valid ? <FileUp className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            Upload workbook
          </button>

          <button
            type="button"
            disabled={!canValidate || Boolean(session.validation?.valid) || session.isLoading}
            onClick={handleValidate}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
              canValidate && !session.validation?.valid && !session.isLoading
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-[#8f887c]',
            )}
          >
            {canValidate && !session.validation?.valid ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            Validate workbook
          </button>
        </div>

        {!session.templateDownloaded && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-[#1b1814] dark:text-[#b8afa3]">
            Complete Step 2 first. Upload stays locked until a template workbook has been downloaded.
          </div>
        )}

        {parsedWorkbook && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-[#1b1814]">
              <p className="text-sm font-semibold text-slate-900 dark:text-[#f3efe5]">{parsedWorkbook.fileName}</p>
              {parsedWorkbook.workbookSummary && (
                <p className="mt-2 text-sm text-slate-600 dark:text-[#b8afa3]">{parsedWorkbook.workbookSummary}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {parsedWorkbook.sheetNames.map((sheetName) => (
                  <span
                    key={sheetName}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-[#d0c5b7]"
                  >
                    {sheetName}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#a79d90]">
                  Template type
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-[#f3efe5]">
                  {parsedWorkbook.affidavitSubtype
                    ?.replace(/_/g, ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase()) ?? 'Affidavit'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#a79d90]">
                  Required fields
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-[#f3efe5]">
                  {completedRequiredCount}/{requiredFieldCount} complete
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#a79d90]">
                  Validation
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-[#f3efe5]">
                  {session.validation ? (session.validation.valid ? 'Passed' : 'Needs fixes') : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        )}

        {requiredFieldCount > 0 && (
          <div className="rounded-xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-[#1b1814]">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-[#a79d90]">
              <span>Required field completion</span>
              <span>{Math.round(completionRatio * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  completionRatio === 1
                    ? 'bg-emerald-500'
                    : completionRatio >= 0.5
                      ? 'bg-amber-500'
                      : 'bg-slate-500 dark:bg-[#d2b36c]',
                )}
                style={{ width: `${completionRatio > 0 ? Math.max(completionRatio * 100, 4) : 0}%` }}
              />
            </div>
          </div>
        )}

        {previewFields.length > 0 && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-[#1b1814]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-[#f3efe5]">Required field preview</p>
              <span className="text-xs text-slate-500 dark:text-[#a79d90]">
                First {previewFields.length} mandatory fields
              </span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {previewFields.map((field) => {
                const hasValue =
                  typeof field.value === 'string' ? field.value.trim().length > 0 : field.value != null;

                return (
                  <div
                    key={field.key}
                    className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-[#f3efe5]">{field.fieldName}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-[#a79d90]">{field.section}</p>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]',
                          hasValue
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-100',
                        )}
                      >
                        {hasValue ? 'Captured' : 'Missing'}
                      </span>
                    </div>
                    {field.explanation && (
                      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-[#b8afa3]">{field.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {missingRequiredFields.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                <p className="font-medium">Still missing mandatory inputs</p>
                <p className="mt-1 text-xs leading-5 opacity-90">
                  {missingRequiredFields.slice(0, 6).join(' • ')}
                  {missingRequiredFields.length > 6 ? ` • +${missingRequiredFields.length - 6} more` : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {session.validation && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-[#1b1814]">
            <p className="text-sm font-semibold text-slate-900 dark:text-[#f3efe5]">Validation summary</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-[#b8afa3]">{session.validation.summary}</p>
            {session.validation.requiredFieldCount != null && (
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-[#a79d90]">
                Required completion: {session.validation.completedRequiredCount ?? 0}/
                {session.validation.requiredFieldCount}
              </p>
            )}
            {session.validation.issues.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-[#d0c5b7]">
                {session.validation.issues.map((issue, index) => (
                  <li key={`${issue.field}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-[#d2b36c]" />
                    <span>
                      <strong>{issue.field}:</strong> {issue.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </WorkflowCard>

      <WorkflowCard
        stepNumber={4}
        title="Generate and preview"
        description="After validation passes, generate the draft, review the preview, and download the DOCX output."
        isActive={session.activeStep === 'generate'}
        isComplete={Boolean(session.lastDraft)}
      >
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#a79d90]">
            Drafting instructions
          </label>
          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            rows={4}
            placeholder="Add optional drafting instructions, tone guidance, or affidavit-specific emphasis."
            className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-[#1b1814] dark:text-[#f3efe5] dark:placeholder:text-[#8f887c]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!canGenerate || Boolean(session.lastDraft) || session.isLoading}
            onClick={handleGenerate}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
              canGenerate && !session.lastDraft && !session.isLoading
                ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#d2b36c] dark:text-[#1b1814]'
                : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-[#8f887c]',
            )}
          >
            {canGenerate && !session.lastDraft ? <WandSparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            Generate draft
          </button>
          {!session.validation?.valid && (
            <span className="text-sm text-slate-500 dark:text-[#a79d90]">
              Step 4 unlocks only after Step 3 validation passes.
            </span>
          )}
        </div>

        {session.lastDraft && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-900/5 p-3 dark:bg-white/10">
                  <FileText className="h-5 w-5 text-slate-900 dark:text-[#d2b36c]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-[#f3efe5]">{draftFileName}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-[#a79d90]">
                    {formattedGeneratedAt && <span>{formattedGeneratedAt}</span>}
                    <span>Session {session.lastDraft.sessionId.slice(0, 8)}</span>
                    <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Export ready
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyDraft}
                  className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-[#d0c5b7]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy text
                </button>
                {resolvedDownloadUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => window.open(resolvedDownloadUrl, '_blank', 'noopener,noreferrer')}
                      className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-[#d0c5b7]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview file
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(resolvedDownloadUrl, '_blank', 'noopener,noreferrer')}
                      className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-slate-800 dark:bg-[#d2b36c] dark:text-[#1b1814]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download .docx
                    </button>
                  </>
                )}
              </div>
            </div>

            {copyNotice && (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-[#d0c5b7]">
                {copyNotice}
              </div>
            )}

            <div
              id="doc-drafting-generated-preview"
              className="rounded-[24px] border border-slate-200 bg-white px-5 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#12100d] dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:px-8 sm:py-8"
            >
              <div
                className="mx-auto max-w-3xl space-y-8 text-slate-800 dark:text-[#efe7d8]"
                style={{ fontFamily: 'Newsreader, Georgia, serif' }}
              >
                <div className="border-b border-slate-200 pb-6 text-center dark:border-white/10">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-[#f3efe5]">
                    {generatedDraftView?.captionLines[0] ?? 'COURT DETAILS'}
                  </p>
                  {generatedDraftView?.captionLines[1] && (
                    <p className="mt-2 text-sm italic text-slate-500 dark:text-[#a79d90]">
                      {generatedDraftView.captionLines[1]}
                    </p>
                  )}
                </div>

                <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
                  <div className="space-y-1 text-sm leading-6">
                    {(generatedDraftView?.captionLines.slice(3) ?? []).map((line, index) => (
                      <p
                        key={`${line}-${index}`}
                        className={cn(
                          'whitespace-pre-wrap',
                          line === line.toUpperCase() || line.toLowerCase() === 'versus'
                            ? 'font-bold uppercase tracking-[0.08em] text-slate-900 dark:text-[#f3efe5]'
                            : 'text-slate-700 dark:text-[#d0c5b7]',
                          line.toLowerCase() === 'versus' && 'py-2 text-center',
                        )}
                      >
                        {line}
                      </p>
                    ))}
                  </div>

                  <div className="border-l border-slate-200 pl-5 dark:border-white/10">
                    <p className="text-sm font-bold uppercase leading-6 tracking-[0.08em] text-slate-900 dark:text-[#f3efe5]">
                      {generatedDraftView?.title ?? 'Generated Draft'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-[1.03rem] leading-8 text-justify">
                  {(generatedDraftView?.bodyLines ?? []).slice(0, 8).map((line, index) => (
                    <p
                      key={`${line}-${index}`}
                      className={cn(
                        line.startsWith('> ') &&
                          'border-y border-slate-100 px-4 py-4 italic text-slate-500 dark:border-white/10 dark:text-[#b8afa3]',
                      )}
                    >
                      {line.replace(/^>\s*/, '')}
                    </p>
                  ))}
                </div>

                {generatedDraftView?.verificationLines.length ? (
                  <div className="flex flex-col gap-6 border-t border-slate-200 pt-8 dark:border-white/10 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="mb-2 h-px w-40 bg-slate-900 dark:bg-[#f3efe5]" />
                      <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-900 dark:text-[#f3efe5]">
                        {generatedDraftView.verificationLines
                          .find((line) => line.startsWith('**Deponent:**'))
                          ?.replace('**Deponent:**', '')
                          .trim() ?? 'Deponent'}
                      </p>
                      <p className="text-xs italic text-slate-500 dark:text-[#a79d90]">Affiant / Deponent</p>
                    </div>
                    <div className="max-w-sm text-right text-sm italic leading-6 text-slate-500 dark:text-[#a79d90]">
                      {generatedDraftView.verificationLines
                        .filter((line) => !line.startsWith('**Deponent:**'))
                        .map((line, index) => (
                          <p key={`${line}-${index}`}>{line.replace(/\*\*/g, '')}</p>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <details className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-[#f3efe5]">
                Show raw markdown draft
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-[#d0c5b7]">
                {session.lastDraft.markdown}
              </pre>
            </details>
          </div>
        )}
      </WorkflowCard>
    </div>
  );
}