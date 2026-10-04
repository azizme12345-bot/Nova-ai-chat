import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

function getServerApiKey(): string {
  const key = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  if (key === 'MY_GOOGLE_API_KEY' || key === 'MY_GEMINI_API_KEY' || key === 'dummy') {
    return '';
  }
  return key;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getServerApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ============================================================================
// CORE SYSTEM PROMPTS FOR INTELLIGENT VIDEO & PHOTO EDITING AI
// ============================================================================

const FONT_VIDEO_SYSTEM_PROMPT = `You are an INTELLIGENT FONT-AWARE VIDEO GENERATION AI.

When a user gives you a font/typography style and text, you MUST:

1. ANALYZE the font:
   - Style (serif, sans-serif, script)
   - Weight (light, regular, bold)
   - Mood (formal, playful, elegant)
   - Colors and properties

2. EXTRACT characteristics:
   - Visual style
   - Animation style
   - Effects needed
   - Motion type

3. GENERATE VIDEO matching:
   - Font exact style
   - Animation from mood
   - Effects from properties
   - Motion from weight
   - Background from colors

4. OUTPUT:
   - Video exactly matching font style
   - Professional quality
   - No generic defaults`;

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

function parsePhotoEditSpec(rawPrompt: string) {
  const lower = (rawPrompt || '').toLowerCase();

  // Detect target color in English, Urdu, and Roman Urdu
  const colorMap: Array<{ keywords: string[]; name: string; hex: string }> = [
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
  let steps: string[] = [];

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

export function parseFontVideoSpec(rawPrompt: string) {
  const text = rawPrompt || '';
  const lower = text.toLowerCase();

  // Extract explicit Text: "..." or quoted string
  let displayText = 'Professional Design';
  const textFieldMatch = text.match(/text\s*:\s*["'“”]?([^"\n”]+)["'“”]?/i);
  const quotedMatch = text.match(/["“]([^"”]+)["”]/);
  if (textFieldMatch && textFieldMatch[1].trim()) {
    displayText = textFieldMatch[1].trim();
  } else if (quotedMatch && quotedMatch[1].trim()) {
    displayText = quotedMatch[1].trim();
  } else {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      displayText = lines[lines.length - 1].replace(/^text\s*:\s*/i, '').replace(/^["']|["']$/g, '');
    } else if (text.length < 40) {
      displayText = text.trim();
    }
  }

  // Font family & category detection
  let fontFamily = 'Georgia, "Times New Roman", serif';
  let fontName = 'Georgia';
  let fontCategory = 'Serif';

  if (lower.includes('georgia')) {
    fontFamily = 'Georgia, "Times New Roman", serif';
    fontName = 'Georgia';
    fontCategory = 'Serif';
  } else if (lower.includes('times') || lower.includes('playfair') || lower.includes('garamond') || lower.includes('serif') && !lower.includes('sans')) {
    fontFamily = '"Playfair Display", Georgia, "Times New Roman", serif';
    fontName = lower.includes('playfair') ? 'Playfair Display' : 'Classic Serif';
    fontCategory = 'Serif';
  } else if (lower.includes('script') || lower.includes('cursive') || lower.includes('calligraph') || lower.includes('handwrit')) {
    fontFamily = '"Brush Script MT", "Comic Sans MS", cursive';
    fontName = 'Elegance Script';
    fontCategory = 'Script';
  } else if (lower.includes('mono') || lower.includes('courier') || lower.includes('code')) {
    fontFamily = '"Courier New", Courier, monospace';
    fontName = 'Courier Monospace';
    fontCategory = 'Monospace';
  } else if (lower.includes('montserrat') || lower.includes('arial') || lower.includes('helvetica') || lower.includes('inter') || lower.includes('sans')) {
    fontFamily = 'Montserrat, Inter, system-ui, -apple-system, sans-serif';
    fontName = 'Modern Sans-Serif';
    fontCategory = 'Sans-Serif';
  }

  // Weight detection
  let fontWeight = '700';
  let weightLabel = 'bold';
  if (lower.includes('light') || lower.includes('thin')) {
    fontWeight = '300';
    weightLabel = 'light';
  } else if (lower.includes('regular') || lower.includes('normal')) {
    fontWeight = '400';
    weightLabel = 'regular';
  } else if (lower.includes('black') || lower.includes('heavy') || lower.includes('extra bold')) {
    fontWeight = '900';
    weightLabel = 'extra-bold';
  }

  const fontStyle = lower.includes('italic') ? 'italic' : 'normal';

  // Mood & animation detection
  let moodLabel = 'formal, elegant';
  let animationType = 'slow-fade';
  let animationLabel = 'Slow fade-in';
  let effectsLabel = 'Soft shadow, subtle glow';
  let bgStart = '#0f172a';
  let bgEnd = '#1e1b4b';
  let textColor = '#f8fafc';
  let accentColor = '#e2e8f0';
  let glowColor = 'rgba(226, 232, 240, 0.45)';

  if (lower.includes('playful') || lower.includes('fun') || lower.includes('energetic') || lower.includes('bounce')) {
    moodLabel = 'playful, energetic';
    animationType = 'kinetic-bounce';
    animationLabel = 'Kinetic bounce & scale';
    effectsLabel = 'Vibrant drop shadow, dynamic particles';
    bgStart = '#311042';
    bgEnd = '#0f172a';
    textColor = '#ffffff';
    accentColor = '#f472b6';
    glowColor = 'rgba(244, 114, 182, 0.6)';
  } else if (lower.includes('cyber') || lower.includes('neon') || lower.includes('futuristic')) {
    moodLabel = 'futuristic, neon';
    animationType = 'shimmer-glow';
    animationLabel = 'Neon pulse & tracking reveal';
    effectsLabel = 'intense neon bloom, cyber grid';
    bgStart = '#030712';
    bgEnd = '#090d16';
    textColor = '#38bdf8';
    accentColor = '#a855f7';
    glowColor = 'rgba(56, 189, 248, 0.8)';
  } else if (lower.includes('typewriter') || fontCategory === 'Monospace') {
    moodLabel = 'technical, precise';
    animationType = 'typewriter';
    animationLabel = 'Character-by-character typewriter';
    effectsLabel = 'Crisp terminal glow, blinking cursor';
    bgStart = '#090d16';
    bgEnd = '#111827';
    textColor = '#34d399';
    accentColor = '#10b981';
    glowColor = 'rgba(52, 211, 153, 0.5)';
  } else if (lower.includes('gold') || lower.includes('luxury') || lower.includes('royal')) {
    moodLabel = 'luxury, royal, elegant';
    animationType = 'slow-fade';
    animationLabel = 'Slow cinematic fade-in & rise';
    effectsLabel = 'Golden specular glow, soft ambient particles';
    bgStart = '#0c0a09';
    bgEnd = '#1c1917';
    textColor = '#fef08a';
    accentColor = '#eab308';
    glowColor = 'rgba(234, 179, 8, 0.55)';
  } else if (lower.includes('formal') || lower.includes('elegant') || fontCategory === 'Serif') {
    moodLabel = lower.includes('formal') && lower.includes('elegant') ? 'formal, elegant' : lower.includes('formal') ? 'formal' : 'elegant';
    animationType = 'slow-fade';
    animationLabel = 'Slow fade-in';
    effectsLabel = 'Soft shadow, subtle glow';
    bgStart = '#090d1a';
    bgEnd = '#17153b';
    textColor = '#ffffff';
    accentColor = '#cbd5e1';
    glowColor = 'rgba(148, 163, 184, 0.5)';
  }

  // Color overrides if user specified colors
  if (lower.includes('white background') || lower.includes('سفید')) {
    bgStart = '#f8fafc';
    bgEnd = '#e2e8f0';
    textColor = '#0f172a';
    accentColor = '#334155';
    glowColor = 'rgba(15, 23, 42, 0.25)';
  } else if (lower.includes('green') || lower.includes('سبز')) {
    bgStart = '#052e16';
    bgEnd = '#14532d';
    textColor = '#f0fdf4';
    accentColor = '#4ade80';
    glowColor = 'rgba(74, 222, 128, 0.5)';
  }

  const steps = [
    '✓ Analyzing font...',
    `✓ Detecting: ${fontCategory}, ${weightLabel}, ${moodLabel} mood`,
    '✓ Creating video...',
    `✓ Animation: ${animationLabel}`,
    `✓ Effects: ${effectsLabel}`,
    '✓ Result: [video with perfect style matching]'
  ];

  return {
    displayText,
    fontName,
    fontFamily,
    fontCategory,
    fontWeight,
    fontStyle,
    weightLabel,
    moodLabel,
    animationType,
    animationLabel,
    effectsLabel,
    bgStart,
    bgEnd,
    textColor,
    accentColor,
    glowColor,
    steps
  };
}

async function analyzeAndExpandPrompt(rawPrompt: string, isEditing: boolean = false): Promise<string> {
  if (!rawPrompt) return 'High resolution masterwork artwork';

  try {
    const ai = getGeminiClient();
    if (!ai) return rawPrompt;

    const analysisInstruction = isEditing
      ? `${PHOTO_EDITING_SYSTEM_PROMPT}\n\nTranslate the user's photo editing instruction (which may be in Urdu, Hindi, or English) into a crystal-clear, precise English instruction for the image editing model. Specify ONLY the exact change requested (e.g., "Change ONLY the background to solid pure white (#FFFFFF). Keep the person/subject, face, clothing, lighting, and proportions 100% original and untouched."). Return ONLY the instruction.`
      : `You are a World-Class AI Image Prompt Architect.
Analyze the user's request deeply to understand the EXACT subject, language, text, and scene they want:
- If the user requests an Islamic / Quranic calligraphic design, generate a pristine masterwork Islamic calligraphy art prompt with sacred Arabic typography and gold accents matching their exact request.
- If the user requests any other subject (landscape, animal, car, portrait, fantasy, logo, object), generate a detailed, high-resolution masterwork prompt in English that precisely matches the user's prompt without changing their intended subject.
- Return ONLY the refined, detailed masterwork image generation prompt in English.`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [{ text: `User Instruction: ${rawPrompt}` }] },
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
    // Fallback to rawPrompt
  }

  return rawPrompt;
}

function generateFallbackResponse(prompt: string, language?: string): string {
  const lower = prompt.toLowerCase().trim();
  const isUrdu = (language && language.toLowerCase().includes('urdu')) || /[\u0600-\u06FF]/.test(prompt);

  if (lower === 'hi' || lower === 'hello' || lower === 'سلام' || lower === 'ہائے' || lower === 'سلام علیکم' || lower === 'assalam o alaikum') {
    return isUrdu 
      ? 'سلام! میں نووا AI ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟'
      : 'Hello! I am NOVA AI. How can I help you today?';
  }

  if (lower.includes('how are you') || lower.includes('kya hal hai') || lower.includes('کیسے ہو') || lower.includes('کیا حال ہے')) {
    return isUrdu
      ? 'میں بالکل ٹھیک ہوں، الحمدللہ! آپ بتائیں کیسے ہیں؟ میں آج آپ کی کیا مدد کر سکتا ہوں؟'
      : 'I am doing great, thank you! How can I assist you today?';
  }

  if (lower.includes('what can you do') || lower.includes('features') || lower.includes('کیا کیا کر سکتے ہو') || lower.includes('فیچرز')) {
    return isUrdu
      ? `میں NOVA AI ہوں! میں آپ کے ساتھ قدرتی انداز میں بات چیت کر سکتا ہوں، آپ کی اپلوڈ کردہ تصاویر ایڈٹ کر سکتا ہوں (جیسے بیک گراؤنڈ تبدیل کرنا)، فونٹ اسٹائل کے مطابق ویڈیو بنا سکتا ہوں، اور کوڈ لکھ سکتا ہوں۔`
      : `I am NOVA AI! I can chat naturally, edit photos precisely according to your instructions, generate font-aware typography videos, write code, and generate artwork.`;
  }

  if (isUrdu) {
    return `جی میں آپ کی بات سمجھ گیا ہوں۔ سرور پر اس وقت \`GOOGLE_API_KEY\` یا \`GEMINI_API_KEY\` انوائرمنٹ ویری ایبل سیٹ نہیں ہے یا کوٹہ ختم ہو چکا ہے۔ براہ کرم سرور کے Environment Variables میں اپنی کی (Key) چیک کریں۔`;
  }

  return `I received your message, but the server environment variable \`GOOGLE_API_KEY\` (or \`GEMINI_API_KEY\`) is not configured or has reached its quota limit. Please check your server environment variables.`;
}

// Font-Aware Video Generation Specification Endpoint
app.post('/api/video-style', async (req: Request, res: Response) => {
  try {
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch (e) {}
    }

    const { prompt = '' } = parsedBody || {};
    const baseSpec = parseFontVideoSpec(prompt);

    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                text: `Font/Style Analysis:\n${prompt}\n\nNow analyze this font/typography style and return a JSON object with keys: displayText, fontName, fontCategory (Serif | Sans-Serif | Script | Monospace), weightLabel (light | regular | bold), moodLabel, animationType (slow-fade | kinetic-bounce | typewriter | shimmer-glow), animationLabel, effectsLabel, bgStart (hex color), bgEnd (hex color), textColor (hex color), accentColor (hex color). Return ONLY valid JSON.`
              }
            ]
          },
          config: {
            systemInstruction: FONT_VIDEO_SYSTEM_PROMPT,
            temperature: 0.2
          }
        });

        const rawJson = (response.text || '').replace(/```json|```/g, '').trim();
        const parsedAi = JSON.parse(rawJson);
        if (parsedAi && parsedAi.displayText) {
          Object.assign(baseSpec, parsedAi);
          baseSpec.steps = [
            '✓ Analyzing font...',
            `✓ Detecting: ${baseSpec.fontCategory}, ${baseSpec.weightLabel}, ${baseSpec.moodLabel} mood`,
            '✓ Creating video...',
            `✓ Animation: ${baseSpec.animationLabel}`,
            `✓ Effects: ${baseSpec.effectsLabel}`,
            '✓ Result: [video with perfect style matching]'
          ];
        }
      } catch (e) {
        // Use deterministic baseSpec
      }
    }

    return res.json(baseSpec);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Video analysis failed' });
  }
});

