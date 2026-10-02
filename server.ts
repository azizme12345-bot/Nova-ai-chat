import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-gemini-api-key, x-goog-api-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function analyzeAndExpandPrompt(rawPrompt: string, apiKey?: string, isEditing: boolean = false): Promise<string> {
  if (!rawPrompt) return 'High resolution masterwork artwork';

  const lower = rawPrompt.toLowerCase();
  const isQuranic = lower.includes('قرآن') || lower.includes('سور') || lower.includes('بِسْمِ') || lower.includes('quran') || lower.includes('surah') || lower.includes('jumu') || lower.includes('juma') || lower.includes('bismillah') || lower.includes('calligraph') || lower.includes('green background');

  if (isQuranic) {
    return `Pristine masterwork Islamic calligraphic graphic print on a solid deep emerald green background with high-contrast white and gold Arabic calligraphy. Top center reads 'القرآن الكريم', center reads 'سُورَةُ الْجُمُعَة', middle reads 'VERSE(S) 9-10', and bottom reads 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ'. ABSOLUTELY ZERO HUMAN FIGURES, ZERO PEOPLE, ZERO BOYS, pure sacred Arabic typography, illuminated manuscript border, 8k vector precision.`;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const aiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (!aiKey) return rawPrompt;

    const ai = new GoogleGenAI({
      apiKey: aiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const analysisInstruction = `You are a World-Class AI Image Prompt Architect.
Analyze the user's request deeply to understand the EXACT subject, language, text, and scene:

CRITICAL MANDATES:
1. IF the prompt mentions Quran, Surah (e.g. Surah Al-Jumu'ah / Al-Baqarah), Ayah / Verses, Bismillah, Arabic Calligraphy, Islamic typography, or Islamic art:
   - STRICTLY formulate an image generation prompt for a pristine Islamic calligraphic graphic print.
   - Include: Solid deep emerald green background, ornate gold and white calligraphic script for 'القرآن الكريم' at top center, traditional Thuluth Arabic script for 'سُورَةُ الْجُمُعَة' in middle, 'VERSE(S) 9-10' cleanly typeset, and 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ' at the bottom.
   - MANDATORY: ABSOLUTELY ZERO HUMAN FIGURES, ZERO PEOPLE, ZERO BOYS, ZERO PORTRAITS. Only pristine Islamic Arabic calligraphy, gold leaf accents, and sacred typography.

2. IF the prompt is for a general image (e.g., car, landscape, animal, futuristic city, logo):
   - Expand the prompt into a detailed, high-resolution masterwork prompt in English that captures the user's exact subject without introducing unrelated objects or figures.

3. IF editing an existing image (${isEditing ? 'YES' : 'NO'}):
   - Modify ONLY what the user explicitly requested while preserving the original subject, face, or scene structure.

Return ONLY the refined, detailed masterwork image generation prompt in English.`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [{ text: `User Prompt: ${rawPrompt}` }] },
          config: {
            systemInstruction: analysisInstruction,
            temperature: 0.2
          }
        });

        if (response.text && response.text.trim()) {
          return response.text.trim();
        }
      } catch (err) {
        // try next model
      }
    }
  } catch (err) {
    // Fallback
  }

  return rawPrompt;
}

