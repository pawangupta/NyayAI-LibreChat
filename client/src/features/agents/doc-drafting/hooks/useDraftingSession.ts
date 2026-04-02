import { useMemo } from 'react';
import { useRecoilState } from 'recoil';
import store from '~/store';
import type {
  DraftingDocumentType,
  DraftingGenerationResponse,
  DraftingParsedWorkbook,
  DraftingStepKey,
  DraftingTemplateSubtype,
  DraftingValidationResult,
} from '../types';

export function useDraftingSession() {
  const [session, setSession] = useRecoilState(store.draftingSession);

  return useMemo(
    () => ({
      session,
      setActiveStep: (activeStep: DraftingStepKey) => setSession((prev) => ({ ...prev, activeStep })),
      setDocumentType: (selectedDocumentType: DraftingDocumentType) =>
        setSession((prev) => ({
          ...prev,
          activeStep: 'download',
          selectedDocumentType,
          selectedSubtypeId: undefined,
          templateDownloaded: false,
          templateDownloadFileName: undefined,
          supportingUploadNames: undefined,
          preparedTemplateUrl: undefined,
          preparedTemplateMessage: undefined,
          uploadedFileName: undefined,
          parsedWorkbook: undefined,
          validation: undefined,
          lastDraft: undefined,
        })),
      setSelectedSubtype: (subtype: DraftingTemplateSubtype | undefined) =>
        setSession((prev) => ({
          ...prev,
          activeStep: 'download',
          selectedSubtypeId: subtype?.id,
          templateDownloaded: false,
          templateDownloadFileName: undefined,
          supportingUploadNames: undefined,
          preparedTemplateUrl: undefined,
          preparedTemplateMessage: undefined,
          uploadedFileName: undefined,
          parsedWorkbook: undefined,
          validation: undefined,
          lastDraft: undefined,
        })),
      markTemplateDownloaded: (
        templateDownloadFileName?: string,
        options?: {
          supportingUploadNames?: string[];
          preparedTemplateUrl?: string;
          preparedTemplateMessage?: string;
        },
      ) =>
        setSession((prev) => ({
          ...prev,
          activeStep: 'upload',
          templateDownloaded: true,
          templateDownloadFileName,
          supportingUploadNames: options?.supportingUploadNames,
          preparedTemplateUrl: options?.preparedTemplateUrl,
          preparedTemplateMessage: options?.preparedTemplateMessage,
        })),
      setParsedWorkbook: (parsedWorkbook: DraftingParsedWorkbook) =>
        setSession((prev) => ({
          ...prev,
          activeStep: 'upload',
          parsedWorkbook,
          uploadedFileName: parsedWorkbook.fileName,
          preparedTemplateUrl: prev.preparedTemplateUrl,
          preparedTemplateMessage: prev.preparedTemplateMessage,
          validation: undefined,
          lastDraft: undefined,
        })),
      setValidation: (validation: DraftingValidationResult) =>
        setSession((prev) => ({
          ...prev,
          activeStep: validation.valid ? 'generate' : 'upload',
          validation,
        })),
      setLastDraft: (lastDraft: DraftingGenerationResponse) =>
        setSession((prev) => ({
          ...prev,
          activeStep: 'generate',
          lastDraft,
          sessionId: lastDraft.sessionId,
        })),
      setLoading: (isLoading: boolean) => setSession((prev) => ({ ...prev, isLoading })),
      resetDraftingSession: () =>
        setSession({
          activeStep: 'select',
          isLoading: false,
        }),
    }),
    [session, setSession],
  );
}
