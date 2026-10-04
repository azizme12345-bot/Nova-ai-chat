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

function getServerApiKey() {
  const key = (
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
  if (key === 'MY_GOOGLE_API_KEY' || key === 'MY_GEMINI_API_KEY' || key === 'dummy') {
    return '';
  }
  return key;
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
      ? 'Urdu'
      : language.startsWith('hi')
      ? 'Hindi'
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
        'gemini-2.5-flash',
        'gemini-3-flash-preview',
        'gemini-3.1-flash-lite-preview',
        'gemini-flash-latest'
      ];
      for (const mName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: mName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'audio/webm',
                    data: cleanBase64
                  }
                },
                {
                  text: `Transcribe this spoken audio accurately in ${targetLang}. Return ONLY verbatim transcribed text without any extra commentary.`
                }
              ]
            }
          });

          if (response.text && response.text.trim()) {
            transcriptText = response.text.trim();
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
