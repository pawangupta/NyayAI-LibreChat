import { DOC_DRAFTING_API_BASE_URL } from '../config';
import type {
  DraftingGenerationRequest,
  DraftingGenerationResponse,
  DraftingWorkbookField,
  DraftingParsedWorkbook,
  DraftingValidationResult,
} from '../types';

export function useDraftingApi() {
  return {
    async parseWorkbook(file: File): Promise<DraftingParsedWorkbook> {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetch(`${DOC_DRAFTING_API_BASE_URL}/parse-workbook`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Workbook parse failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        file_name: string;
        sheet_names: string[];
        workbook_summary?: string;
        inferred_document_type?: DraftingParsedWorkbook['inferredDocumentType'];
        normalized_payload?: Record<string, unknown> & {
          affidavit_subtype?: string;
          required_field_count?: number;
          completed_required_count?: number;
          missing_required_fields?: string[];
          fields?: Array<{
            section: string;
            field_name: string;
            key: string;
            value?: unknown;
            required: boolean;
            explanation?: string;
          }>;
        };
      };

      const fields: DraftingWorkbookField[] | undefined = data.normalized_payload?.fields?.map((field) => ({
        section: field.section,
        fieldName: field.field_name,
        key: field.key,
        value: field.value,
        required: field.required,
        explanation: field.explanation,
      }));

      return {
        fileName: data.file_name,
        sheetNames: data.sheet_names,
        workbookSummary: data.workbook_summary,
        inferredDocumentType: data.inferred_document_type,
        affidavitSubtype: data.normalized_payload?.affidavit_subtype,
        requiredFieldCount: data.normalized_payload?.required_field_count,
        completedRequiredCount: data.normalized_payload?.completed_required_count,
        missingRequiredFields: data.normalized_payload?.missing_required_fields,
        fields,
        normalizedPayload: data.normalized_payload,
      };
    },
    async validate(payload: {
      documentType: string;
      payload?: Record<string, unknown>;
    }): Promise<DraftingValidationResult> {
      const response = await fetch(`${DOC_DRAFTING_API_BASE_URL}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_type: payload.documentType,
          payload: payload.payload ?? {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Drafting validation failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        valid: boolean;
        issues: DraftingValidationResult['issues'];
        summary?: string;
        normalized_payload?: Record<string, unknown> & {
          required_field_count?: number;
          completed_required_count?: number;
        };
      };

      return {
        valid: data.valid,
        issues: data.issues,
        summary: data.summary,
        requiredFieldCount: data.normalized_payload?.required_field_count,
        completedRequiredCount: data.normalized_payload?.completed_required_count,
        normalizedPayload: data.normalized_payload,
      };
    },
    async generate(request: DraftingGenerationRequest): Promise<DraftingGenerationResponse> {
      const response = await fetch(`${DOC_DRAFTING_API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_type: request.documentType,
          session_id: request.sessionId,
          user_instructions: request.userInstructions,
          payload: request.payload ?? {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Draft generation failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        session_id: string;
        document_type: DraftingGenerationResponse['documentType'];
        markdown: string;
        download_url?: string;
        generated_at?: string;
      };

      return {
        sessionId: data.session_id,
        documentType: data.document_type,
        markdown: data.markdown,
        downloadUrl: data.download_url,
        generatedAt: data.generated_at,
      };
    },
  };
}
