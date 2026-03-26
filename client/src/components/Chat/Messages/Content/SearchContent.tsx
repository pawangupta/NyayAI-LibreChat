import { Suspense, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { DelayedRender } from '@librechat/client';
import { ContentTypes } from 'librechat-data-provider';
import type {
  Agents,
  TMessage,
  TAttachment,
  SearchResultData,
  TMessageContentParts,
} from 'librechat-data-provider';
import {
  ContractReviewWrapper,
  extractContractReviewPreview,
  extractContractReviewRawText,
  sanitizeContractReviewDisplayText,
} from '~/features/agents/contract-review';
import {
  LegalResearchWrapper,
  extractLegalResearchPreview,
} from '~/features/agents/legal-research';
import { DocDraftingWrapper, extractDocDraftingPreview } from '~/features/agents/doc-drafting';
import { getAgentResponseLayout } from './AgentResponseLayout';
import { UnfinishedMessage } from './MessageContent';
import Sources from '~/components/Web/Sources';
import { cn, mapAttachments } from '~/utils';
import { SearchContext } from '~/Providers';
import MarkdownLite from './MarkdownLite';
import store from '~/store';
import Part from './Part';

const SearchContent = ({
  message,
  attachments,
  searchResults,
}: {
  message: TMessage;
  attachments?: TAttachment[];
  searchResults?: { [key: string]: SearchResultData };
}) => {
  const enableUserMsgMarkdown = useRecoilValue(store.enableUserMsgMarkdown);
  const { messageId } = message;
  const agentResponseLayout = useMemo(
    () =>
      getAgentResponseLayout({
        endpoint: message.endpoint,
        model: message.model,
        isCreatedByUser: message.isCreatedByUser,
      }),
    [message.endpoint, message.model, message.isCreatedByUser],
  );
  const previewText = useMemo(() => {
    if (agentResponseLayout === 'legal-research') {
      return extractLegalResearchPreview({ content: message.content, fallbackText: message.text || '' });
    }

    if (agentResponseLayout === 'contract-review') {
      return extractContractReviewPreview({ content: message.content, fallbackText: message.text || '' });
    }

    if (agentResponseLayout === 'doc-drafting') {
      return extractDocDraftingPreview({ content: message.content, fallbackText: message.text || '' });
    }

    return '';
  }, [message.content, message.text, agentResponseLayout]);
  const contractRawText = useMemo(
    () =>
      agentResponseLayout === 'contract-review'
        ? extractContractReviewRawText({ content: message.content, fallbackText: message.text || '' })
        : '',
    [message.content, message.text, agentResponseLayout],
  );

  const attachmentMap = useMemo(() => mapAttachments(attachments ?? []), [attachments]);
  const sanitizedParts = useMemo(() => {
    if (agentResponseLayout !== 'contract-review' || !Array.isArray(message.content)) {
      return message.content;
    }

    return message.content.map((part) => {
      if (!part || part.type !== ContentTypes.TEXT) {
        return part;
      }

      if (typeof part.text === 'string') {
        return { ...part, text: sanitizeContractReviewDisplayText(part.text) };
      }

      if (typeof part.text?.value === 'string') {
        return {
          ...part,
          text: {
            ...part.text,
            value: sanitizeContractReviewDisplayText(part.text.value),
          },
        };
      }

      return part;
    });
  }, [message.content, agentResponseLayout]);

  if (Array.isArray(sanitizedParts) && sanitizedParts.length > 0) {
    const renderedParts = (
      <>
        {sanitizedParts
          .filter((part: TMessageContentParts | undefined) => part)
          .map((part: TMessageContentParts | undefined, idx: number) => {
            if (!part) {
              return null;
            }

            const toolCallId =
              (part?.[ContentTypes.TOOL_CALL] as Agents.ToolCall | undefined)?.id ?? '';
            const attachments = attachmentMap[toolCallId];
            return (
              <Part
                key={`display-${messageId}-${idx}`}
                showCursor={false}
                isSubmitting={false}
                isCreatedByUser={message.isCreatedByUser}
                attachments={attachments}
                part={part}
              />
            );
          })}
        {message.unfinished === true && (
          <Suspense>
            <DelayedRender delay={250}>
              <UnfinishedMessage message={message} key={`unfinished-${messageId}`} />
            </DelayedRender>
          </Suspense>
        )}
      </>
    );

    return (
      <SearchContext.Provider value={{ searchResults }}>
        {agentResponseLayout === 'legal-research' ? (
          <LegalResearchWrapper previewText={previewText} sources={<Sources />}>
            {renderedParts}
          </LegalResearchWrapper>
        ) : agentResponseLayout === 'contract-review' ? (
          <ContractReviewWrapper previewText={previewText} rawText={contractRawText}>
            {renderedParts}
          </ContractReviewWrapper>
        ) : agentResponseLayout === 'doc-drafting' ? (
          <DocDraftingWrapper previewText={previewText}>{renderedParts}</DocDraftingWrapper>
        ) : (
          <>
            <Sources />
            {renderedParts}
          </>
        )}
      </SearchContext.Provider>
    );
  }

  const markdownContent = (
    <div
      className={cn(
        'markdown prose dark:prose-invert light w-full break-words',
        message.isCreatedByUser && !enableUserMsgMarkdown && 'whitespace-pre-wrap',
        message.isCreatedByUser ? 'dark:text-gray-20' : 'dark:text-gray-70',
      )}
      dir="auto"
    >
      <MarkdownLite
        content={
          agentResponseLayout === 'contract-review'
            ? sanitizeContractReviewDisplayText(message.text || '')
            : message.text || ''
        }
      />
    </div>
  );

  if (agentResponseLayout === 'legal-research') {
    return (
      <SearchContext.Provider value={{ searchResults }}>
        <LegalResearchWrapper previewText={previewText}>{markdownContent}</LegalResearchWrapper>
      </SearchContext.Provider>
    );
  }

  if (agentResponseLayout === 'contract-review') {
    return (
      <SearchContext.Provider value={{ searchResults }}>
        <ContractReviewWrapper previewText={previewText} rawText={contractRawText}>
          {markdownContent}
        </ContractReviewWrapper>
      </SearchContext.Provider>
    );
  }

  if (agentResponseLayout === 'doc-drafting') {
    return (
      <SearchContext.Provider value={{ searchResults }}>
        <DocDraftingWrapper previewText={previewText}>{markdownContent}</DocDraftingWrapper>
      </SearchContext.Provider>
    );
  }

  return markdownContent;
};

export default SearchContent;
