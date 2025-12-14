const fs = require('fs/promises');
const path = require('path');
const { nanoid } = require('nanoid');
const { logger } = require('@librechat/data-schemas');
const { SESSION_DIR, OUTPUT_DIR, DEFAULT_SCHEMA_VERSION } = require('./constants');

class SessionStore {
  constructor() {
    this.baseDir = SESSION_DIR;
  }

  generateSessionId() {
    return nanoid(18);
  }

  async createSession({
    sessionId,
    userId,
    documentType = 'will',
    template,
    templateSchema,
    originalFileName,
    textPreview = '',
  }) {
    const id = sessionId ?? this.generateSessionId();
    const now = new Date().toISOString();

    /** @type {LexDocGenSession} */
    const session = {
      sessionId: id,
      userId,
      documentType,
      status: 'collecting',
      createdAt: now,
      updatedAt: now,
      progress: {
        answered: 0,
        total: templateSchema?.length ?? 0,
      },
      template: {
        path: template,
        originalFileName,
        schemaVersion: DEFAULT_SCHEMA_VERSION,
        schema: templateSchema ?? [],
        textPreview,
      },
      responses: {},
      history: [],
      artifacts: {
        template,
        inputs: null,
        final: null,
      },
    };

    await this._write(session);
    return session;
  }

  async _write(session) {
    const filePath = this._getSessionPath(session.sessionId);
    await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf8');
    return session;
  }

  _getSessionPath(sessionId) {
    return path.join(this.baseDir, `${sessionId}.json`);
  }

  async getSession(sessionId) {
    try {
      const data = await fs.readFile(this._getSessionPath(sessionId), 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      logger.error('LexDocGenSessionStore:getSession', error);
      throw error;
    }
  }

  async assertOwnedSession(sessionId, userId) {
    const session = await this.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return null;
    }
    return session;
  }

  async listSessions(userId) {
    const files = await fs.readdir(this.baseDir).catch(() => []);
    const sessions = [];

    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }

      try {
        const data = await fs.readFile(path.join(this.baseDir, file), 'utf8');
        const session = JSON.parse(data);
        if (session.userId === userId) {
          sessions.push(this._sanitize(session));
        }
      } catch (error) {
        logger.warn(`LexDocGenSessionStore:listSessions failed for ${file}`, error.message);
      }
    }

    return sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  _sanitize(session) {
    const { template, artifacts, ...rest } = session;
    return {
      ...rest,
      template: {
        originalFileName: template.originalFileName,
        schemaVersion: template.schemaVersion,
        schema: template.schema,
        textPreview: template.textPreview,
      },
      artifacts: {
        inputs: Boolean(artifacts.inputs),
        final: Boolean(artifacts.final),
        template: Boolean(artifacts.template),
      },
    };
  }

  async appendHistory(sessionId, userId, entry) {
    const session = await this.assertOwnedSession(sessionId, userId);
    if (!session) {
      return null;
    }

    session.history.push({ ...entry, timestamp: new Date().toISOString() });
    session.updatedAt = new Date().toISOString();
    await this._write(session);
    return session;
  }

  async updateField(sessionId, userId, fieldKey, value) {
    const session = await this.assertOwnedSession(sessionId, userId);
    if (!session) {
      return null;
    }

    session.responses[fieldKey] = value;
    session.progress.answered = Object.keys(session.responses).length;
    session.updatedAt = new Date().toISOString();
    await this._write(session);
    return session;
  }

  async updateStatus(sessionId, userId, status, overrides = {}) {
    const session = await this.assertOwnedSession(sessionId, userId);
    if (!session) {
      return null;
    }

    session.status = status;
    session.updatedAt = new Date().toISOString();
    Object.assign(session, overrides);
    await this._write(session);
    return session;
  }

  async attachArtifacts(sessionId, userId, { inputsPath, finalPath }) {
    const session = await this.assertOwnedSession(sessionId, userId);
    if (!session) {
      return null;
    }

    session.artifacts.inputs = inputsPath ?? session.artifacts.inputs;
    session.artifacts.final = finalPath ?? session.artifacts.final;
    session.updatedAt = new Date().toISOString();
    await this._write(session);
    return session;
  }

  getArtifactPath(session, artifact) {
    if (artifact === 'template') {
      return session.template.path;
    }

    if (artifact === 'inputs') {
      return session.artifacts.inputs;
    }

    if (artifact === 'final') {
      return session.artifacts.final;
    }

    return null;
  }

  getOutputDir(sessionId) {
    return path.join(OUTPUT_DIR, sessionId);
  }
}

module.exports = SessionStore;
