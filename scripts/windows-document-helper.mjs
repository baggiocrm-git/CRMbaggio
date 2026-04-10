import { createServer } from 'node:http';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.DOCUMENT_HELPER_PORT || 43125);
const downloadDir = path.join(tmpdir(), 'cbsl-erp-documents');
if (!existsSync(downloadDir)) {
  mkdirSync(downloadDir, { recursive: true });
}

function setCorsHeaders(res, origin = '') {
  const allowOrigin = origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, payload, origin = '') {
  setCorsHeaders(res, origin);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sanitizeFilename(name = 'documento') {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim() || 'documento';
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function downloadFile(url, filename) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Falha ao baixar arquivo (${response.status})`);
  }

  const extension = path.extname(filename) || '';
  const baseName = path.basename(filename, extension);
  const finalName = `${sanitizeFilename(baseName)}-${randomUUID()}${extension}`;
  const finalPath = path.join(downloadDir, finalName);

  await pipeline(response.body, createWriteStream(finalPath));
  return finalPath;
}

function openFileInWindows(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn('cmd', ['/c', 'start', '', filePath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });

    child.on('error', reject);
    child.unref();
    resolve(true);
  });
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || '';

  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, origin);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true, port: PORT }, origin);
    return;
  }

  if (req.method === 'POST' && req.url === '/open') {
    try {
      const body = await readJsonBody(req);
      const { url, filename } = body || {};

      if (!url || !filename) {
        sendJson(res, 400, { error: 'URL e filename são obrigatórios.' }, origin);
        return;
      }

      const downloadedPath = await downloadFile(url, filename);
      await openFileInWindows(downloadedPath);

      sendJson(res, 200, { ok: true, path: downloadedPath }, origin);

      setTimeout(() => {
        unlink(downloadedPath).catch(() => {});
      }, 1000 * 60 * 30);
    } catch (error) {
      sendJson(
        res,
        500,
        { error: error instanceof Error ? error.message : 'Falha ao abrir arquivo localmente.' },
        origin
      );
    }
    return;
  }

  sendJson(res, 404, { error: 'Rota não encontrada.' }, origin);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`CBSL Documents Helper ouvindo em http://127.0.0.1:${PORT}`);
  console.log(`Arquivos temporários: ${downloadDir}`);
});