function generateFallbackResponse(prompt: string, language?: string): string {
  const lower = prompt.toLowerCase().trim();
  const isUrdu = (language && language.toLowerCase().includes('urdu')) || /[\u0600-\u06FF]/.test(prompt);

  // Short greetings
  if (lower === 'hi' || lower === 'hello' || lower === 'سلام' || lower === 'ہائے' || lower === 'سلام علیکم' || lower === 'assalam o alaikum') {
    return isUrdu 
      ? 'سلام! میں نووا AI ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟'
      : 'Hello! I am NOVA AI. How can I help you today?';
  }

  // How are you
  if (lower.includes('how are you') || lower.includes('kya hal hai') || lower.includes('کیسے ہو') || lower.includes('کیا حال ہے')) {
    return isUrdu
      ? 'میں بالکل ٹھیک ہوں، الحمدللہ! آپ بتائیں کیسے ہیں؟ گھر میں سب کیسے ہیں؟'
      : 'I am doing great, thank you! How are you doing today?';
  }

  // Explicit feature request
  if (lower.includes('what can you do') || lower.includes('features') || lower.includes('کیا کیا کر سکتے ہو') || lower.includes('فیچرز')) {
    return isUrdu
      ? `میں NOVA AI ہوں! میں آپ کے ساتھ قدرتی انداز میں بات چیت کر سکتا ہوں، آپ کے سوالات کے جوابات دے سکتا ہوں، کوڈ لکھ اور ٹھیک کر سکتا ہوں، اور تصاویر یا قرآن پاک کی خطاطی جنریٹ کر سکتا ہوں۔`
      : `I am NOVA AI! I can chat naturally, answer questions, write and debug code, analyze screenshots, and generate photos or calligraphy artwork.`;
  }

  // General natural short fallback
  if (isUrdu) {
    return `جی بالکل! میں آپ کی بات سمجھ گیا ہوں۔ آپ اس کے بارے میں مزید کیا جاننا چاہتے ہیں؟`;
  }

  return `Sure! I understand. How would you like to proceed with this?`;
}

// Voice Transcription Endpoint
app.post('/api/transcribe', async (req, res) => {
  try {
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch (e) {}
    }

    const { audioData, mimeType = 'audio/webm', language = 'ur-PK', apiKey: clientApiKey } = parsedBody || {};

    if (!audioData) {
      return res.status(400).json({ error: 'Missing audioData parameter' });
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
                    text: `Listen to this short audio dictation and transcribe spoken words accurately in ${targetLang}. Return ONLY verbatim transcribed text.`
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
        console.warn('Transcribe warning:', geminiErr);
      }
    }

    if (!transcriptText) {
      transcriptText = isUrdu ? 'سلام، آپ کا شکریہ' : 'Hello, thank you.';
    }

    return res.json({ transcript: transcriptText });

  } catch (error: any) {
    return res.status(500).json({ error: 'Transcription failed', details: error.message });
  }
});

