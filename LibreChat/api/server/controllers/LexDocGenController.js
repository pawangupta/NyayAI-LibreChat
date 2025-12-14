const { logger } = require('@librechat/data-schemas');
const LexDocGenService = require('~/server/services/lexdocgen');

async function uploadTemplate(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please provide a .docx file under the `file` field.' });
    }

    const result = await LexDocGenService.createSessionFromUpload({
      userId: req.user.id,
      documentType: req.body.documentType,
      tempPath: req.file.path,
      originalName: req.file.originalname,
    });

    return res.status(201).json(result);
  } catch (error) {
    logger.error('LexDocGen uploadTemplate failed', error);
    return res.status(500).json({ error: 'Unable to process template upload.' });
  }
}

async function listSessions(req, res) {
  try {
    const sessions = await LexDocGenService.listSessions(req.user.id);
    return res.json({ sessions });
  } catch (error) {
    logger.error('LexDocGen listSessions failed', error);
    return res.status(500).json({ error: 'Unable to load sessions.' });
  }
}

async function getSession(req, res) {
  try {
    const { sessionId } = req.params;
    const result = await LexDocGenService.getSession({ sessionId, userId: req.user.id });
    if (!result) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    return res.json(result);
  } catch (error) {
    logger.error('LexDocGen getSession failed', error);
    return res.status(500).json({ error: 'Unable to load the requested session.' });
  }
}

async function handleMessage(req, res) {
  try {
    const { sessionId } = req.params;
    const { fieldKey, value, message } = req.body ?? {};
    if (!fieldKey && !message) {
      return res.status(400).json({ error: 'Provide either a message or a field/value pair.' });
    }

    const result = await LexDocGenService.handleUserMessage({
      sessionId,
      userId: req.user.id,
      fieldKey,
      value,
      message,
    });

    if (!result) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    return res.json(result);
  } catch (error) {
    logger.error('LexDocGen handleMessage failed', error);
    return res.status(500).json({ error: 'Unable to process the message.' });
  }
}

async function renderDocument(req, res) {
  try {
    const { sessionId } = req.params;
    const result = await LexDocGenService.renderFinalDocument({ sessionId, userId: req.user.id });
    if (!result) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    return res.json(result);
  } catch (error) {
    logger.error('LexDocGen renderDocument failed', error);
    return res.status(400).json({ error: error.message || 'Unable to render document.' });
  }
}

async function downloadArtifact(req, res) {
  try {
    const { sessionId, artifact } = req.params;
    const asset = await LexDocGenService.getArtifact({
      sessionId,
      userId: req.user.id,
      artifact,
    });

    if (!asset) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (asset.stream) {
      res.setHeader('Content-Disposition', `attachment; filename="${asset.fileName}"`);
      return asset.stream.pipe(res);
    }

    return res.download(asset.filePath, asset.fileName);
  } catch (error) {
    logger.error('LexDocGen downloadArtifact failed', error);
    return res.status(400).json({ error: error.message || 'Unable to download artifact.' });
  }
}

module.exports = {
  uploadTemplate,
  listSessions,
  getSession,
  handleMessage,
  renderDocument,
  downloadArtifact,
};
