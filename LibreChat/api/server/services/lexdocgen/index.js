const REMOTE_URL = process.env.LEXDOCGEN_SERVICE_URL;

if (REMOTE_URL) {
  module.exports = require('./remoteClient');
} else {
  const { createLexDocGenService } = require('../../../../../paralx-user-inputs-capture/src');

  const service = createLexDocGenService({
    buildDownloadUrls: (sessionId) => ({
      template: `/api/lexdocgen/sessions/${sessionId}/download/template`,
      inputs: `/api/lexdocgen/sessions/${sessionId}/download/inputs`,
      final: `/api/lexdocgen/sessions/${sessionId}/download/final`,
    }),
  });

  module.exports = service;
}
