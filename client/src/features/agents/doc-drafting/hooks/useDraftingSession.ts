import { useMemo } from 'react';
import { useRecoilState } from 'recoil';
import store from '~/store';
import type {
  DraftingDocumentType,
  DraftingGenerationResponse,
  DraftingParsedWorkbook,
  DraftingStepKey,
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
          templateDownloaded: false,
          templateDownloadFileName: undefined,
          uploadedFileName: undefined,
          parsedWorkbook: undefined,
          validation: undefined,
          lastDraft: undefined,
        })),
      markTemplateDownloaded: (templateDownloadFileName?: string) =>
        setSession((prev) => ({
          ...prev,
          activeStep: 'upload',
          templateDownloaded: true,
          templateDownloadFileName,
        })),
      setParsedWorkbook: (parsedWorkbook: DraftingParsedWorkbook) =>
        setSession((prev) => ({
          ...prev,
          activeStep: 'upload',
          parsedWorkbook,
          uploadedFileName: parsedWorkbook.fileName,
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
