/**
 * NOVA AI - Serverless Check Key Route
 * File: api/check-key.js
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function isValidApiKey(val) {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return (
    trimmed.length > 10 &&
    trimmed !== 'MY_GOOGLE_API_KEY' &&
    trimmed !== 'MY_GEMINI_API_KEY' &&
    trimmed !== 'dummy' &&
    !trimmed.startsWith('YOUR_')
  );
}

import fs from 'fs';
import path from 'path';

function getUserApiKey() {
  if (process.env.USER_GEMINI_API_KEY && isValidApiKey(process.env.USER_GEMINI_API_KEY)) {
    return process.env.USER_GEMINI_API_KEY.trim();
  }
  try {
    const keyPath = path.resolve(process.cwd(), 'user_api_key.txt');
    if (fs.existsSync(keyPath)) {
      const key = fs.readFileSync(keyPath, 'utf-8').trim();
      if (isValidApiKey(key)) {
        process.env.USER_GEMINI_API_KEY = key;
        return key;
      }
    }
  } catch (e) {}
  return '';
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const key = getUserApiKey();
  res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
  res.end(JSON.stringify({ configured: !!key }));
}
