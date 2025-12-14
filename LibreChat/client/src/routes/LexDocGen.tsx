import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Button, Input, Textarea, Spinner, useToastContext } from '@librechat/client';
import {
  useLexDocGenSessionsQuery,
  useLexDocGenSessionQuery,
  useLexDocGenUploadMutation,
  useLexDocGenMessageMutation,
  useLexDocGenRenderMutation,
} from '~/data-provider';
import type { LexDocGenField, LexDocGenSession } from '~/common';
import { cn } from '~/utils';
import {
  FileText,
  UploadCloud,
  Loader2,
  MessageSquare,
  Send,
  CheckCircle2,
  Download,
} from 'lucide-react';

const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return value;
  }
};

const SectionTitle = ({ icon: Icon, title }: { icon: ComponentType<any>; title: string }) => (
  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
    <Icon className="h-4 w-4 text-accent" />
    {title}
  </div>
);

export default function LexDocGen() {
  const { showToast } = useToastContext();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('will');
  const [fieldValue, setFieldValue] = useState('');
  const [messageValue, setMessageValue] = useState('');

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isRefetching: sessionsRefetching,
  } = useLexDocGenSessionsQuery();
  const sessions = sessionsData?.sessions ?? [];

  const {
    data: sessionEnvelope,
    isLoading: sessionLoading,
    isFetching: sessionRefetching,
  } = useLexDocGenSessionQuery(selectedSessionId, {
    enabled: Boolean(selectedSessionId),
  });
  const activeSession = sessionEnvelope?.session;
  const nextStep = sessionEnvelope?.nextStep;
  const downloads = sessionEnvelope?.downloads;

  const uploadMutation = useLexDocGenUploadMutation({
    onSuccess: (payload) => {
      showToast({ message: 'Template ingested successfully', status: 'success' });
      setSelectedSessionId(payload.session.sessionId);
      setSelectedFile(null);
      setFieldValue('');
      setMessageValue('');
    },
    onError: (error) => showToast({ message: error.message, status: 'error' }),
  });

  const messageMutation = useLexDocGenMessageMutation({
    onSuccess: () => {
      setFieldValue('');
      setMessageValue('');
    },
    onError: (error) => showToast({ message: error.message, status: 'error' }),
  });

  const renderMutation = useLexDocGenRenderMutation({
    onSuccess: () => showToast({ message: 'Document rendering complete', status: 'success' }),
    onError: (error) => showToast({ message: error.message, status: 'error' }),
  });

  useEffect(() => {
    if (!selectedSessionId && sessions.length) {
      setSelectedSessionId(sessions[0].sessionId);
    }
  }, [sessions, selectedSessionId]);

  const pendingField = nextStep?.pendingField;
  useEffect(() => {
    setFieldValue('');
  }, [pendingField?.key, selectedSessionId]);

  const answeredMap = useMemo(() => {
    const map = new Map<string, string>();
    if (activeSession?.responses) {
      Object.entries(activeSession.responses).forEach(([key, value]) => {
        map.set(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }
    return map;
  }, [activeSession?.responses]);

  const missingFields = useMemo(() => {
    if (!activeSession?.template?.schema) {
      return [];
    }
    return activeSession.template.schema.filter((field) => !answeredMap.has(field.key));
  }, [activeSession?.template?.schema, answeredMap]);

  const handleUpload = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      showToast({ message: 'Choose a .docx template to upload.', status: 'error' });
      return;
    }
    const form = new FormData();
    form.append('file', selectedFile);
    if (documentType) {
      form.append('documentType', documentType);
    }
    uploadMutation.mutate(form);
  };

  const handleAnswerSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSessionId || !pendingField?.key) {
      return;
    }
    if (!fieldValue.trim()) {
      showToast({ message: 'Please provide a response before submitting.', status: 'error' });
      return;
    }

    messageMutation.mutate({
      sessionId: selectedSessionId,
      payload: { fieldKey: pendingField.key, value: fieldValue.trim() },
    });
  };

  const handleMessageSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSessionId || !messageValue.trim()) {
      return;
    }

    messageMutation.mutate({
      sessionId: selectedSessionId,
      payload: { message: messageValue.trim() },
    });
  };

  const handleRender = () => {
    if (!selectedSessionId) {
      return;
    }
    renderMutation.mutate(selectedSessionId);
  };

  const isUploading = uploadMutation.isLoading;
  const isMessaging = messageMutation.isLoading;
  const isRendering = renderMutation.isLoading;

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden bg-surface-primary p-4">
      <div className="grid h-full gap-4 lg:grid-cols-[340px,1fr]">
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border-subtle bg-surface-primary-alt p-4 shadow-sm">
            <SectionTitle icon={UploadCloud} title="Upload Template" />
            <p className="mt-2 text-xs text-text-secondary">
              Upload a Microsoft Word template with {'{{placeholders}}'}. LexDocGen will detect the schema
              and start a guided intake session similar to the WillGen workflow.
            </p>
            <form className="mt-4 space-y-3" onSubmit={handleUpload}>
              <div>
                <label className="text-xs font-medium text-text-secondary">Document Type</label>
                <Input
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  placeholder="e.g. will, employment_agreement"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary">Template (.docx)</label>
                <Input
                  type="file"
                  accept=".docx"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  className="mt-1"
                />
                {selectedFile && (
                  <p className="mt-1 text-xs text-text-secondary">{selectedFile.name}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isUploading}>
                <span className="flex items-center justify-center gap-2">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                  {isUploading ? 'Uploading...' : 'Ingest Template'}
                </span>
              </Button>
            </form>
          </section>

          <section className="flex-1 rounded-2xl border border-border-subtle bg-surface-primary-alt p-4 shadow-sm">
            <SectionTitle icon={FileText} title="Sessions" />
            <div className="mt-3 h-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border border-dashed border-border-subtle bg-surface-primary">
              {sessionsLoading || sessionsRefetching ? (
                <div className="flex h-full items-center justify-center">
                  <Spinner className="text-text-primary" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-text-secondary">
                  <FileText className="h-10 w-10 text-border-strong" />
                  <p>No LexDocGen sessions yet. Upload a template to get started.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border-subtle">
                  {sessions.map((session) => (
                    <li key={session.sessionId}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-surface-hover',
                          selectedSessionId === session.sessionId && 'bg-surface-hover/70',
                        )}
                        onClick={() => setSelectedSessionId(session.sessionId)}
                      >
                        <div className="flex items-center justify-between text-sm font-medium text-text-primary">
                          <span>{session.template?.originalFileName || session.sessionId}</span>
                          <StatusBadge
                            variant={session.status === 'rendered' ? 'success' : 'secondary'}
                            label={session.status.replace(/_/g, ' ')}
                          />
                        </div>
                        <div className="text-xs text-text-secondary">
                          Updated {formatDate(session.updatedAt)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          Progress: {session.progress.answered}/{session.progress.total}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <section className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-primary-alt shadow-sm">
          {!selectedSessionId ? (
            <div className="flex flex-1 items-center justify-center text-center text-text-secondary">
              Select a session on the left or upload a new template to begin.
            </div>
          ) : sessionLoading || sessionRefetching ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="text-text-primary" />
            </div>
          ) : !activeSession ? (
            <div className="flex flex-1 items-center justify-center text-text-secondary">
              Unable to load session.
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <header className="border-b border-border-subtle p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Session ID</p>
                    <p className="font-semibold text-text-primary">{activeSession.sessionId}</p>
                  </div>
                  <div className="text-right text-xs text-text-secondary">
                    <p>Created {formatDate(activeSession.createdAt)}</p>
                    <p>Updated {formatDate(activeSession.updatedAt)}</p>
                  </div>
                </div>
              </header>

              <div className="grid flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(280px,360px),1fr]">
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border-subtle bg-surface-primary p-4">
                    <SectionTitle icon={MessageSquare} title="Next Question" />
                    {nextStep?.done ? (
                      <div className="mt-3 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                        All required fields are captured. You can render the final document now.
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-text-primary">{nextStep?.prompt}</p>
                    )}

                    {pendingField && (
                      <form className="mt-4 space-y-3" onSubmit={handleAnswerSubmit}>
                        <div>
                          <label className="text-xs font-medium text-text-secondary">{pendingField.label}</label>
                          <Textarea
                            value={fieldValue}
                            onChange={(event) => setFieldValue(event.target.value)}
                            placeholder={pendingField.description}
                            className="mt-1 min-h-[90px]"
                          />
                        </div>
                        <Button type="submit" disabled={isMessaging}>
                          <span className="flex items-center justify-center gap-2">
                            <Send className="h-4 w-4" />
                            Submit Answer
                          </span>
                        </Button>
                      </form>
                    )}

                    <form className="mt-4 space-y-2" onSubmit={handleMessageSubmit}>
                      <label className="text-xs font-medium text-text-secondary">Notes to LexDocGen</label>
                      <Textarea
                        value={messageValue}
                        onChange={(event) => setMessageValue(event.target.value)}
                        placeholder="Add clarifications or context for the intake agent"
                        className="min-h-[80px]"
                      />
                      <Button type="submit" variant="ghost" disabled={isMessaging}>
                        <span className="flex items-center justify-center gap-2">
                          <Send className="h-4 w-4" />
                          Send Message
                        </span>
                      </Button>
                    </form>

                    <Button
                      type="button"
                      className="mt-4 w-full"
                      disabled={isRendering || !nextStep?.done}
                      onClick={handleRender}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isRendering ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {nextStep?.done
                          ? isRendering
                            ? 'Rendering…'
                            : 'Render Final Document'
                          : 'Waiting for required fields'}
                      </span>
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border-subtle bg-surface-primary p-4">
                    <SectionTitle icon={Download} title="Downloads" />
                    <div className="mt-3 grid gap-3">
                      <DownloadLink
                        label="Template"
                        href={downloads?.template}
                        disabled={!activeSession.artifacts.template}
                      />
                      <DownloadLink
                        label="Inputs JSON"
                        href={downloads?.inputs}
                        disabled={!activeSession.artifacts.inputs}
                      />
                      <DownloadLink
                        label="Final Document"
                        href={downloads?.final}
                        disabled={!activeSession.artifacts.final}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border-subtle bg-surface-primary">
                  <div className="space-y-6 p-4">
                    <div>
                      <SectionTitle icon={FileText} title="Schema" />
                      <div className="mt-3 space-y-3">
                        {activeSession.template?.schema?.map((field) => (
                          <FieldStatus key={field.key} field={field} answeredValue={answeredMap.get(field.key)} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <SectionTitle icon={MessageSquare} title="History" />
                      <div className="mt-3 space-y-3">
                        {activeSession.history?.length ? (
                          activeSession.history.map((entry, index) => (
                            <div key={`${entry.timestamp}-${index}`} className="rounded-lg border border-border-subtle bg-surface-primary-alt p-3 text-sm">
                              <div className="flex items-center justify-between text-xs text-text-secondary">
                                <span className="capitalize">{entry.type}</span>
                                <span>{formatDate(entry.timestamp)}</span>
                              </div>
                              <p className="mt-1 text-text-primary">{entry.text}</p>
                              {entry.fieldKey && (
                                <p className="text-xs text-text-secondary">Field: {entry.fieldKey}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-text-secondary">No history yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FieldStatus({ field, answeredValue }: { field: LexDocGenField; answeredValue?: string }) {
  const isComplete = Boolean(answeredValue);
  return (
    <div className="rounded-lg border border-border-subtle/70 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-text-primary">{field.label}</p>
          <p className="text-xs text-text-secondary">{field.description}</p>
        </div>
        <StatusBadge variant={isComplete ? 'success' : 'secondary'} label={isComplete ? 'Answered' : 'Pending'} />
      </div>
      {isComplete ? (
        <p className="mt-2 rounded-md bg-surface-primary-alt p-2 text-sm text-text-primary/90">{answeredValue}</p>
      ) : (
        <p className="mt-2 text-xs uppercase tracking-wide text-text-secondary">
          {field.required ? 'Required' : 'Optional'}
        </p>
      )}
    </div>
  );
}

function DownloadLink({ label, href, disabled }: { label: string; href?: string; disabled?: boolean }) {
  if (disabled || !href) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed border-border-subtle px-3 py-2 text-sm text-text-secondary">
        <span>{label}</span>
        <span className="text-xs">Not available</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm text-accent transition hover:bg-surface-hover"
    >
      <span>{label}</span>
      <Download className="h-4 w-4" />
    </a>
  );
}

function StatusBadge({ label, variant }: { label: string; variant: 'success' | 'secondary' }) {
  const classes =
    variant === 'success'
      ? 'bg-success/15 text-success border-success/40'
      : 'bg-surface-primary-alt text-text-secondary border-border-subtle';
  return (
    <span className={cn('rounded-full border px-3 py-0.5 text-xs font-semibold uppercase', classes)}>
      {label}
    </span>
  );
}