// Voice Transcription Endpoint
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch (e) {}
    }

    const { audioData, mimeType = 'audio/webm', language = 'ur-PK' } = parsedBody || {};

    if (!audioData) {
      return res.status(400).json({ error: 'Missing audioData parameter' });
    }

    let cleanBase64 = audioData;
    const match = audioData.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      cleanBase64 = match[2];
    }

    const isUrdu = language.startsWith('ur');
    const targetLang = isUrdu ? 'Urdu' : language.startsWith('hi') ? 'Hindi' : language.startsWith('ar') ? 'Arabic' : 'English';

    let transcriptText = '';

    const ai = getGeminiClient();
    if (ai) {
      const candidateModels = ['gemini-3.5-transcribe', 'gemini-3.8-flash'];
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
                  text: `Transcribe this spoken audio accurately in ${targetLang}. Return ONLY the transcribed text without any extra commentary.`
                }
              ]
            }
          });

          if (response.text && response.text.trim()) {
            transcriptText = response.text.trim();
            break;
          }
        } catch (mErr) {
          console.warn(`Transcribe model ${mName} failed:`, mErr);
        }
      }
    }

    if (!transcriptText) {
      return res.status(500).json({ error: 'Voice transcription could not be completed. Please verify GOOGLE_API_KEY on the server.' });
    }

    return res.json({ transcript: transcriptText });

  } catch (error: any) {
    return res.status(500).json({ error: 'Transcription failed', details: error.message });
  }
});

