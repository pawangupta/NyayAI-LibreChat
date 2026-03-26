import { isContractReviewResponse } from '~/features/agents/contract-review';
import { isDocDraftingResponse } from '~/features/agents/doc-drafting';
import { isLegalResearchResponse } from '~/features/agents/legal-research';

export type AgentResponseLayout = 'legal-research' | 'contract-review' | 'doc-drafting';

export function getAgentResponseLayout({
  endpoint,
  model,
  isCreatedByUser,
}: {
  endpoint?: string | null;
  model?: string | null;
  isCreatedByUser?: boolean | null;
}): AgentResponseLayout | null {
  if (
    isLegalResearchResponse({
      endpoint,
      model,
      isCreatedByUser,
    })
  ) {
    return 'legal-research';
  }

  if (
    isContractReviewResponse({
      endpoint,
      model,
      isCreatedByUser,
    })
  ) {
    return 'contract-review';
  }

  if (
    isDocDraftingResponse({
      endpoint,
      model,
      isCreatedByUser,
    })
  ) {
    return 'doc-drafting';
  }

  return null;
}