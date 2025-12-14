export type LexDocGenField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
};

export type LexDocGenHistoryEntry = {
  type: 'user' | 'answer' | string;
  text: string;
  fieldKey?: string;
  timestamp: string;
};

export type LexDocGenSession = {
  sessionId: string;
  userId: string;
  documentType: string;
  status: 'collecting' | 'ready_to_render' | 'rendered' | string;
  createdAt: string;
  updatedAt: string;
  progress: {
    answered: number;
    total: number;
  };
  template: {
    originalFileName: string;
    schemaVersion: string;
    schema: LexDocGenField[];
    textPreview: string;
  };
  responses: Record<string, string | number | boolean | null | string[]>;
  history: LexDocGenHistoryEntry[];
  artifacts: {
    template: boolean;
    inputs: boolean;
    final: boolean;
  };
};

export type LexDocGenDownloads = {
  template: string;
  inputs: string;
  final: string;
};

export type LexDocGenNextStep = {
  done: boolean;
  prompt: string;
  pendingField: LexDocGenField | null;
};

export type LexDocGenSessionEnvelope = {
  session: LexDocGenSession;
  nextStep: LexDocGenNextStep;
  downloads: LexDocGenDownloads;
};

export type LexDocGenUploadResponse = LexDocGenSessionEnvelope & {
  placeholderCount: number;
};

export type LexDocGenSessionsResponse = {
  sessions: LexDocGenSession[];
};
