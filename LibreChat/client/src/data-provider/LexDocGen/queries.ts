import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  QueryObserverResult,
} from '@tanstack/react-query';
import type {
  LexDocGenSessionEnvelope,
  LexDocGenSessionsResponse,
  LexDocGenUploadResponse,
} from '~/common';
import { uploadTemplate, listSessions, fetchSession, sendMessage, renderDocument } from './api';

const sessionsKey = ['lexdocgenSessions'];
const sessionKey = (sessionId: string) => ['lexdocgenSession', sessionId];

export const useLexDocGenSessionsQuery = (
  config?: UseQueryOptions<LexDocGenSessionsResponse>,
): QueryObserverResult<LexDocGenSessionsResponse> =>
  useQuery<LexDocGenSessionsResponse>(sessionsKey, listSessions, {
    refetchOnWindowFocus: false,
    ...config,
  });

export const useLexDocGenSessionQuery = (
  sessionId: string | null,
  config?: UseQueryOptions<LexDocGenSessionEnvelope>,
): QueryObserverResult<LexDocGenSessionEnvelope> =>
  useQuery<LexDocGenSessionEnvelope>(
    sessionKey(sessionId ?? ''),
    () => fetchSession(sessionId ?? ''),
    {
      enabled: Boolean(sessionId) && (config?.enabled ?? true),
      refetchOnWindowFocus: false,
      ...config,
    },
  );

export const useLexDocGenUploadMutation = (
  options?: UseMutationOptions<LexDocGenUploadResponse, Error, FormData>,
): UseMutationResult<LexDocGenUploadResponse, Error, FormData> => {
  const queryClient = useQueryClient();
  return useMutation<LexDocGenUploadResponse, Error, FormData>(uploadTemplate, {
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(sessionsKey);
      queryClient.setQueryData(sessionKey(data.session.sessionId), data);
      options?.onSuccess?.(data, variables, context);
    },
  });
};

type MessageArgs = { sessionId: string; payload: { fieldKey?: string; value?: unknown; message?: string } };

export const useLexDocGenMessageMutation = (
  options?: UseMutationOptions<LexDocGenSessionEnvelope, Error, MessageArgs>,
): UseMutationResult<LexDocGenSessionEnvelope, Error, MessageArgs> => {
  const queryClient = useQueryClient();
  return useMutation<LexDocGenSessionEnvelope, Error, MessageArgs>(
    ({ sessionId, payload }) => sendMessage(sessionId, payload),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(sessionsKey);
        queryClient.setQueryData(sessionKey(variables.sessionId), data);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

export const useLexDocGenRenderMutation = (
  options?: UseMutationOptions<LexDocGenSessionEnvelope, Error, string>,
): UseMutationResult<LexDocGenSessionEnvelope, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation<LexDocGenSessionEnvelope, Error, string>(renderDocument, {
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(sessionsKey);
      queryClient.setQueryData(sessionKey(variables), data);
      options?.onSuccess?.(data, variables, context);
    },
  });
};
