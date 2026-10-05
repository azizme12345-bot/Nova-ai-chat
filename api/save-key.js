/**
 * NOVA AI - Serverless Save Key Route
 * File: api/save-key.js
 */
import fs from 'fs';
import path from 'path';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  try {
    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => { body += chunk; });
      req.on('end', resolve);
      req.on('error', reject);
    });

    let parsedBody = {};
    if (body) {
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }
    }

    const { apiKey } = parsedBody;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'Invalid API Key' }));
      return;
    }

    const trimmedKey = apiKey.trim();
    process.env.GOOGLE_API_KEY = trimmedKey;
    process.env.GEMINI_API_KEY = trimmedKey;

    // Save persistently to .env file in the root directory
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }
    const lines = envContent.split('\n').filter(line => !line.startsWith('GOOGLE_API_KEY=') && !line.startsWith('GEMINI_API_KEY='));
    lines.push(`GOOGLE_API_KEY=${trimmedKey}`);
    lines.push(`GEMINI_API_KEY=${trimmedKey}`);
    fs.writeFileSync(envPath, lines.join('\n'), 'utf-8');

    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ success: true, message: 'Google API Key saved persistently on the backend!' }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
  }
}
