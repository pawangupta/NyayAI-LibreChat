import type { DraftingStepKey } from '../types';

export const DRAFTING_STEP_METADATA: Record<
  DraftingStepKey,
  { label: string; description: string }
> = {
  select: {
    label: 'Select',
    description: 'Choose the document workflow you want to draft.',
  },
  download: {
    label: 'Download',
    description: 'Download the correct template workbook for the chosen document.',
  },
  upload: {
    label: 'Upload',
    description: 'Upload the completed workbook and validate the captured inputs.',
  },
  generate: {
    label: 'Generate',
    description: 'Generate the draft, preview it, and download the filing copy.',
  },
};

export const DRAFTING_STEP_ORDER: DraftingStepKey[] = ['select', 'download', 'upload', 'generate'];
