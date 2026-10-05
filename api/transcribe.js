/**
 * NOVA AI - Server-Side Voice Transcription API
 * File: api/transcribe.js
 */
import { GoogleGenAI } from '@google/genai';

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

function getServerApiKey() {
  const userKey = getUserApiKey();
  if (userKey) return userKey;

  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.API_KEY,
    process.env.VITE_GEMINI_API_KEY
  ];
  for (const c of candidates) {
    if (isValidApiKey(c)) return c.trim();
  }
  return '';
}

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
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch (e) {}
    }

    const { audioData, mimeType = 'audio/webm', language = 'ur-PK' } = parsedBody || {};

    if (!audioData) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'Missing audioData parameter' }));
      return;
    }

    const apiKey = getServerApiKey();

    let cleanBase64 = audioData;
    const match = audioData.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      cleanBase64 = match[2];
    }

    const isUrdu = language.startsWith('ur');
    const targetLang = isUrdu
      ? 'Urdu (اردو)'
      : language.startsWith('hi')
      ? 'Hindi (हिंदी)'
      : language.startsWith('pa')
      ? 'Punjabi'
      : language.startsWith('ar')
      ? 'Arabic'
      : 'English';

    let transcriptText = '';

    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const candidateModels = [
        'gemini-3.5-transcribe',
        'gemini-3.8-flash'
      ];
      for (const mName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: mName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: (mimeType || 'audio/webm').split(';')[0],
                      data: cleanBase64
                    }
                  },
                  {
                    text: `Transcribe the spoken human voice in this audio clip accurately (preferred script: ${targetLang}, or English/Hindi/Urdu as spoken). If there is only silence or background noise with no clear words, return ONLY the word SILENCE. Otherwise return ONLY the exact transcribed text with zero commentary.`
                  }
                ]
              }
            ]
          });

          const rawOut = (response.text || '').trim();
          if (rawOut && rawOut.toUpperCase() !== 'SILENCE' && !rawOut.toLowerCase().includes('no speech')) {
            transcriptText = rawOut;
            break;
          }
        } catch (mErr) {
          // try next model
        }
      }
    }

    if (!transcriptText) {
      res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(
        JSON.stringify({
          transcript: '',
          useBrowserSpeech: true,
          notice: 'Browser Web Speech API active'
        })
      );
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ transcript: transcriptText }));
  } catch (error) {
    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(
      JSON.stringify({
        transcript: '',
        useBrowserSpeech: true,
        details: error.message
      })
    );
  }
}
