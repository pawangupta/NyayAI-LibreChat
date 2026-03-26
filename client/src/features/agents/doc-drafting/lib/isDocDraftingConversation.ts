import type { TConversation } from 'librechat-data-provider';
import {
  DOC_DRAFTING_PRIMARY_MODEL,
  isDocDraftingEndpointName,
  isDocDraftingModelName,
} from '../config';

export function isDocDraftingConversation(
  conversation?: Partial<TConversation> | null,
  fallbackModel?: string | null,
) {
  if (!conversation) {
    return false;
  }

  return (
    isDocDraftingEndpointName(conversation.endpoint) ||
    isDocDraftingEndpointName(conversation.chatGptLabel) ||
    isDocDraftingModelName(conversation.model) ||
    isDocDraftingModelName(fallbackModel) ||
    conversation.model === DOC_DRAFTING_PRIMARY_MODEL
  );
}
