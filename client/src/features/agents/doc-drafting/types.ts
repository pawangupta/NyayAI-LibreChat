export type DraftingStepKey = 'select' | 'download' | 'upload' | 'generate';

export type DraftingDocumentType =
  | 'affidavit'
  | 'will'
  | 'power_of_attorney'
  | 'writ_petition'
  | 'contract'
  | 'legal_notice'
  | 'plaint';

export interface DraftingTemplate {
  id: string;
  type: DraftingDocumentType;
  label: string;
  description: string;
  inputFormat?: string;
  status?: 'active' | 'coming-soon';
  templateUrl?: string;
  sampleUrl?: string;
  sampleFiles?: string[];
  enabled: boolean;
}

export interface DraftingWorkbookField {
  section: string;
  fieldName: string;
  key: string;
  value?: unknown;
  required: boolean;
  explanation?: string;
}

export interface DraftingParsedWorkbook {
  fileName: string;
  sheetNames: string[];
  workbookSummary?: string;
  inferredDocumentType?: DraftingDocumentType;
  affidavitSubtype?: string;
  requiredFieldCount?: number;
  completedRequiredCount?: number;
  missingRequiredFields?: string[];
  fields?: DraftingWorkbookField[];
  normalizedPayload?: Record<string, unknown>;
}

export interface DraftingValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface DraftingValidationResult {
  valid: boolean;
  issues: DraftingValidationIssue[];
  summary?: string;
  requiredFieldCount?: number;
  completedRequiredCount?: number;
  normalizedPayload?: Record<string, unknown>;
}

export interface DraftingGenerationRequest {
  documentType: DraftingDocumentType;
  sessionId?: string;
  userInstructions?: string;
  payload?: Record<string, unknown>;
}

export interface DraftingGenerationResponse {
  sessionId: string;
  documentType: DraftingDocumentType;
  markdown: string;
  downloadUrl?: string;
  generatedAt?: string;
}

export interface DraftingSessionState {
  sessionId?: string;
  activeStep: DraftingStepKey;
  selectedDocumentType?: DraftingDocumentType;
  templateDownloaded?: boolean;
  templateDownloadFileName?: string;
  uploadedFileName?: string;
  parsedWorkbook?: DraftingParsedWorkbook;
  validation?: DraftingValidationResult;
  lastDraft?: DraftingGenerationResponse;
  isLoading: boolean;
}
