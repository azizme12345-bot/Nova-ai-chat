/**
 * NOVA AI - Intelligent Font-Aware Video Generation API
 * File: api/video-style.js
 */
import { GoogleGenAI } from '@google/genai';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

function getServerApiKey() {
  const key = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  if (key === 'MY_GOOGLE_API_KEY' || key === 'MY_GEMINI_API_KEY' || key === 'dummy') {
    return '';
  }
  return key;
}

function parseFontVideoSpec(rawPrompt) {
  const text = rawPrompt || '';
  const lower = text.toLowerCase();

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

  let fontFamily = 'Georgia, "Times New Roman", serif';
  let fontName = 'Georgia';
  let fontCategory = 'Serif';

  if (lower.includes('georgia')) {
    fontFamily = 'Georgia, "Times New Roman", serif';
    fontName = 'Georgia';
    fontCategory = 'Serif';
  } else if (lower.includes('times') || lower.includes('playfair') || lower.includes('garamond') || (lower.includes('serif') && !lower.includes('sans'))) {
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

  let moodLabel = 'formal, elegant';
  let animationType = 'slow-fade';
  let animationLabel = 'Slow fade-in';
  let effectsLabel = 'Soft shadow, subtle glow';
  let bgStart = '#090d1a';
  let bgEnd = '#17153b';
  let textColor = '#ffffff';
  let accentColor = '#cbd5e1';
  let glowColor = 'rgba(148, 163, 184, 0.5)';

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
    effectsLabel = 'Intense neon bloom, cyber grid';
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
  }

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

    const { prompt = '' } = parsedBody || {};
    const baseSpec = parseFontVideoSpec(prompt);

    const apiKey = getServerApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

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

    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify(baseSpec));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: err.message || 'Video analysis failed' }));
  }
}
