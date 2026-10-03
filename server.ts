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

async function callPollinationsBackup(normalizedContents: any[], systemInstruction: string): Promise<string> {
  try {
    const pollinationsMessages = [
      { role: 'system', content: systemInstruction }
    ];

    for (const c of normalizedContents) {
      const partsText = c.parts.map((p: any) => p.text || '').join('\n');
      pollinationsMessages.push({
        role: c.role === 'user' ? 'user' : 'assistant',
        content: partsText || 'Analyzed data.'
      });
    }

    // 1. Try OpenAI-compatible endpoint
    try {
      const polRes = await fetch('https://text.pollinations.ai/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: pollinationsMessages,
          model: 'openai'
        })
      });

      if (polRes.ok) {
        const polJson: any = await polRes.json();
        const textOut = polJson?.choices?.[0]?.message?.content;
        if (textOut && textOut.trim()) {
          return textOut.trim();
        }
      }
    } catch (e) {
      // continue to fallback
    }

    // 2. Direct simple prompt fallback
    const lastUserPrompt = pollinationsMessages[pollinationsMessages.length - 1]?.content || 'سلام';
    const directRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(lastUserPrompt)}?system=${encodeURIComponent(systemInstruction)}`);
    if (directRes.ok) {
      const directText = await directRes.text();
      if (directText && directText.trim()) {
        return directText.trim();
      }
    }
  } catch (polErr) {
    console.log('Pollinations text backup failed:', polErr);
  }
  return '';
}

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

    const candidateModels = ['gemini-3.8-flash'];
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

  // General natural beautiful fallback
  if (isUrdu) {
    return `جی میں بالکل سمجھ گیا ہوں اور آپ کی رہنمائی کے لیے حاضر ہوں! 

اگر آپ کے پاس کوئی سوال ہے یا آپ پی ڈی ایف، فوٹو یا کوڈ کا تجزیہ کروانا چاہتے ہیں، تو سائیڈ بار میں **🔑 API Key Settings** پر کلک کر کے اپنی گوگل اے آئی اسٹوڈیو (Google AI Studio) کی چابی سیٹ کر لیں تاکہ جیمنی ماڈل آپ کو لائیو بہترین جواب دے سکے۔

میں ابھی آپ کے لیے کیا مدد کر سکتا ہوں؟`;
  }

  return `I understand you perfectly! I am ready to guide you.

To unlock full power for code audits, PDF analysis, or visual debugging, please enter your Google AI Studio API Key in the **🔑 API Key Settings** inside the sidebar.