// Photo Generation & Intelligent Photo Editing Endpoint
app.post('/api/generate-image', async (req: Request, res: Response) => {
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
      return res.status(400).json({ error: 'Missing prompt or image parameter' });
    }

    const isEditing = !!baseImage;
    const editSpec = isEditing ? parsePhotoEditSpec(prompt || '') : null;

    // STAGE 1: Deep AI Prompt Analysis
    const analyzedPrompt = await analyzeAndExpandPrompt(prompt, isEditing);

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

    if (!isEditing && style && styleEnhancers[style] && !enhancedPrompt.toLowerCase().includes(style)) {
      enhancedPrompt = `${enhancedPrompt}, ${styleEnhancers[style]}`;
    }

    let generatedImageUrl = '';

    const ai = getGeminiClient();
    if (ai) {
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
            // continue to next image model
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
    }

    // If editing an uploaded photo and Gemini image model was not available, preserve original photo & trigger client smart pixel editor!
    if (isEditing && !generatedImageUrl) {
      return res.json({
        imageUrl: baseImage,
        useClientSmartEdit: true,
        editSpec,
        steps: editSpec?.steps || [],
        prompt: enhancedPrompt
      });
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
      editSpec,
      steps: editSpec?.steps || [],
      prompt: enhancedPrompt,
      style,
      aspectRatio
    });

  } catch (error: any) {
    return res.status(500).json({ error: 'Photo generation failed', details: error.message });
  }
});