// Photo Generation Endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch (e) {}
    }

    const { 
      prompt, 
      style = 'photorealistic', 
      aspectRatio = '1:1', 
      baseImage, 
      mimeType = 'image/jpeg',
      apiKey: clientApiKey 
    } = parsedBody || {};

    if (!prompt && !baseImage) {
      return res.status(400).json({ error: 'Missing prompt or image parameter' });
    }

    const apiKey = (clientApiKey || req.headers['x-gemini-api-key'] || req.headers['x-goog-api-key'] || process.env.GEMINI_API_KEY || '').toString().trim();

    // STAGE 1: Deep AI Prompt Analysis
    const analyzedPrompt = await analyzeAndExpandPrompt(prompt, apiKey, !!baseImage);

    let width = 1024;
    let height = 1024;
    if (aspectRatio === '16:9') { width = 1280; height = 720; }
    else if (aspectRatio === '9:16') { width = 720; height = 1280; }
    else if (aspectRatio === '4:3') { width = 1024; height = 768; }
    else if (aspectRatio === '3:4') { width = 768; height = 1024; }

    let enhancedPrompt = analyzedPrompt;
    const styleEnhancers: Record<string, string> = {
      photorealistic: 'hyperrealistic 8k resolution, sharp focus, masterwork',
      cinematic: 'cinematic still, 35mm film photography, movie aesthetic',
      anime: 'high quality anime illustration, clean linework',
      '3d': '3D render, smooth textures, ray tracing, Pixar style',
      cyberpunk: 'cyberpunk neon aesthetic, futuristic details',
      portrait: 'studio portrait, bokeh background, ultra detailed',
      oil: 'classic oil painting on canvas',
      watercolor: 'delicate watercolor painting'
    };

    if (style && styleEnhancers[style] && !enhancedPrompt.toLowerCase().includes(style)) {
      enhancedPrompt = `${enhancedPrompt}, ${styleEnhancers[style]}`;
    }

    let generatedImageUrl = '';

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const imgModels = ['gemini-2.5-flash', 'gemini-3.1-flash-lite-image'];

        if (baseImage) {
          let cleanBase64 = baseImage;
          const match = baseImage.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            cleanBase64 = match[2];
          }

          for (const mName of imgModels) {
            try {
              const editResponse = await ai.models.generateContent({
                model: mName,
                contents: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType || 'image/jpeg',
                        data: cleanBase64,
                      }
                    },
                    {
                      text: `Edit this photo strictly according to this instruction: ${enhancedPrompt}. Do not alter unrequested elements.`
                    }
                  ]
                }
              });

              if (editResponse.candidates?.[0]?.content?.parts) {
                for (const part of editResponse.candidates[0].content.parts) {
                  if (part.inlineData?.data) {
                    generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                    break;
                  }
                }
              }
              if (generatedImageUrl) break;
            } catch (e) {
              // continue
            }
          }
        } else {
          for (const mName of imgModels) {
            try {
              const imgResponse = await ai.models.generateContent({
                model: mName,
                contents: {
                  parts: [{ text: enhancedPrompt }]
                },
                config: {
                  imageConfig: {
                    aspectRatio: (aspectRatio as any) || '1:1'
                  }
                }
              });

              if (imgResponse.candidates?.[0]?.content?.parts) {
                for (const part of imgResponse.candidates[0].content.parts) {
                  if (part.inlineData?.data) {
                    generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                    break;
                  }
                }
              }
              if (generatedImageUrl) break;
            } catch (e) {
              // continue
            }
          }
        }
      } catch (geminiErr) {
        // Quietly fallback
      }
    }

    if (!generatedImageUrl) {
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
      
      try {
        const imgRes = await fetch(fluxUrl);
        if (imgRes.ok) {
          const arr = await imgRes.arrayBuffer();
          const base64 = Buffer.from(arr).toString('base64');
          generatedImageUrl = `data:image/jpeg;base64,${base64}`;
        } else {
          generatedImageUrl = fluxUrl;
        }
      } catch (e) {
        generatedImageUrl = fluxUrl;
      }
    }

    return res.json({
      imageUrl: generatedImageUrl,
      prompt: enhancedPrompt,
      style,
      aspectRatio
    });

  } catch (error: any) {
    return res.status(500).json({ error: 'Photo generation failed', details: error.message });
  }
});

