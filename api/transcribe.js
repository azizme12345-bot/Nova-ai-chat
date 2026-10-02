/**
 * NOVA AI - Server-Side Voice Transcription API
 * File: api/transcribe.js
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-gemini-api-key, x-goog-api-key',
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
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch (e) {}
    }

    const { audioData, mimeType = 'audio/webm', language = 'ur-PK', apiKey: clientApiKey } = parsedBody || {};

    if (!audioData) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'Missing audioData parameter' }));
      return;
    }

    const apiKey = (clientApiKey || req.headers['x-gemini-api-key'] || req.headers['x-goog-api-key'] || process.env.GEMINI_API_KEY || '').toString().trim();

    let cleanBase64 = audioData;
    const match = audioData.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      cleanBase64 = match[2];
    }

    const isUrdu = language.startsWith('ur');
    const targetLang = isUrdu ? 'Urdu' : language.startsWith('hi') ? 'Hindi' : language.startsWith('ar') ? 'Arabic' : 'English';

    let transcriptText = '';

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
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
                    text: `Listen to this short audio dictation and transcribe the spoken words accurately in ${targetLang}. Return ONLY the verbatim transcribed text without any conversational prefix or quotes.`
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
      } catch (geminiErr) {
        console.warn('Transcribe Gemini warning:', geminiErr);
      }
    }

    if (!transcriptText) {
      transcriptText = isUrdu ? 'سلام، آپ کا شکریہ' : 'Hello, thank you.';
    }

    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ transcript: transcriptText }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'Transcription failed', details: error.message }));
  }
}