// Speech / TTS Endpoint
app.get('/api/tts', async (req: Request, res: Response) => {
  const { text, lang = 'ur' } = req.query;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  const cleanText = text.substring(0, 300).trim();
  const targetLang = lang === 'ur' ? 'ur' : 'en';

  const ttsEndpoints = [
    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${targetLang}&client=tw-ob`,
    `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${targetLang}&client=gtx`
  ];

  for (const url of ttsEndpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > 100) {
          const buffer = Buffer.from(arrayBuffer);
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.send(buffer);
        }
      }
    } catch (err) {
      // try next endpoint
    }
  }

  return res.status(502).json({ error: 'All TTS upstream endpoints failed' });
});

// Main Backend Chat Route (/api/chat and /api/translate)
async function handleChatRequest(req: Request, res: Response) {
  try {
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const { 
      prompt, 
      message,
      model = 'gemini-3.8-flash',
      image, 
      mimeType, 
      attachedUrl,
      language, 
      history = []
    } = parsedBody || {};

    const userPrompt = prompt || message || (history.length > 0 ? history[history.length - 1].text : '');

    if (!userPrompt && !image) {
      return res.status(400).json({ error: 'Missing prompt parameter' });
    }

    // Live Website Content Scraper / Link Analyzer
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
        scrapedUrlContext = `\n\n[WEBSITE LINK]: ${attachedUrl} (Direct parse prevented by network origin rules. Please ask user to paste code/text if needed.)\n\n`;
      }
    }

    let finalPrompt = userPrompt || 'Please analyze the attached file.';
    if (scrapedUrlContext) {
      finalPrompt = `${finalPrompt}${scrapedUrlContext}`;
    }

    const langInstruction = language ? `Strictly respond in ${language}.` : `Respond naturally in the same language as the user's message (Urdu, Hindi, English, etc.).`;
    
    const systemInstruction = `You are NOVA AI, a World-Class Multimodal AI Assistant, Intelligent Photo Editing AI, and Intelligent Font-Aware Video Generation AI.
${langInstruction}

${FONT_VIDEO_SYSTEM_PROMPT}

${PHOTO_EDITING_SYSTEM_PROMPT}

CONVERSATIONAL RULES (STRICT MANDATES):
1. MATCH RESPONSE LENGTH TO USER INPUT:
   - For simple greetings like "Hi", "Hello", "سلام", "ہائے": Give a short, natural greeting (e.g. "سلام! میں نووا AI ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟").
   - For "How are you?" / "کیا حال ہے؟": Respond warmly and concisely (e.g. "میں بالکل ٹھیک ہوں، الحمدللہ! آپ سنائیں کیسے ہیں؟").
   - DO NOT output long introductions, feature menus, or unsolicited lectures on simple greetings.
   - ONLY list features or capabilities IF the user explicitly asks "What can you do?" / "What are your features?" / "تم کیا کیا کر سکتے ہو؟".

2. MULTIMODAL AUDITING (PDFs, PHOTOS, CODE):
   - When a user uploads a PDF document, image screenshot, code file, or link:
     a) Deeply inspect and explain the document's main contents or code bugs.
     b) Identify any errors, blurry assets, or bad designs.
     c) Provide complete copyable code blocks to fix all issues.

3. TRUTHFULNESS & MORAL CONSTITUTION:
   - Always stand for truth, logic, and ethical principles.`;

    const normalizedContents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      let lastRole: string | null = null;

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
    } else if (requestedModel.includes('latest')) {
      targetModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
    }

    const ai = getGeminiClient();
    if (ai) {
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
        } catch (modelErr: any) {
          console.log(`Model ${mName} error:`, modelErr?.message || modelErr);
        }
      }
    }

    // Pollinations Backup if server key is missing or quota reached
    if (!aiText && !image) {
      try {
        aiText = await callPollinationsBackup(normalizedContents, systemInstruction);
      } catch (pErr) {
        console.log('Pollinations backup failed:', pErr);
      }
    }

    if (!aiText) {
      aiText = generateFallbackResponse(finalPrompt, language);
    }

    return res.json({ text: aiText, reply: aiText });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      error: error?.message || 'Internal Server Error',
      text: generateFallbackResponse('Assistance request', 'Urdu')
    });
  }
}

app.post('/api/chat', handleChatRequest);
app.post('/api/translate', handleChatRequest);

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false, watch: null },
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