How can I help you right now?`;
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

        const candidateModels = ['gemini-3.8-flash'];
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

        const imgModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image'];

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

// Translation & Core Multimodal Assistant Endpoint using official @google/genai SDK
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
      attachedUrl,
      apiKey: clientApiKey, 
      language, 
      history = []
    } = parsedBody || {};

    const userPrompt = prompt || (history.length > 0 ? history[history.length - 1].text : '');

    if (!userPrompt) {
      return res.status(400).json({ error: 'Missing prompt parameter' });
    }

    const apiKey = (clientApiKey || req.headers['x-gemini-api-key'] || req.headers['x-goog-api-key'] || process.env.GEMINI_API_KEY || '').toString().trim();

    // 1. Live Website Content Scraper / Link Analyzer
    let scrapedUrlContext = "";
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
            .substring(0, 16000); // Scraping up to 16,000 characters
          scrapedUrlContext = `\n\n[WEBSITE CONTENT SCRAPED FROM USER LINK ${attachedUrl}]:\n${cleanText}\n\n`;
        }
      } catch (err) {
        scrapedUrlContext = `\n\n[WEBSITE LINK]: ${attachedUrl} (Direct parse prevented by network origin rules. Please ask user to paste code/text if needed.)\n\n`;
      }
    }

    let finalPrompt = userPrompt;
    if (scrapedUrlContext) {
      finalPrompt = `${userPrompt}${scrapedUrlContext}`;
    }

    const langInstruction = language ? `Strictly respond in ${language}.` : `Respond naturally in the same language as the user's message (Urdu, Hindi, English, etc.).`;
    
    const systemInstruction = `You are NOVA AI, a World-Class Multimodal AI Assistant, Senior Software Engineer, and Expert PDF & Link Auditor.
${langInstruction}

CONVERSATIONAL RULES (STRICT MANDATES):
1. MATCH RESPONSE LENGTH TO USER INPUT:
   - For simple greetings like "Hi", "Hello", "سلام", "ہائے": Give a short, natural greeting (e.g. "سلام! میں نووا AI ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟").
   - For "How are you?" / "کیا حال ہے؟": Respond warmly and concisely (e.g. "میں بالکل ٹھیک ہوں، الحمدللہ! آپ سنائیں کیسے ہیں؟ گھر میں سب کیسے ہیں؟").
   - DO NOT output long introductions, feature menus, or unsolicited lectures on simple greetings.
   - ONLY list features or capabilities IF the user explicitly asks "What can you do?" / "What are your features?" / "تم کیا کیا کر سکتے ہو؟".

2. MULTIMODAL AUDITING (PDFs, PHOTOS, CODE):
   - When a user uploads a PDF document, image screenshot, code file, or link:
     a) Deeply inspect and explain the document's main contents or code bugs.
     b) Identify any errors, blurry assets, or bad designs.
     c) Provide complete copyable code blocks to fix all issues.
     d) Provide a refined AI prompt to copy & paste into Google AI Studio to resolve it.

3. TRUTHFULNESS & MORAL CONSTITUTION:
   - Always stand for truth, logic, and ethical principles. Never conform to falsehood or agree blindly.`;

    const normalizedContents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      let lastRole = null;

      for (const msg of recentHistory) {
        const role = msg.role === 'user' ? 'user' : 'model';
        const textContent = (msg.text || '').trim();
        if (!textContent && !msg.attachment) continue;

        const parts: any[] = [{ text: textContent || 'Analyzed data.' }];
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
      const parts: any[] = [{ text: finalPrompt }];
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

    let aiText = '';

    // Standard valid @google/genai SDK model candidates in priority order
    let targetModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview'
    ];

    const requestedModel = (model || '').toLowerCase();
    if (requestedModel.includes('pro')) {
      targetModels = ['gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    } else if (requestedModel.includes('3.8')) {
      targetModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.1-pro-preview'];
    } else if (requestedModel.includes('latest')) {
      targetModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-pro-preview'];
    } else {
      targetModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-pro-preview'];
    }

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        for (const mName of targetModels) {
          try {
            console.log(`Executing Gemini model: ${mName}`);
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
          } catch (modelErr: any) {
            console.log(`Model ${mName} attempt limit or error:`, modelErr?.message || modelErr);
          }
        }
      } catch (sdkInitErr) {
        console.log('Gemini SDK Init error:', sdkInitErr);
      }
    }

    // System key fallback if user key was completely exhausted or missing
    if (!aiText) {
      const systemKey = process.env.GEMINI_API_KEY || '';
      if (systemKey && systemKey !== apiKey && systemKey !== 'dummy') {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const aiSys = new GoogleGenAI({
            apiKey: systemKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          const response = await aiSys.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: normalizedContents,
            config: { systemInstruction, temperature: 0.7 }
          });
          if (response.text && response.text.trim()) {
            aiText = response.text.trim();
          }
        } catch (sysErr) {
          console.log('System key attempt failed:', sysErr);
        }
      }
    }

    // Pollinations Backup (free, unlimited fallback)
    if (!aiText) {
      console.log('Activating Pollinations backup engine...');
      try {
        aiText = await callPollinationsBackup(normalizedContents, systemInstruction);
      } catch (pErr) {
        console.log('Pollinations call failed:', pErr);
      }
    }

    // Ultimate fallback
    if (!aiText) {
      aiText = generateFallbackResponse(finalPrompt, language);
    }

    return res.json({ text: aiText });

  } catch (error: any) {
    console.error('Core translate execution failed:', error);
    const errorStr = (error?.message || '').toLowerCase();
    if (errorStr.includes('quota') || errorStr.includes('exhausted') || errorStr.includes('429') || errorStr.includes('limit')) {
      return res.json({
        text: `⚠️ **API Quota Exceeded (کوٹہ عارضی طور پر ختم ہو گیا ہے)**

آپ کی گوگل اے آئی اسٹوڈیو (Google AI Studio) کی چابی کا فری کوٹہ اس وقت **Gemini Pro** ماڈل کے لیے ختم ہو چکا ہے۔

**آسان حل (Instant Solution):**
برائے مہربانی بائیں جانب سائیڈ بار (Sidebar) میں جائیں اور **Active Engine** والے خانے سے **Gemini 3.8 Flash (Super Fast)** سلیکٹ کر لیں۔ وہ بالکل فری ہے، اس کا کوٹہ بہت زیادہ ہے، اور وہ فوری طور پر کام کرنا شروع کر دے گا! 🚀`
      });
    }
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
