import React, { useCallback, useMemo, memo } from 'react';
import { useAtomValue } from 'jotai';
import { useRecoilValue } from 'recoil';
import { type TMessage } from 'librechat-data-provider';
import type { TMessageProps, TMessageIcon } from '~/common';
import MessageContent from '~/components/Chat/Messages/Content/MessageContent';
import PlaceholderRow from '~/components/Chat/Messages/ui/PlaceholderRow';
import SiblingSwitch from '~/components/Chat/Messages/SiblingSwitch';
import HoverButtons from '~/components/Chat/Messages/HoverButtons';
import MessageIcon from '~/components/Chat/Messages/MessageIcon';
import { Plugin } from '~/components/Messages/Content';
import SubRow from '~/components/Chat/Messages/SubRow';
import { fontSizeAtom } from '~/store/fontSize';
import { MessageContext } from '~/Providers';
import { useMessageActions } from '~/hooks';
import { cn, logger } from '~/utils';
import store from '~/store';
import DocumentCard from '~/components/Messages/ui/DocumentCard';
import ProcessingStatus from '~/components/Messages/ui/ProcessingStatus';
import RedlineSuggestion from '~/components/Messages/ui/RedlineSuggestion';
import QuickActions from '~/components/Messages/ui/QuickActions';
import { parseContractUiMetadata, getBadgeToneClass } from '~/components/Messages/utils/contractMetadata';
import { renderAnalysisIcon, getMessageTimestamp } from '~/components/Messages/utils/presentation';

type MessageRenderProps = {
  message?: TMessage;
  isCard?: boolean;
  isMultiMessage?: boolean;
  isSubmittingFamily?: boolean;
} & Pick<
  TMessageProps,
  'currentEditId' | 'setCurrentEditId' | 'siblingIdx' | 'setSiblingIdx' | 'siblingCount'
>;

