import type { TConversation } from 'librechat-data-provider';
import {
  PAGEINDEX_CONTRACT_PRIMARY_MODEL,
  isPageIndexContractEndpointName,
  isPageIndexContractModelName,
} from '../config';

export function isPageIndexContractConversation(
  conversation?: Partial<TConversation> | null,
  fallbackModel?: string | null,
) {
  if (!conversation) {
    return false;
  }

  return (
    isPageIndexContractEndpointName(conversation.endpoint) ||
    isPageIndexContractEndpointName(conversation.chatGptLabel) ||
    isPageIndexContractModelName(conversation.model) ||
    isPageIndexContractModelName(fallbackModel) ||
    conversation.model === PAGEINDEX_CONTRACT_PRIMARY_MODEL
  );
}