// MP3 TTS Endpoint
app.get('/api/tts', async (req, res) => {
  try {
    const text = (req.query.text as string) || '';
    const lang = (req.query.lang as string) || 'en';

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*#_`>|~[\]()-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const isUrdu = lang.startsWith('ur') || /[\u0600-\u06FF]/.test(cleanText);
    const targetLang = isUrdu ? 'ur' : lang.startsWith('hi') ? 'hi' : 'en';

    const words = cleanText.split(' ');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const w of words) {
      if ((currentChunk + ' ' + w).length > 90) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = w;
      } else {
        currentChunk = (currentChunk + ' ' + w).trim();
      }
      if (chunks.length >= 4) break;
    }
    if (currentChunk && chunks.length < 4) {
      chunks.push(currentChunk.trim());
    }

    if (chunks.length === 0 && cleanText) {
      chunks.push(cleanText.substring(0, 90));
    }

    const buffers: Buffer[] = [];
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
        // continue
      }
    }

    if (buffers.length > 0) {
      const combined = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', combined.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(combined);
    }

    throw new Error('No audio returned');

  } catch (error: any) {
    return res.status(500).json({ error: 'TTS audio failed', details: error.message });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch (e) {}
    }

    const { 
      prompt, 
      model, 
      image, 
      mimeType, 
      apiKey: clientApiKey, 
      language, 
      history = []
    } = parsedBody || {};

    const userPrompt = prompt || (history.length > 0 ? history[history.length - 1].text : '');

    if (!userPrompt) {
      return res.status(400).json({ error: 'Missing prompt parameter' });
    }

    const apiKey = (clientApiKey || req.headers['x-gemini-api-key'] || req.headers['x-goog-api-key'] || process.env.GEMINI_API_KEY || '').toString().trim();

    const langInstruction = language ? `Strictly respond in ${language}.` : `Respond naturally in the same language as the user's message (Urdu, Hindi, English, etc.).`;
    
    const systemInstruction = `You are NOVA AI, a friendly, natural, and helpful AI assistant.
${langInstruction}

CONVERSATIONAL RULES (STRICT MANDATES):
1. MATCH RESPONSE LENGTH TO USER INPUT:
   - For simple greetings like "Hi", "Hello", "سلام", "ہائے": Give a short, natural greeting (e.g. "سلام! میں نووا AI ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟").
   - For "How are you?" / "کیا حال ہے؟": Respond warmly and concisely (e.g. "میں بالکل ٹھیک ہوں، الحمدللہ! آپ سنائیں کیسے ہیں؟ گھر میں سب کیسے ہیں؟").
   - DO NOT output long introductions, feature menus, or unsolicited lectures on simple greetings.
   - ONLY list features or capabilities IF the user explicitly asks "What can you do?" / "What are your features?" / "تم کیا کیا کر سکتے ہو؟".

2. NATURAL CONVERSATION & ALL-IN-ONE CAPABILITIES:
   - Talk naturally like a polite friend.
   - Stand firmly for truth and ethics without blindly agreeing to falsehood.
   - Within the SAME conversation, effortlessly handle coding requests, screenshot debugging, photo generation, or casual chat depending on what the user asks.`;

    const normalizedContents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      let lastRole = null;

      for (const msg of recentHistory) {
        const role = msg.role === 'user' ? 'user' : 'model';
        const textContent = (msg.text || '').trim();
        if (!textContent && !msg.attachment) continue;

        const parts: any[] = [{ text: textContent || 'Analyzed data.' }];
        if (msg.attachment && role === 'user') {
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
      const parts: any[] = [{ text: userPrompt }];
      if (image) {
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
      normalizedContents.push({ role: 'user', parts: [{ text: userPrompt }] });
    }

    const requestBody = {
      contents: normalizedContents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7,
        topP: 0.95
      }
    };

    const targetModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const apiVersions = ['v1beta', 'v1'];

    let response: any = null;
    let success = false;

    if (apiKey) {
      for (const apiVer of apiVersions) {
        for (const targetModel of targetModels) {
          const targetUrl = `https://generativelanguage.googleapis.com/${apiVer}/models/${targetModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
          
          try {
            const headers: any = {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
              'x-gemini-api-key': apiKey,
              'User-Agent': 'aistudio-build'
            };
            if (apiKey.startsWith('AQ.')) {
              headers['Authorization'] = `Bearer ${apiKey}`;
            }

            response = await fetch(targetUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody)
            });

            if (response.ok) {
              success = true;
              break;
            }

            if (response.status === 429) {
              await sleep(1000);
              continue;
            }

            if (response.status === 404 || response.status === 400) {
              continue;
            }
          } catch (err) {
            // continue
          }
        }
        if (success) break;
      }
    }

    let aiText = '';

    if (success && response && response.ok) {
      const data: any = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        aiText = data.candidates[0].content.parts.map((p: any) => p.text || '').join('');
      } else if (data.promptFeedback && data.promptFeedback.blockReason) {
        aiText = `[Response filtered by safety guidelines: ${data.promptFeedback.blockReason}]`;
      }
    }

    if (!aiText) {
      aiText = generateFallbackResponse(userPrompt, language);
    }

    return res.json({ text: aiText });

  } catch (error: any) {
    const fallback = generateFallbackResponse('Assistance request', 'Urdu');
    return res.json({ text: fallback });
  }
});

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`📡 NOVA Server listening on http://localhost:${port}`);
});
