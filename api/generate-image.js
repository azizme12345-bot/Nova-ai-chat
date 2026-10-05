/**
 * NOVA AI - Advanced Photo Generator & Intelligent Photo Editor API
 * File: api/generate-image.js
 */
import { GoogleGenAI } from '@google/genai';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const PHOTO_EDITING_SYSTEM_PROMPT = `You are an INTELLIGENT PHOTO EDITING AI.

When a user gives you a photo and an instruction, you MUST:

1. UNDERSTAND their instruction exactly
2. ANALYZE what they want changed
3. EDIT ONLY that part
4. KEEP everything else ORIGINAL

OPERATIONS YOU CAN DO:
- Change background
- Remove object
- Change color
- Add object
- Move/reposition
- Change style
- Modify appearance
- Resize object
- Blur selectively
- Enhance image

IMPORTANT RULES:
✓ Do EXACTLY what user asks
✓ Don't make unnecessary changes
✓ Keep original quality
✓ Keep natural appearance
✓ Preserve lighting consistency
✓ Don't modify what user didn't ask for`;

function getServerApiKey() {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.API_KEY,
    process.env.VITE_GEMINI_API_KEY
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string') {
      const t = c.trim();
      if (t.length > 10 && t !== 'MY_GOOGLE_API_KEY' && t !== 'MY_GEMINI_API_KEY' && t !== 'dummy') {
        return t;
      }
    }
  }
  return '';
}

function parsePhotoEditSpec(rawPrompt) {
  const lower = (rawPrompt || '').toLowerCase();

  const colorMap = [
    { keywords: ['white', 'سفید', 'safed', 'sufaid'], name: 'white', hex: '#ffffff' },
    { keywords: ['green', 'سبز', 'hara', 'sabz'], name: 'green', hex: '#16a34a' },
    { keywords: ['blue', 'نیلا', 'neela', 'sky'], name: 'blue', hex: '#2563eb' },
    { keywords: ['red', 'سرخ', 'لال', 'laal', 'surkh'], name: 'red', hex: '#dc2626' },
    { keywords: ['black', 'کالا', 'سیاہ', 'kala', 'siyah'], name: 'black', hex: '#09090b' },
    { keywords: ['yellow', 'پیلا', 'peela', 'gold', 'سنہری'], name: 'gold/yellow', hex: '#eab308' },
    { keywords: ['purple', 'جامنی', 'violet', 'magenta'], name: 'purple', hex: '#7c3aed' },
    { keywords: ['pink', 'گلابی', 'gulabi'], name: 'pink', hex: '#ec4899' },
    { keywords: ['gray', 'grey', 'گرے', 'سرمئی'], name: 'gray', hex: '#64748b' },
    { keywords: ['orange', 'نارنجی'], name: 'orange', hex: '#ea580c' },
  ];

  let detectedColor = { name: 'white', hex: '#ffffff', matched: false };
  for (const c of colorMap) {
    if (c.keywords.some(k => lower.includes(k))) {
      detectedColor = { name: c.name, hex: c.hex, matched: true };
      break;
    }
  }

  const isBgChange =
    lower.includes('background') ||
    lower.includes('بیک گراؤنڈ') ||
    lower.includes('پس منظر') ||
    lower.includes('bg ') ||
    (detectedColor.matched && (lower.includes('تبدیل') || lower.includes('change') || lower.includes('کر دو') || lower.includes('کرو')));

  const isBlur = lower.includes('blur') || lower.includes('دھندلا') || lower.includes('bokeh');
  const isRemove = lower.includes('remove') || lower.includes('ہٹا') || lower.includes('delete') || lower.includes('erase');
  const isEnhance = lower.includes('enhance') || lower.includes('hd') || lower.includes('صاف') || lower.includes('sharpen') || lower.includes('quality');

  let operation = 'custom_edit';
  let steps = [];

  if (isBgChange) {
    operation = 'change_background';
    steps = [
      '✓ Analyzing photo...',
      '✓ Detecting background...',
      '✓ Keeping person original...',
      `✓ Changing only background to ${detectedColor.name}...`,
      '✓ Result: [edited photo]'
    ];
  } else if (isBlur) {
    operation = 'blur_background';
    steps = [
      '✓ Analyzing photo...',
      '✓ Detecting main subject & depth...',
      '✓ Keeping subject sharp and original...',
      '✓ Applying selective background blur...',
      '✓ Result: [edited photo]'
    ];
  } else if (isRemove) {
    operation = 'remove_object';
    steps = [
      '✓ Analyzing photo...',
      '✓ Detecting target object to remove...',
      '✓ Keeping surrounding area & subject original...',
      '✓ Removing only requested object...',
      '✓ Result: [edited photo]'
    ];
  } else if (isEnhance) {
    operation = 'enhance';
    steps = [
      '✓ Analyzing photo...',
      '✓ Detecting lighting & detail levels...',
      '✓ Keeping original appearance & composition...',
      '✓ Enhancing clarity, contrast, and sharpness...',
      '✓ Result: [edited photo]'
    ];
  } else {
    steps = [
      '✓ Analyzing photo...',
      `✓ Understanding instruction: "${rawPrompt}"...`,
      '✓ Keeping unrequested areas 100% original...',
      '✓ Editing only the requested part...',
      '✓ Result: [edited photo]'
    ];
  }

  return {
    operation,
    targetColorName: detectedColor.name,
    targetColorHex: detectedColor.hex,
    steps
  };
}

