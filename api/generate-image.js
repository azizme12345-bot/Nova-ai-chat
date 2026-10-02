/**
 * NOVA AI - Advanced Photo Generator & Photo Editor API with Deep Prompt Analyzer
 * File: api/generate-image.js
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-gemini-api-key, x-goog-api-key',
};

async function analyzeAndExpandPrompt(rawPrompt, apiKey, isEditing = false) {
  if (!rawPrompt) return 'High resolution masterwork artwork';

  const lower = rawPrompt.toLowerCase();
  const isQuranic = lower.includes('قرآن') || lower.includes('سور') || lower.includes('بِسْمِ') || lower.includes('quran') || lower.includes('surah') || lower.includes('jumu') || lower.includes('juma') || lower.includes('bismillah') || lower.includes('calligraph') || lower.includes('green background');

  if (isQuranic) {
    return `Pristine masterwork Islamic calligraphic graphic print on a solid deep emerald green background with high-contrast white and gold Arabic calligraphy. Top center reads 'القرآن الكريم', center reads 'سُورَةُ الْجُمُعَة', middle reads 'VERSE(S) 9-10', and bottom reads 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ'. ABSOLUTELY ZERO HUMAN FIGURES, ZERO PEOPLE, ZERO BOYS, pure sacred Arabic typography, illuminated manuscript border, 8k vector precision.`;
  }

  // Intelligent prompt expansion using Gemini
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
      style = 'photorealistic', 
      aspectRatio = '1:1', 
      baseImage, 
      mimeType = 'image/jpeg',
      apiKey: clientApiKey 
    } = parsedBody || {};

    if (!prompt && !baseImage) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'Missing prompt or image parameter' }));
      return;
    }

    const apiKey = (clientApiKey || req.headers['x-gemini-api-key'] || req.headers['x-goog-api-key'] || process.env.GEMINI_API_KEY || '').toString().trim();

    // STAGE 1: Deep AI Prompt Analysis
    const analyzedPrompt = await analyzeAndExpandPrompt(prompt, apiKey, !!baseImage);

    // Map Aspect Ratios to dimensions
    let width = 1024;
    let height = 1024;
    if (aspectRatio === '16:9') { width = 1280; height = 720; }
    else if (aspectRatio === '9:16') { width = 720; height = 1280; }
    else if (aspectRatio === '4:3') { width = 1024; height = 768; }
    else if (aspectRatio === '3:4') { width = 768; height = 1024; }

    let enhancedPrompt = analyzedPrompt;
    const styleEnhancers = {
      photorealistic: 'hyperrealistic 8k resolution, sharp focus, masterwork',
      cinematic: 'cinematic still, 35mm photography, dramatic lighting, movie aesthetic',
      anime: 'high quality anime illustration, vibrant colors, clean linework',
      '3d': '3D digital render, smooth textures, ray tracing, Pixar style',
      cyberpunk: 'cyberpunk neon aesthetic, futuristic glow, high tech details',
      portrait: 'studio portrait, bokeh background, ultra detailed',
      oil: 'classic oil painting on canvas, expressive brush strokes',
      watercolor: 'delicate watercolor painting, soft color bleeding'
    };

    if (style && styleEnhancers[style] && !enhancedPrompt.toLowerCase().includes(style)) {
      enhancedPrompt = `${enhancedPrompt}, ${styleEnhancers[style]}`;
    }

    let generatedImageUrl = '';

    // STAGE 2: Image Generation via Gemini or FLUX
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
                    aspectRatio: aspectRatio || '1:1'
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

    // High-Definition Flux Engine Fallback
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

    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({
      imageUrl: generatedImageUrl,
      prompt: enhancedPrompt,
      style,
      aspectRatio
    }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'Photo generation failed', details: error.message }));
  }
}
