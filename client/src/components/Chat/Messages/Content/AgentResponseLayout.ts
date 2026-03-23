import { isContractReviewResponse } from './ContractReviewWrapper';
import { isLegalResearchResponse } from './LegalResearchWrapper';

export type AgentResponseLayout = 'legal-research' | 'contract-review';

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

  return null;
}