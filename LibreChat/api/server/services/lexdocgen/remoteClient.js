const fs = require('fs');
const fsPromises = require('fs/promises');
const axios = require('axios');
const FormData = require('form-data');
const { logger } = require('@librechat/data-schemas');

const BASE_URL = (process.env.LEXDOCGEN_SERVICE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.LEXDOCGEN_SERVICE_KEY || null;

if (!BASE_URL) {
  throw new Error('LEXDOCGEN_SERVICE_URL must be set to enable the remote LexDocGen service.');
}

function buildHeaders(userId, extra = {}) {
  return {
    'x-user-id': userId,
    ...(SERVICE_KEY ? { 'x-service-key': SERVICE_KEY } : {}),
    ...extra,
  };
}

function parseFileName(disposition, fallback) {
  if (!disposition) {
    return fallback;
  }

  const match = /filename\*?=([^;]+)/i.exec(disposition);
  if (!match) {
    return fallback;
  }

  let value = match[1].trim();
  if (value.startsWith("UTF-8''")) {
    value = value.slice(7);
  }

  return decodeURIComponent(value.replace(/^"|"$/g, '')) || fallback;
}

function isNotFound(error) {
  return Boolean(error?.response && error.response.status === 404);
}

async function createSessionFromUpload({ userId, documentType, tempPath, originalName }) {
  const form = new FormData();
  form.append('file', fs.createReadStream(tempPath), originalName);
  if (documentType) {
    form.append('documentType', documentType);
  }

  try {
    const { data } = await axios.post(`${BASE_URL}/upload`, form, {
      headers: buildHeaders(userId, form.getHeaders()),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return data;
  } catch (error) {
    logger.error('LexDocGen remote upload failed', error);
    throw error;
  } finally {
    await fsPromises.unlink(tempPath).catch(() => {});
  }
}

async function listSessions(userId) {
  const { data } = await axios.get(`${BASE_URL}/sessions`, {
    headers: buildHeaders(userId),
  });
  return data.sessions ?? data;
}

async function getSession({ sessionId, userId }) {
  try {
    const { data } = await axios.get(`${BASE_URL}/sessions/${sessionId}`, {
      headers: buildHeaders(userId),
    });
    return data;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

async function handleUserMessage({ sessionId, userId, fieldKey, value, message }) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/sessions/${sessionId}/message`,
      { fieldKey, value, message },
      { headers: buildHeaders(userId) }
    );
    return data;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

async function renderFinalDocument({ sessionId, userId }) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/sessions/${sessionId}/render`,
      {},
      { headers: buildHeaders(userId) }
    );
    return data;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

async function getArtifact({ sessionId, userId, artifact }) {
  try {
    const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/download/${artifact}`, {
      headers: buildHeaders(userId),
      responseType: 'stream',
    });

    const fileName = parseFileName(
      response.headers['content-disposition'],
      `${artifact || 'artifact'}-${sessionId}.bin`
    );

    return {
      stream: response.data,
      fileName,
    };
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

module.exports = {
  createSessionFromUpload,
  getSession,
  listSessions,
  handleUserMessage,
  renderFinalDocument,
  getArtifact,
  instances: {},
};
