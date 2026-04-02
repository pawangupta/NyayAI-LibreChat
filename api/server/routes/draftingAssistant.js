const express = require('express');
const http = require('http');
const https = require('https');

const router = express.Router();

const DRAFTING_ASSISTANT_BASE =
  process.env.DRAFTING_ASSISTANT_API_URL ||
  (process.env.HOST_DOCKER_INTERNAL
    ? `http://${process.env.HOST_DOCKER_INTERNAL}:8004`
    : 'http://host.docker.internal:8004');

function copyHeaders(sourceHeaders, res) {
  for (const [key, value] of Object.entries(sourceHeaders)) {
    if (value == null) {
      continue;
    }

    const lowerKey = key.toLowerCase();
    if (["connection", "content-encoding", "content-length", "transfer-encoding"].includes(lowerKey)) {
      continue;
    }

    res.setHeader(key, value);
  }
}

function proxyRequest(req, res, targetUrl, redirectCount = 0) {
  const url = new URL(targetUrl);
  const client = url.protocol === 'https:' ? https : http;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;

  let requestBody = null;
  const hasParsedJsonBody =
    req.body != null &&
    typeof req.body === 'object' &&
    !Buffer.isBuffer(req.body) &&
    req.is('application/json');

  if (hasParsedJsonBody) {
    requestBody = Buffer.from(JSON.stringify(req.body));
    headers['content-type'] = 'application/json';
    headers['content-length'] = String(requestBody.length);
  } else {
    delete headers['content-length'];
  }

  const proxyReq = client.request(
    url,
    {
      method: req.method,
      headers,
    },
    (proxyRes) => {
      const statusCode = proxyRes.statusCode ?? 502;
      const location = proxyRes.headers.location;

      if (
        location &&
        statusCode >= 301 &&
        statusCode <= 308 &&
        redirectCount < 3 &&
        (req.method === 'GET' || req.method === 'HEAD')
      ) {
        const redirectedUrl = new URL(location, url).toString();
        proxyRes.resume();
        proxyRequest(req, res, redirectedUrl, redirectCount + 1);
        return;
      }

      res.status(statusCode);
      copyHeaders(proxyRes.headers, res);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (error) => {
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Failed to reach Drafting Assistant backend',
        detail: error.message,
      });
      return;
    }

    res.end();
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    proxyReq.end();
    return;
  }

  if (requestBody) {
    proxyReq.end(requestBody);
    return;
  }

  req.pipe(proxyReq);
}

router.use((req, res) => {
  const targetUrl = `${DRAFTING_ASSISTANT_BASE}${req.originalUrl.replace(/^\/api\/drafting-assistant/, '')}`;
  proxyRequest(req, res, targetUrl);
});

module.exports = router;