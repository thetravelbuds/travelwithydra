/**
 * Local Netlify Functions server (no Netlify CLI / login required).
 * Proxied by Vite at /.netlify/functions → port 9999.
 */
import { createServer } from 'http';
import { config } from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const functionsDir = join(root, 'netlify', 'functions');

config({ path: resolve(root, '.env') });
config({ path: resolve(root, '.env.local'), override: true });

const port = Number(process.env.NETLIFY_FUNCTIONS_PORT || 9999);
const handlerCache = new Map();

async function loadHandler(name) {
  if (handlerCache.has(name)) return handlerCache.get(name);
  const filePath = join(functionsDir, `${name}.mjs`);
  const mod = await import(pathToFileURL(filePath).href);
  if (typeof mod.handler !== 'function') {
    throw new Error(`Function "${name}" has no exported handler`);
  }
  handlerCache.set(name, mod.handler);
  return mod.handler;
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function toNetlifyEvent(req, body) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers[key] = Array.isArray(value) ? value.join(', ') : value;
  }

  return {
    httpMethod: req.method || 'GET',
    headers,
    body: body || null,
    path: url.pathname,
    rawUrl: url.toString(),
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    isBase64Encoded: false,
  };
}

function sendNetlifyResponse(res, result) {
  const statusCode = result?.statusCode ?? 500;
  const headers = result?.headers ?? {};
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.statusCode = statusCode;
  res.end(result?.body ?? '');
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const match = url.pathname.match(/^\/(?:\.netlify\/functions\/)?([^/?#]+)\/?$/);
    if (!match) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const name = match[1];
    const handler = await loadHandler(name);
    const body = req.method === 'GET' || req.method === 'HEAD' ? '' : await readBody(req);
    const event = toNetlifyEvent(req, body);
    const result = await handler(event);
    sendNetlifyResponse(res, result);
  } catch (err) {
    console.error('[functions]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Function error' }));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Netlify functions (local) → http://127.0.0.1:${port}`);
});
