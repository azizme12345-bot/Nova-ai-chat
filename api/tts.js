/**
 * NOVA AI - High Quality Audio TTS Streamer
 * File: api/tts.js
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const text = url.searchParams.get('text') || '';
    const lang = url.searchParams.get('lang') || 'en';

    if (!text) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'Missing text parameter' }));
      return;
    }

    // Clean text and remove Markdown syntax
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*#_`>|~[\]()-]/g, ' ')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\s+/g, ' ')
      .trim();

    const isUrdu = lang.startsWith('ur') || /[\u0600-\u06FF]/.test(cleanText);
    const targetLang = isUrdu ? 'ur' : lang.startsWith('hi') ? 'hi' : 'en';

    // Split text into chunks of <= 90 characters on word boundaries to prevent upstream 400
    const words = cleanText.split(' ');
    const chunks = [];
    let currentChunk = '';

    for (const w of words) {
      if ((currentChunk + ' ' + w).length > 90) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = w;
      } else {
        currentChunk = (currentChunk + ' ' + w).trim();
      }
      if (chunks.length >= 4) break; // Take first 4 segments for fast response
    }
    if (currentChunk && chunks.length < 4) {
      chunks.push(currentChunk.trim());
    }

    if (chunks.length === 0 && cleanText) {
      chunks.push(cleanText.substring(0, 90));
    }

    const buffers = [];
    for (const chunk of chunks) {
      if (!chunk) continue;
      const ttsUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${targetLang}&q=${encodeURIComponent(chunk)}`;
      try {
        const audioRes = await fetch(ttsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (audioRes.ok) {
          const arr = await audioRes.arrayBuffer();
          buffers.push(Buffer.from(arr));
        }
      } catch (err) {
        // continue to next chunk
      }
    }

    if (buffers.length > 0) {
      const combined = Buffer.concat(buffers);
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': combined.length,
        'Cache-Control': 'public, max-age=86400',
        ...CORS_HEADERS
      });
      res.end(combined);
      return;
    }

    throw new Error('No audio buffers retrieved');

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'TTS audio failed', details: error.message }));
  }
}
