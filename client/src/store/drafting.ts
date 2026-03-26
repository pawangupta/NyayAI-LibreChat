import { atom } from 'recoil';
import type { DraftingSessionState } from '~/features/agents/doc-drafting';

const draftingSession = atom<DraftingSessionState>({
  key: 'draftingSession',
  default: {
    activeStep: 'select',
    isLoading: false,
  },
});

export default {
  draftingSession,
};
