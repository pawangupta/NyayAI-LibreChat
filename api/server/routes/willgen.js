/**
 * Proxy route: forwards /api/willgen/files/download/:id
 * to the WillGen backend (port 8003) server-side, avoiding browser CORS.
 */
const express = require('express');
const http = require('http');
const https = require('https');

const router = express.Router();

// Inside Docker, localhost refers to the container itself.
// Use host.docker.internal to reach services on the host machine.
const WILLGEN_BASE =
  process.env.WILLGEN_API_URL ||
  (process.env.HOST_DOCKER_INTERNAL
    ? `http://${process.env.HOST_DOCKER_INTERNAL}:8003`
    : 'http://host.docker.internal:8003');

function proxyDownloadById(req, res, id) {
  const targetUrl = `${WILLGEN_BASE}/v1/files/download/${id}`;
  const lib = targetUrl.startsWith('https') ? https : http;

  const options = {
    headers: {
      // Disable compression so we get raw bytes, no decompression needed
      'Accept-Encoding': 'identity',
    },
  };

  lib
    .get(targetUrl, options, (proxyRes) => {
      // Follow redirects (FastAPI FileResponse may 307)
      if (proxyRes.statusCode >= 301 && proxyRes.statusCode <= 308 && proxyRes.headers.location) {
        const redirectLib = proxyRes.headers.location.startsWith('https') ? https : http;
        redirectLib
          .get(proxyRes.headers.location, options, (redirRes) => {
            res.statusCode = redirRes.statusCode;
            ['content-type', 'content-disposition'].forEach((h) => {
              if (redirRes.headers[h]) res.setHeader(h, redirRes.headers[h]);
            });
            res.removeHeader('content-encoding');
            redirRes.pipe(res);
          })
          .on('error', (err) => {
            console.error('[willgen proxy] redirect error:', err.message);
            res.status(502).json({ error: 'Redirect failed', detail: err.message });
          });
        return;
      }

      res.statusCode = proxyRes.statusCode;
      // Forward content-type and content-disposition only.
      // Do NOT forward content-length or content-encoding — the upstream may use
      // gzip where content-length = compressed size, which truncates the decoded
      // bytes in the browser. Omitting it forces chunked transfer, which is safe.
      ['content-type', 'content-disposition'].forEach((h) => {
        if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
      });
      res.removeHeader('content-encoding');
      proxyRes.pipe(res);
    })
    .on('error', (err) => {
      console.error('[willgen proxy] error:', err.message);
      res.status(502).json({ error: 'Failed to reach WillGen backend', detail: err.message });
    });
}

router.get('/files/download/:id', (req, res) => {
  proxyDownloadById(req, res, req.params.id);
});

router.get('/v1/files/download/:id', (req, res) => {
  proxyDownloadById(req, res, req.params.id);
});

module.exports = router;
