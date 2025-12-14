const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { requireJwtAuth } = require('~/server/middleware');
const controller = require('~/server/controllers/LexDocGenController');
const { ensureDir, STORAGE_ROOT } = require('~/server/services/lexdocgen/constants');

const uploadDir = path.join(STORAGE_ROOT, 'uploads');
ensureDir(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-z0-9.\-]/gi, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.originalname.endsWith('.docx')) {
    return cb(new Error('Only .docx files are supported for LexDocGen.'));
  }
  return cb(null, true);
};

const upload = multer({ storage, fileFilter });

const router = express.Router();
router.use(requireJwtAuth);

router.post('/upload', upload.single('file'), controller.uploadTemplate);
router.get('/sessions', controller.listSessions);
router.get('/sessions/:sessionId', controller.getSession);
router.post('/sessions/:sessionId/message', controller.handleMessage);
router.post('/sessions/:sessionId/render', controller.renderDocument);
router.get('/sessions/:sessionId/download/:artifact', controller.downloadArtifact);

module.exports = router;
