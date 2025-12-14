import type {
  LexDocGenSessionsResponse,
  LexDocGenUploadResponse,
  LexDocGenSessionEnvelope,
} from '~/common';

const BASE_URL = '/api/lexdocgen';

type MessagePayload = {
  fieldKey?: string;
  value?: unknown;
  message?: string;
};

async function parseError(response: Response): Promise<never> {
  let message = 'Unable to complete the request.';
  try {
    const data = await response.json();
    message = data?.error || data?.message || message;
  } catch (_error) {
    // ignore JSON parse errors
  }
  throw new Error(message);
}

async function requestJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    headers: {
      ...(init?.body && !(init?.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function uploadTemplate(formData: FormData): Promise<LexDocGenUploadResponse> {
  return requestJSON(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
}

export async function listSessions(): Promise<LexDocGenSessionsResponse> {
  return requestJSON(`${BASE_URL}/sessions`);
}

export async function fetchSession(sessionId: string): Promise<LexDocGenSessionEnvelope> {
  return requestJSON(`${BASE_URL}/sessions/${sessionId}`);
}

export async function sendMessage(
  sessionId: string,
  payload: MessagePayload,
): Promise<LexDocGenSessionEnvelope> {
  return requestJSON(`${BASE_URL}/sessions/${sessionId}/message`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function renderDocument(sessionId: string): Promise<LexDocGenSessionEnvelope> {
  return requestJSON(`${BASE_URL}/sessions/${sessionId}/render`, {
    method: 'POST',
  });
}
