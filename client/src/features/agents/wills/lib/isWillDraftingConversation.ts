import {
  isWillsEndpointName,
  isWillsModelName,
} from '../config';

export function isWillDraftingConversation(
  conversation:
    | {
        model?: string | null;
        chatGptLabel?: string | null;
        endpoint?: string | null;
      }
    | undefined
    | null,
) {
  if (!conversation) {
    return false;
  }

  return (
    isWillsEndpointName(conversation.endpoint) ||
    isWillsModelName(conversation.model) ||
    isWillsEndpointName(conversation.chatGptLabel) ||
    isWillsModelName(conversation.chatGptLabel)
  );
}
