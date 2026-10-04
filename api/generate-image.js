/**
 * NOVA AI - Advanced Photo Generator & Photo Editor API
 * File: api/generate-image.js
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

async function analyzeAndExpandPrompt(rawPrompt, apiKey, isEditing = false) {
  if (!rawPrompt) return 'High resolution masterwork artwork';
  if (!apiKey) return rawPrompt;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const analysisInstruction = `You are a World-Class AI Image Prompt Architect.
Analyze the user's request deeply to understand the EXACT subject, language, text, and scene they want:
- If the user requests an Islamic / Quranic calligraphic design, generate a pristine masterwork Islamic calligraphy art prompt with sacred Arabic typography and gold accents matching their exact request.
- If the user requests any other subject (landscape, animal, car, portrait, fantasy, logo), generate a detailed, high-resolution masterwork prompt in English that precisely matches the user's prompt without changing their intended subject.
- If editing (${isEditing ? 'YES' : 'NO'}), modify ONLY what the user requested.
- Return ONLY the refined, detailed masterwork image generation prompt in English.`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
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
      mimeType = 'image/jpeg'
    } = parsedBody || {};

    if (!prompt && !baseImage) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'Missing prompt or image parameter' }));
      return;
    }

    const apiKey = getServerApiKey();
    const analyzedPrompt = await analyzeAndExpandPrompt(prompt, apiKey, !!baseImage);

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

    if (apiKey) {
      try {
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
        // fallback
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