const MessageRender = memo(
  ({
    message: msg,
    isCard = false,
    siblingIdx,
    siblingCount,
    setSiblingIdx,
    currentEditId,
    isMultiMessage = false,
    setCurrentEditId,
    isSubmittingFamily = false,
  }: MessageRenderProps) => {
    const {
      ask,
      edit,
      index,
      agent,
      assistant,
      enterEdit,
      conversation,
      messageLabel,
      isSubmitting,
      latestMessage,
      handleContinue,
      copyToClipboard,
      setLatestMessage,
      regenerateMessage,
      handleFeedback,
    } = useMessageActions({
      message: msg,
      currentEditId,
      isMultiMessage,
      setCurrentEditId,
    });
    const fontSize = useAtomValue(fontSizeAtom);
    const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);

    const handleRegenerateMessage = useCallback(() => regenerateMessage(), [regenerateMessage]);
    const hasNoChildren = !(msg?.children?.length ?? 0);
    const isLast = useMemo(
      () => hasNoChildren && (msg?.depth === latestMessage?.depth || msg?.depth === -1),
      [hasNoChildren, msg?.depth, latestMessage?.depth],
    );
    const isLatestMessage = msg?.messageId === latestMessage?.messageId;
    const showCardRender = isLast && !isSubmittingFamily && isCard;
    const isLatestCard = isCard && !isSubmittingFamily && isLatestMessage;

    /** Only pass isSubmitting to the latest message to prevent unnecessary re-renders */
    const effectiveIsSubmitting = isLatestMessage ? isSubmitting : false;

    const iconData: TMessageIcon = useMemo(
      () => ({
        endpoint: msg?.endpoint ?? conversation?.endpoint,
        model: msg?.model ?? conversation?.model,
        iconURL: msg?.iconURL,
        modelLabel: messageLabel,
        isCreatedByUser: msg?.isCreatedByUser,
      }),
      [
        messageLabel,
        conversation?.endpoint,
        conversation?.model,
        msg?.model,
        msg?.iconURL,
        msg?.endpoint,
        msg?.isCreatedByUser,
      ],
    );

    const clickHandler = useMemo(
      () =>
        showCardRender && !isLatestMessage
          ? () => {
              logger.log(
                'latest_message',
                `Message Card click: Setting ${msg?.messageId} as latest message`,
              );
              logger.dir(msg);
              setLatestMessage(msg!);
            }
          : undefined,
      [showCardRender, isLatestMessage, msg, setLatestMessage],
    );

    if (!msg) {
      return null;
    }

    const baseClasses = {
      common: 'group mx-auto flex flex-1 gap-3 transition-all duration-300 transform-gpu ',
      card: 'relative w-full gap-1 rounded-lg border border-border-medium bg-surface-primary-alt p-2 md:w-1/2 md:gap-3 md:p-4',
      chat: maximizeChatSpace
        ? 'w-full max-w-full md:px-5 lg:px-1 xl:px-5'
        : 'md:max-w-[47rem] xl:max-w-[55rem]',
    };

    const conditionalClasses = {
      latestCard: isLatestCard ? 'bg-surface-secondary' : '',
      cardRender: showCardRender ? 'cursor-pointer transition-colors duration-300' : '',
      focus: 'focus:outline-none focus:ring-2 focus:ring-border-xheavy',
    };

    const { documentCard, processingSteps, analysisCards, redlineSuggestions, quickActions, statusBadge } = useMemo(
      () => parseContractUiMetadata(msg, msg.attachments),
      [msg],
    );

    const timestampLabel = useMemo(() => getMessageTimestamp(msg), [msg]);
    const showPlaceholderRow = hasNoChildren && (isSubmittingFamily === true || effectiveIsSubmitting);
    const shouldShowQuickActions = !msg.isCreatedByUser && isLast && isLatestMessage;

    return (
      <div
        id={msg.messageId}
        aria-label={`message-${msg.depth}-${msg.messageId}`}
        className={cn(
          baseClasses.common,
          isCard ? baseClasses.card : baseClasses.chat,
          conditionalClasses.latestCard,
          conditionalClasses.cardRender,
          conditionalClasses.focus,
          'message-render message',
          msg.isCreatedByUser ? 'message-user' : 'message-agent',
        )}
        onClick={clickHandler}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && clickHandler) {
            clickHandler();
          }
        }}
        role={showCardRender ? 'button' : undefined}
        tabIndex={showCardRender ? 0 : undefined}
      >
        {isLatestCard && (
          <div className="absolute right-0 top-0 m-2 h-3 w-3 rounded-full bg-text-primary" />
        )}

        <div className="relative flex flex-shrink-0 flex-col items-center">
          <div
            className={cn(
              'message-avatar flex items-center justify-center overflow-hidden rounded-full',
              msg.isCreatedByUser ? 'user' : 'agent',
            )}
          >
            <MessageIcon iconData={iconData} assistant={assistant} agent={agent} />
          </div>
        </div>

        <div
          className={cn(
            'relative flex w-11/12 flex-col message-content',
            msg.isCreatedByUser ? 'user-turn' : 'agent-turn',
          )}
        >
          <div className="message-header">
            <span className={cn('message-sender select-none font-semibold', fontSize)}>{messageLabel}</span>
            {timestampLabel && <span className="message-time">{timestampLabel}</span>}
            {statusBadge && (
              <span className={cn('badge', getBadgeToneClass(statusBadge.tone))}>{statusBadge.label}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {(documentCard || processingSteps) && (
              <div className="message-metadata-stack">
                {documentCard && <DocumentCard {...documentCard} />}
                {processingSteps && <ProcessingStatus steps={processingSteps} />}
              </div>
            )}

            <div className="message-body">
              <div className="flex max-w-full flex-grow flex-col gap-0">
                <MessageContext.Provider
                  value={{
                    messageId: msg.messageId,
                    conversationId: conversation?.conversationId,
                    isExpanded: false,
                    isSubmitting: effectiveIsSubmitting,
                    isLatestMessage,
                  }}
                >
                  {msg.plugin && <Plugin plugin={msg.plugin} />}
                  <MessageContent
                    ask={ask}
                    edit={edit}
                    isLast={isLast}
                    text={msg.text || ''}
                    message={msg}
                    enterEdit={enterEdit}
                    error={!!(msg.error ?? false)}
                    isSubmitting={effectiveIsSubmitting}
                    unfinished={msg.unfinished ?? false}
                    isCreatedByUser={msg.isCreatedByUser ?? true}
                    siblingIdx={siblingIdx ?? 0}
                    setSiblingIdx={setSiblingIdx ?? (() => ({}))}
                  />
                </MessageContext.Provider>
              </div>
            </div>

            {analysisCards?.length ? (
              <div className="contract-analysis-grid">
                {analysisCards.map((card, index) => (
                  <div className="analysis-card" key={card.id ?? `${card.title}-${index}`}>
                    <div className="analysis-header">
                      <div className="analysis-icon">{renderAnalysisIcon(card.icon)}</div>
                      <div className="analysis-title">{card.title}</div>
                      {card.badge && (
                        <span className={cn('badge', getBadgeToneClass(card.badge.tone))}>{card.badge.label}</span>
                      )}
                    </div>
                    {card.body && <div className="analysis-body">{card.body}</div>}
                  </div>
                ))}
              </div>
            ) : null}

            {redlineSuggestions?.length ? (
              <div className="redline-list">
                {redlineSuggestions.map((suggestion, index) => (
                  <RedlineSuggestion
                    key={`${suggestion.clauseLabel}-${index}`}
                    {...suggestion}
                    number={suggestion.number ?? index + 1}
                  />
                ))}
              </div>
            ) : null}

            {showPlaceholderRow ? (
              <PlaceholderRow isCard={isCard} />
            ) : (
              <>
                {shouldShowQuickActions && (
                  <QuickActions actions={quickActions?.length ? quickActions : undefined} />
                )}
                <SubRow classes="text-xs">
                  <SiblingSwitch
                    siblingIdx={siblingIdx}
                    siblingCount={siblingCount}
                    setSiblingIdx={setSiblingIdx}
                  />
                  <HoverButtons
                    index={index}
                    isEditing={edit}
                    message={msg}
                    enterEdit={enterEdit}
                    isSubmitting={effectiveIsSubmitting}
                    conversation={conversation ?? null}
                    regenerate={handleRegenerateMessage}
                    copyToClipboard={copyToClipboard}
                    handleContinue={handleContinue}
                    latestMessage={latestMessage}
                    handleFeedback={handleFeedback}
                    isLast={isLast}
                  />
                </SubRow>
              </>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default MessageRender;