async function analyzeAndExpandPrompt(rawPrompt, apiKey, isEditing = false) {
  if (!rawPrompt) return 'High resolution masterwork artwork';
  if (!apiKey) return rawPrompt;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const analysisInstruction = isEditing
      ? `${PHOTO_EDITING_SYSTEM_PROMPT}\n\nTranslate the user's photo editing instruction into a crystal-clear, precise English instruction for the image editing model. Specify ONLY the exact change requested while keeping the person/subject and everything else 100% original.`
      : `You are a World-Class AI Image Prompt Architect.
Analyze the user's request deeply to understand the EXACT subject, language, text, and scene they want:
- If the user requests an Islamic / Quranic calligraphic design, generate a pristine masterwork Islamic calligraphy art prompt with sacred Arabic typography and gold accents matching their exact request.
- If the user requests any other subject, generate a detailed, high-resolution masterwork prompt in English that precisely matches the user's prompt without changing their intended subject.
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

    const isEditing = !!baseImage;
    const editSpec = isEditing ? parsePhotoEditSpec(prompt || '') : null;

    const apiKey = getServerApiKey();
    const analyzedPrompt = await analyzeAndExpandPrompt(prompt, apiKey, isEditing);

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

    if (!isEditing && style && styleEnhancers[style] && !enhancedPrompt.toLowerCase().includes(style)) {
      enhancedPrompt = `${enhancedPrompt}, ${styleEnhancers[style]}`;
    }

    let generatedImageUrl = '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const imgModels = [
          'gemini-2.5-flash-image',
          'gemini-3.1-flash-image-preview',
          'gemini-3.1-flash-image',
          'gemini-3.1-flash-lite-image'
        ];

        if (baseImage) {
          let cleanBase64 = baseImage;
          const match = baseImage.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            cleanBase64 = match[2];
          }

          const strictEditPrompt = `${PHOTO_EDITING_SYSTEM_PROMPT}\n\nUser Instruction: ${prompt}\nRefined Task: ${enhancedPrompt}\nNow analyze the photo and edit it precisely according to the instruction. Edit ONLY what the user asked for and keep the person/subject and everything else 100% original.`;

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
                      text: strictEditPrompt
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

    if (isEditing && !generatedImageUrl) {
      res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({
        imageUrl: baseImage,
        useClientSmartEdit: true,
        editSpec,
        steps: editSpec?.steps || [],
        prompt: enhancedPrompt
      }));
      return;
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
      editSpec,
      steps: editSpec?.steps || [],
      prompt: enhancedPrompt,
      style,
      aspectRatio
    }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'Photo generation failed', details: error.message }));
  }
}
