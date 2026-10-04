/**
 * NOVA AI - Backend Chat & Multimodal Assistant Route
 * File: api/chat.js
 */
import { GoogleGenAI } from '@google/genai';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function getServerApiKey() {
  const key = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();
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

    const {
      prompt,
      message,
      model,
      image,
      mimeType,
      attachedUrl,
      language,
      history = []
    } = parsedBody || {};

    const userPrompt = prompt || message || (history.length > 0 ? history[history.length - 1].text : '');

    if (!userPrompt && !image) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'Missing prompt parameter' }));
      return;
    }

    let scrapedUrlContext = '';
    if (attachedUrl) {
      try {
        const fetchRes = await fetch(attachedUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          const cleanText = html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 16000);
          scrapedUrlContext = `\n\n[WEBSITE CONTENT SCRAPED FROM USER LINK ${attachedUrl}]:\n${cleanText}\n\n`;
        }
      } catch (err) {
        scrapedUrlContext = `\n\n[WEBSITE LINK]: ${attachedUrl}\n\n`;
      }
    }

    let finalPrompt = userPrompt || 'Please analyze the attached file.';
    if (scrapedUrlContext) {
      finalPrompt = `${finalPrompt}${scrapedUrlContext}`;
    }

    const langInstruction = language ? `Strictly respond in ${language}.` : `Respond naturally in the same language as the user's message (Urdu, Hindi, English, etc.).`;
    const systemInstruction = `You are NOVA AI, a World-Class Multimodal AI Assistant, Senior Software Engineer, and Expert PDF & Link Auditor.
${langInstruction}
Always give helpful, accurate, and well-structured responses with clean Markdown and code blocks when needed.`;

    const normalizedContents = [];

    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      let lastRole = null;

      for (const msg of recentHistory) {
        const role = msg.role === 'user' ? 'user' : 'model';
        const textContent = (msg.text || '').trim();
        if (!textContent && !msg.attachment) continue;

        const parts = [{ text: textContent || 'Analyzed data.' }];
        if (msg.attachment && role === 'user' && msg.attachmentMimeType !== 'url') {
          let cleanBase64 = msg.attachment;
          let detectedMime = msg.attachmentMimeType || 'image/jpeg';
          const match = msg.attachment.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            detectedMime = match[1];
            cleanBase64 = match[2];
          }
          parts.push({
            inlineData: {
              mimeType: detectedMime,
              data: cleanBase64
            }
          });
        }

        if (role === lastRole && normalizedContents.length > 0) {
          normalizedContents[normalizedContents.length - 1].parts.push(...parts);
        } else {
          normalizedContents.push({ role, parts });
          lastRole = role;
        }
      }
    }

    if (normalizedContents.length === 0) {
      const parts = [{ text: finalPrompt }];
      if (image && mimeType !== 'url') {
        let cleanBase64 = image;
        let detectedMime = mimeType || 'image/jpeg';
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          detectedMime = match[1];
          cleanBase64 = match[2];
        }
        parts.push({
          inlineData: {
            mimeType: detectedMime,
            data: cleanBase64
          }
        });
      }
      normalizedContents.push({ role: 'user', parts });
    }

    if (normalizedContents[normalizedContents.length - 1].role !== 'user') {
      normalizedContents.push({ role: 'user', parts: [{ text: finalPrompt }] });
    }

    const apiKey = getServerApiKey();
    let aiText = '';

    let targetModels = [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.1-pro-preview'
    ];

    const requestedModel = (model || '').toLowerCase();
    if (requestedModel.includes('pro')) {
      targetModels = ['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    } else if (requestedModel.includes('lite')) {
      targetModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-pro-preview'];
    }

    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      for (const mName of targetModels) {
        try {
          const response = await ai.models.generateContent({
            model: mName,
            contents: normalizedContents,
            config: {
              systemInstruction,
              temperature: 0.7,
              topP: 0.95
            }
          });

          if (response.text && response.text.trim()) {
            aiText = response.text.trim();
            break;
          }
        } catch (err) {
          // try next model
        }
      }
    }

    if (!aiText) {
      res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({
        error: 'Server API key (GOOGLE_API_KEY / GEMINI_API_KEY) is not configured or quota exceeded.'
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ text: aiText, reply: aiText }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
}
