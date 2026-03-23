import { memo, useMemo } from 'react';
import { ContentTypes } from 'librechat-data-provider';
import type {
  TMessageContentParts,
  SearchResultData,
  TAttachment,
  Agents,
} from 'librechat-data-provider';
import { MessageContext, SearchContext } from '~/Providers';
import MemoryArtifacts from './MemoryArtifacts';
import LegalResearchWrapper, {
  extractLegalResearchPreview,
} from './LegalResearchWrapper';
import Sources from '~/components/Web/Sources';
import { mapAttachments } from '~/utils/map';
import { EditTextPart } from './Parts';
import Part from './Part';

type ContentPartsProps = {
  content: Array<TMessageContentParts | undefined> | undefined;
  messageId: string;
  conversationId?: string | null;
  attachments?: TAttachment[];
  searchResults?: { [key: string]: SearchResultData };
  isCreatedByUser: boolean;
  useLegalResearchLayout?: boolean;
  isLast: boolean;
  isSubmitting: boolean;
  isLatestMessage?: boolean;
  edit?: boolean;
  enterEdit?: (cancel?: boolean) => void | null | undefined;
  siblingIdx?: number;
  setSiblingIdx?:
    | ((value: number) => void | React.Dispatch<React.SetStateAction<number>>)
    | null
    | undefined;
};

const ContentParts = memo(
  ({
    content,
    messageId,
    conversationId,
    attachments,
    searchResults,
    isCreatedByUser,
    useLegalResearchLayout = false,
    isLast,
    isSubmitting,
    isLatestMessage,
    edit,
    enterEdit,
    siblingIdx,
    setSiblingIdx,
  }: ContentPartsProps) => {
    const attachmentMap = useMemo(() => mapAttachments(attachments ?? []), [attachments]);
    const previewText = useMemo(
      () => extractLegalResearchPreview({ content }),
      [content],
    );

    const effectiveIsSubmitting = isLatestMessage ? isSubmitting : false;

    if (!content) {
      return null;
    }
    if (edit === true && enterEdit && setSiblingIdx) {
      return (
        <>
          {content.map((part, idx) => {
            if (!part) {
              return null;
            }
            const isTextPart =
              part?.type === ContentTypes.TEXT ||
              typeof (part as unknown as Agents.MessageContentText)?.text !== 'string';
            const isThinkPart =
              part?.type === ContentTypes.THINK ||
              typeof (part as unknown as Agents.ReasoningDeltaUpdate)?.think !== 'string';
            if (!isTextPart && !isThinkPart) {
              return null;
            }

            const isToolCall =
              part.type === ContentTypes.TOOL_CALL || part['tool_call_ids'] != null;
            if (isToolCall) {
              return null;
            }

            return (
              <EditTextPart
                index={idx}
                part={part as Agents.MessageContentText | Agents.ReasoningDeltaUpdate}
                messageId={messageId}
                isSubmitting={isSubmitting}
                enterEdit={enterEdit}
                siblingIdx={siblingIdx ?? null}
                setSiblingIdx={setSiblingIdx}
                key={`edit-${messageId}-${idx}`}
              />
            );
          })}
        </>
      );
    }

    const parts = content.map((part, idx) => {
      if (!part) {
        return null;
      }

      const toolCallId =
        (part?.[ContentTypes.TOOL_CALL] as Agents.ToolCall | undefined)?.id ?? '';
      const partAttachments = attachmentMap[toolCallId];

      return (
        <MessageContext.Provider
          key={`provider-${messageId}-${idx}`}
          value={{
            messageId,
            isExpanded: true,
            conversationId,
            partIndex: idx,
            nextType: content[idx + 1]?.type,
            isSubmitting: effectiveIsSubmitting,
            isLatestMessage,
          }}
        >
          <Part
            part={part}
            attachments={partAttachments}
            isSubmitting={effectiveIsSubmitting}
            key={`part-${messageId}-${idx}`}
            isCreatedByUser={isCreatedByUser}
            isLast={idx === content.length - 1}
            showCursor={idx === content.length - 1 && isLast}
          />
        </MessageContext.Provider>
      );
    });

    const mainContent = (
      <>
        <MemoryArtifacts attachments={attachments} />
        {parts}
      </>
    );

    return (
      <SearchContext.Provider value={{ searchResults }}>
        {useLegalResearchLayout ? (
          <LegalResearchWrapper
            previewText={previewText}
            sources={<Sources messageId={messageId} conversationId={conversationId || undefined} />}
          >
            {mainContent}
          </LegalResearchWrapper>
        ) : (
          <>
            <MemoryArtifacts attachments={attachments} />
            <Sources messageId={messageId} conversationId={conversationId || undefined} />
            {parts}
          </>
        )}
      </SearchContext.Provider>
    );
  },
);

export default ContentParts;
