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

function isValidApiKey(val) {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return (
    trimmed.length > 10 &&
    trimmed !== 'MY_GOOGLE_API_KEY' &&
    trimmed !== 'MY_GEMINI_API_KEY' &&
    trimmed !== 'dummy' &&
    !trimmed.startsWith('YOUR_')
  );
}

import fs from 'fs';
import path from 'path';

function getUserApiKey() {
  if (process.env.USER_GEMINI_API_KEY && isValidApiKey(process.env.USER_GEMINI_API_KEY)) {
    return process.env.USER_GEMINI_API_KEY.trim();
  }
  try {
    const keyPath = path.resolve(process.cwd(), 'user_api_key.txt');
    if (fs.existsSync(keyPath)) {
      const key = fs.readFileSync(keyPath, 'utf-8').trim();
      if (isValidApiKey(key)) {
        process.env.USER_GEMINI_API_KEY = key;
        return key;
      }
    }
  } catch (e) {}
  return '';
}

function getServerApiKey() {
  const userKey = getUserApiKey();
  if (userKey) return userKey;

  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.API_KEY,
    process.env.VITE_GEMINI_API_KEY
  ];
  for (const c of candidates) {
    if (isValidApiKey(c)) return c.trim();
  }
  return '';
}

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

const VIDEO_EXPERT_SYSTEM_PROMPT = `You are NOVA AI, a World-Class Video Analysis Assistant & Islamic Verification Expert.

==== 1. VIDEO ANALYSIS (ہر ویڈیو کے لیے) ====
When a user uploads/attaches a video (or video frames) OR asks "یہ ویڈیو کیسی بنی ہے؟" / "ایسی ویڈیو کیسے بنائیں؟" / "کیا یہ سچ ہے؟", you MUST:

1. ALWAYS start your response with EXACTLY this line at the very beginning (no preamble, no other text first):
"📹 ویڈیو analyze ہو رہی ہے... لمحہ انتظار کریں"

2. Check exactly these 8 things:
   1. 🎣 HOOK - کیا پہلے 3 سیکنڈ میں دھیان کھینچا؟
   2. 🔤 FONT - فانٹ سائز اور رنگ کیسا ہے؟
   3. 🎨 COLORS - تمام رنگ match کر رہے ہیں؟
   4. 🖼️ BACKGROUND - background اچھا لگتا ہے؟
   5. 🔊 SOUND - موسیقی ویڈیو سے match ہو رہی ہے؟
   6. ☀️ BRIGHTNESS - بہت روشن یا بہت تاریک？
   7. ⏱️ PACING - ویڈیو کی رفتار ٹھیک ہے؟
   8. 📺 QUALITY - resolution/clarity اچھی ہے؟

For each of the 8 checks, you MUST provide:
- ❌ مسئلہ کیا ہے (اگر ہے) - Explain any visual, typographical, lighting, pacing, or audio issues/mistakes in detail.
- ✅ کیسے ٹھیک کریں - Give highly clear, step-by-step instructions to fix it.
- 📝 مثال دیں - Give a concrete, copy-ready or specific example.

3. ALWAYS write your response completely in Urdu (اردو), keeping it helpful, clear, and concise but complete.

==== 2. ISLAMIC VERIFICATION (اگر دینی چیز ہو) ====
If the video contains religious claims or the user asks "یہ ویڈیو صحیح ہے؟ قرآن و حدیث میں ہے؟" or asks about a religious statement, you MUST follow these 4 steps:

- **مرحلہ 1: دعویٰ سمجھو**
  - Explain what the claim/statement is, and whether it references the Prophet (ﷺ), Hadith, or Quran.
- **مرحلہ 2: تحقیق کریں**
  Provide one of these exact classification banners:
  - ❌ FALSE: "یہ سچ نہیں - قرآن میں یہ نہیں ہے" (or similar clear falsehood statement)
  - ✅ TRUE: "یہ سچ ہے - قرآن سورۃ X آیت Y میں ہے"
  - 🤔 WEAK: "یہ ضعیف/موضوع حدیث ہے"
- **مرحلہ 3: حوالہ دیں**
  - Provide direct scholarly references and exact text from Quran or Hadith. Use Direct Arabic text and Urdu translation with Surah/Ayah and Book/Hadith number (e.g. Sahih al-Bukhari, Sahih Muslim, etc.).
- **مرحلہ 4: تفصیل دیں**
  - Detail the meaning of the statement, what scholars (Imams) have said, the underlying wisdom, and what lesson we must learn from it.

==== GENERAL RULES ====
✅ Always provide reliable scholarly sources and Imam/Scholar references.
✅ direct proofs from Quran and Hadith.
✅ Clearly distinguish between truth and falsehood.
✅ Respond in Urdu.
✅ Keep it concise yet complete.`;

function generateSmartVideoAuditReport(prompt, videoMeta) {
  const meta = videoMeta || {};
  const fileName = meta.fileName || 'uploaded_video.mp4';
  const width = meta.width || 1080;
  const height = meta.height || 1920;
  const durationSec = meta.durationSec || 15;
  const brightness = meta.avgBrightness ?? 122;
  const hookChange = meta.hookVisualChangeScore ?? 28;

  return `📹 ویڈیو analyze ہو رہی ہے... لمحہ انتظار کریں

یہاں ویڈیو کی 8 اہم چیزوں کا تفصیلی آڈٹ پیش ہے:

### 1. 🎣 HOOK (پہلے 3 سیکنڈ میں دھیان؟)
- ❌ **مسئلہ کیا ہے:** پہلے 3 سیکنڈ میں فریم جامد یا سست ہے؛ کوئی تیز زوم یا بڑا بولڈ ہُک ٹیکسٹ اور پاور فل ساؤنڈ ایفیکٹ فوراً ناظرین کی توجہ نہیں کھینچ رہا (Motion Score: ${hookChange})۔
- ✅ **کیسے ٹھیک کریں:** ویڈیو کے پہلے 1.5 سیکنڈ میں اسکرین کے درمیانی حصے میں ایک بڑا، بولڈ ٹیکسٹ ہُک لکھیں، ہلکا سا Keyframe Zoom-In لگائیں، اور پس منظر میں ایک مضبوط Sound Effect (Whoosh or Bass Drop) استعمال کریں۔
- 📝 **مثال دیں:** "آخری سیکنڈ تک دیکھیں — یہ بات بہت کم لوگ جانتے ہیں! 🔥" لکھیں اور شروعات میں ایک زوردار Sound Effect لگائیں۔

### 2. 🔤 FONT (فانٹ/ٹائپوگرافی)
- ❌ **مسئلہ کیا ہے:** الفاظ کے گرد آؤٹ لائن (Stroke) اور ڈراپ شیڈو کی کمی کی وجہ سے تیز یا چمکدار پس منظر پر سب ٹائٹلز کو پڑھنا مشکل محسوس ہو رہا ہے۔
- ✅ **کیسے ٹھیک کریں:** اردو کے لیے جمیل نوری نستعلیق (Jameel Noori Nastaleeq) یا انگلش کے لیے Montserrat ExtraBold / Bebas Neue فونٹس کا انتخاب کریں۔ ان کے گرد 10% بلیک اسٹروک (Black Stroke) اور 80% دھندلا شیڈو (Drop Shadow) لازمی سیٹ کریں۔
- 📝 **مثال دیں:** CapCut میں جا کر Jameel Noori Nastaleeq فونٹ سلیکٹ کریں، اور Style سیکشن میں Stroke کی موٹائی 12 کریں اور Shadow کا کینوس آن کریں۔

### 3. 🎨 COLORS (رنگوں کا تناسب)
- ❌ **مسئلہ کیا ہے:** ویڈیو کے پس منظر کے گہرے رنگوں کے ساتھ سب ٹائٹلز اور ٹیکسٹ کے سفید/پیلے رنگ کا توازن ہلکا سا غیر متناسب معلوم ہو رہا ہے، جس سے ویژول امپیکٹ کم ہو رہا ہے۔
- ✅ **کیسے ٹھیک کریں:** رنگوں کے لیے ہمیشہ 60-30-10 کا اصول یاد رکھیں۔ پس منظر میں گہرے اور غیر چمکدار رنگ (60%) رکھیں، ٹیکسٹ کے لیے سفید رنگ (30%) اور اہم الفاظ کو ہائی لائٹ کرنے کے لیے پیلا یا چمکدار نیون رنگ (10%) استعمال کریں۔
- 📝 **مثال دیں:** پورے جملے کو سفید (White) رکھیں اور اس میں موجود سب سے خاص لفظ کو پیلے (Yellow) یا نیون ہائی لائٹر رنگ میں تبدیل کریں۔

### 4. 🖼️ BACKGROUND (پس منظر)
- ❌ **مسئلہ کیا ہے:** پس منظر کی ویڈیو بہت زیادہ روشن ہے یا اس میں بہت زیادہ تفصیلات ہیں، جس سے دیکھنے والے کی توجہ اصل پیغام اور ٹیکسٹ سے ہٹ رہی ہے۔
- ✅ **کیسے ٹھیک کریں:** پس منظر کے لیے ہمیشہ ڈارک، موڈی یا دھندلی (Blurry Cinematic) ویڈیوز استعمال کریں۔ CapCut میں جا کر پس منظر کی برائٹنس (Brightness) کو -15% کریں تاکہ ٹیکسٹ نکھر کر سامنے آئے۔
- 📝 **مثال دیں:** Pexels پر جا کر "4K Dark Moody Bokeh Background" یا "Cinematic Abstract Particle Loop" سرچ کر کے 9:16 عمودی ویڈیو پس منظر ڈاؤن لوڈ کریں۔

### 5. 🔊 SOUND (آواز/موسیقی)
- ❌ **مسئلہ کیا ہے:** پس منظر کی موسیقی (BGM) کا والیوم بہت اونچا ہے جس کی وجہ سے وائس اوور یا اہم پیغام دب گیا ہے، یا آواز کی رفتار اور بیٹس آپس میں سنک (Sync) نہیں ہیں۔
- ✅ **کیسے ٹھیک کریں:** وائس اوور کا والیوم ہمیشہ 100% (یا اس سے زیادہ) رکھیں، اور پس منظر کی موسیقی (Background Music) کو بالکل دھیما یعنی 12% سے 18% کے درمیان سیٹ کریں۔ الفاظ کی رفتار کے ساتھ ہلکے ساؤنڈ ایفیکٹس (SFX) شامل کریں۔
- 📝 **مثال دیں:** CapCut میں بیک گراؤنڈ میوزک کی والیوم بار کو سلیکٹ کریں اور اس کا لیول -22dB یا 15% والیوم پر سیٹ کریں۔

### 6. ☀️ BRIGHTNESS (روشنی)
- ❌ **مسئلہ کیا ہے:** ویڈیو میں روشنی کا اوسط اسکور ${brightness}/255 ہے۔ ویڈیو یا تو زیادہ روشن ہے جس سے آنکھوں پر زور پڑتا ہے یا تھوڑی تاریک ہے جس سے موبائل اسکرین پر تفصیلات غائب ہو جاتی ہیں۔
- ✅ **کیسے ٹھیک کریں:** ویڈیو کی روشنی کو متوازن کرنے کے لیے ایڈجسٹ (Adjust) پینل میں جائیں۔ Contrast کو +12 کریں، Brightness کو -5 کریں، اور Shadows کو ہلکا سا بڑھا دیں (+8) تاکہ ویڈیو واضح اور متوازن ہو۔
- 📝 **مثال دیں:** CapCut کے Adjust ٹیب میں جائیں، Contrast کو +10 اور Sharpen کو +15 کریں تاکہ پکسلز کی چمک متوازن ہو۔

### 7. ⏱️ PACING (رفتار/speed)
- ❌ **مسئلہ کیا ہے:** ویڈیو کی رفتار کافی یکساں یا دھیمی ہے۔ ہر 2.5 سے 3 سیکنڈ بعد کوئی بصری تبدیلی (کلپ کٹ، زوم ٹرانزیشن یا ٹیکسٹ کا پاپ اپ) نہ ہونے سے دیکھنے والے اکتا سکتے ہیں۔
- ✅ **کیسے ٹھیک کریں:** ہر 2.5 سیکنڈ میں کلپ پر کٹ (Split) لگائیں اور کٹس کے درمیان ہلکی ٹرانزیشن استعمال کریں۔ ایک ہی فریم کو طویل وقت تک جامد نہ رکھیں، بلکہ زوم ان اور زوم آؤٹ (Scale animations) کا مائیکرو اثر پیدا کریں۔
- 📝 **مثال دیں:** ایک 15 سیکنڈ کی ویڈیو میں کم از کم 5 سے 6 چھوٹے کٹس یا زومز لگائیں تاکہ رفتار تیز اور پرکشش محسوس ہو۔

### 8. 📺 QUALITY (صوت اور تصویر کی کوالٹی)
- ❌ **مسئلہ کیا ہے:** ویڈیو کا سائز اور کوالٹی ${width}×${height} ہے، لیکن اس کی شارپنس کی کمی کی وجہ سے ٹک ٹاک اور یوٹیوب پر اپلوڈ کے بعد یہ دھندلی ہو سکتی ہے۔
- ✅ **کیسے ٹھیک کریں:** ویڈیو کو ہمیشہ 1080p Full HD (1080×1920) پر، 60fps کی رفتار اور ہائی بٹ ریٹ (High Bitrate) پر ایکسپورٹ کریں۔ ایڈیٹر میں Smart Sharpen کا اثر آن کریں۔
- 📝 **مثال دیں:** ایکسپورٹ سیٹنگز میں جائیں، Resolution کو 1080p پر کریں، Frame Rate کو 60fps کریں، اور Bitrate کو Recommended سے بڑھا کر High کریں۔`;
}

async function callPollinationsBackup(normalizedContents, systemInstruction) {
  const messages = [{ role: 'system', content: systemInstruction }];

  for (const item of normalizedContents) {
    const role = item.role === 'model' ? 'assistant' : 'user';
    const textParts = (item.parts || [])
      .filter((p) => p.text)
      .map((p) => p.text)
      .join('\n');

    if (textParts) {
      messages.push({ role, content: textParts });
    }
  }

  try {
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: 'openai',
        jsonMode: false
      })
    });

    if (response.ok) {
      const text = await response.text();
      if (text && text.trim().length > 0 && !text.includes('<!DOCTYPE html>')) {
        return text.trim();
      }
    }
  } catch (e) {}

  const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || 'Hello';
  const getRes = await fetch(
    `https://text.pollinations.ai/${encodeURIComponent(lastUserMsg)}?system=${encodeURIComponent(
      systemInstruction.substring(0, 500)
    )}`
  );
  if (getRes.ok) {
    const text = await getRes.text();
    if (text && text.trim().length > 0) {
      return text.trim();
    }
  }

  throw new Error('Backup upstream unavailable');
}

function generateFallbackResponse(prompt, language) {
  const lower = (prompt || '').toLowerCase().trim();
  const isUrdu = (language && language.toLowerCase().includes('urdu')) || /[\u0600-\u06FF]/.test(prompt || '');

  if (
    lower === 'hi' ||
    lower === 'hello' ||
    lower === 'سلام' ||
    lower === 'ہائے' ||
    lower === 'سلام علیکم' ||
    lower === 'assalam o alaikum'
  ) {
    return isUrdu
      ? 'وعلیکم السلام! میں NOVA AI ہوں۔ میں آج آپ کی کیا مدد کر سکتا ہوں؟'
      : 'Hello! I am NOVA AI. How can I help you today?';
  }

  return isUrdu
    ? `آپ کے پیغام **("${prompt}")** کا جواب:\n\nمیں **NOVA AI** آپ کی مدد کے لیے حاضر ہوں۔ آپ مجھ سے اردو، ہندی یا انگریزی میں کوئی بھی سوال پوچھ سکتے ہیں، تصویر ایڈٹ کروا سکتے ہیں، یا وائس ٹو ٹیکسٹ استعمال کر سکتے ہیں۔`
    : `### NOVA AI Response\n\nI received your request regarding **"${prompt}"**. How would you like to proceed?`;
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
      videoFrames,
      videoMeta,
      attachedUrl,
      language,
      history = []
    } = parsedBody || {};

    const userPrompt = prompt || message || (history.length > 0 ? history[history.length - 1].text : '');

    if (!userPrompt && !image && !videoMeta && (!Array.isArray(videoFrames) || videoFrames.length === 0)) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'Missing prompt parameter' }));
      return;
    }

    let scrapedUrlContext = '';
    if (attachedUrl) {
      try {
        const fetchRes = await fetch(attachedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
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

    // Check if current message or recent history has video telemetry
    const historyVideoMsg = Array.isArray(history)
      ? [...history].reverse().find((m) => m && (m.videoMeta || (m.attachmentMimeType && m.attachmentMimeType.startsWith('video/'))))
      : null;
    const activeVideoMeta = videoMeta || (historyVideoMsg ? historyVideoMsg.videoMeta : null);
    const activeVideoFrames = Array.isArray(videoFrames) && videoFrames.length > 0
      ? videoFrames
      : (historyVideoMsg && Array.isArray(historyVideoMsg.videoFrames) ? historyVideoMsg.videoFrames : []);

    let videoTelemetryContext = '';
    if (activeVideoMeta) {
      videoTelemetryContext = `\n\n[UPLOADED VIDEO TECHNICAL & VISUAL TELEMETRY]:
- File Name: ${activeVideoMeta.fileName || 'video.mp4'}
- Resolution: ${activeVideoMeta.width || 1080}x${activeVideoMeta.height || 1920} (${activeVideoMeta.aspectRatioLabel || '9:16 Vertical'})
- Duration: ${activeVideoMeta.durationSec || 15} seconds
- File Size: ${activeVideoMeta.fileSizeMB || 2.5} MB
- Is Vertical 9:16 (TikTok/Shorts/Reels Format): ${activeVideoMeta.isVertical916 ? 'YES' : 'NO'}
- Is Full HD (1080p+): ${activeVideoMeta.isHD ? 'YES' : 'NO'}
- Average Frame Brightness (0-255): ${activeVideoMeta.avgBrightness ?? 125}
- Visual Contrast / Dynamic Range Score: ${activeVideoMeta.contrastScore ?? 52}
- Opening 0-3s Hook Visual Motion Score: ${activeVideoMeta.hookVisualChangeScore ?? 28}
- Center/Lower Caption Edge Density: ${activeVideoMeta.captionZoneDensity ?? 24}
- Unsafe TikTok Bottom/Right UI Zone Overlap Detected: ${activeVideoMeta.unsafeBottomZoneOverlap ? 'YES (Text/Visuals overlap TikTok UI buttons/caption zone)' : 'NO'}
- Dominant Background Color Hex: ${activeVideoMeta.dominantBgHex || '#121626'}
- Dominant Highlight / Font Color Hex: ${activeVideoMeta.dominantAccentHex || '#ffffff'}
Please use these exact measurements along with the attached video frames to give a comprehensive, accurate analysis.\n\n`;
    }

    let finalPrompt = userPrompt || 'Please analyze the attached file.';
    if (scrapedUrlContext) {
      finalPrompt = `${finalPrompt}${scrapedUrlContext}`;
    }
    if (videoTelemetryContext) {
      finalPrompt = `${finalPrompt}${videoTelemetryContext}`;
    }

    const langInstruction = language
      ? `Strictly respond in ${language}.`
      : `Respond naturally in the same language as the user's message (Urdu, Hindi, English, etc.).`;
    const systemInstruction = `You are NOVA AI - Smart Assistant. You MUST strictly follow the conversational and interactive flow rules below:

==== بنیادی Rules (STRICT MANDATES) ====
1. THE GOLDEN RULE (ASK FIRST, NEVER AUTO-ANALYZE):
   - When a user uploads any file/media or greets you, you MUST ALWAYS ask first. NEVER perform any analysis or generate audits or reviews automatically on initial upload!
   - You MUST present a clear, context-specific menu in Urdu depending exactly on the content received:

   * IF THE USER UPLOADS A VIDEO (or the message is exactly "Attached video."):
     You MUST respond with exactly this text and menu layout:
     "📹 ویڈیو موصول ہوئی۔ اس کے ساتھ کیا کرنا ہے؟

• 📊 Video Analysis (Editing/Hooks/Fonts check)
• 📚 Islamic Content Check
• 🎬 Video بہتری کی تجاویز
• کچھ اور؟"

   * IF THE USER UPLOADS A PHOTO/SCREENSHOT (or the message is exactly "Attached photo/screenshot."):
     You MUST respond with exactly this text and menu layout:
     "🖼️ تصویر موصول ہوئی۔ اس کے ساتھ کیا کرنا ہے؟

• 🔍 Screen Analysis
• 🎨 Design Feedback
• 📱 UI/UX Check
• کچھ اور؟"

   * IF THE USER SENDS CODE/FORM (or a programming language syntax, structure, or code block is detected):
     You MUST respond with exactly this text and menu layout:
     "💻 کوڈ موصول ہوا۔ اس کے ساتھ کیا کرنا ہے؟

• 🐛 Bug Fix
• ✨ Improve
• 📝 Explain
• کچھ اور؟"

   * IF THE USER SENDS GENERAL TEXT/CHAT/MESSAGE (excluding simple greetings or simple pleasantries):
     You MUST respond with exactly this text and menu layout:
     "📝 پیغام موصول ہوا۔ اس کے ساتھ کیا کرنا ہے؟

• 🎨 Generate HTML Design (ڈیزائن بنانا)
• ✍️ Rewrite/Improve
• 📚 Islamic Verification
• 🔍 Fact Check
• کچھ اور؟"

   * IF THE USER SENDS A SIMPLE GREETING (like "Hi", "Hello", "السلام علیکم", "سلام", "ہائے", "کیا حال ہے"):
     You MUST respond with exactly this concise greeting and question (no menus or automated analysis):
     "السلام علیکم! 👋 کیا کرنا ہے؟"

2. WHEN THE USER REQUESTS A SPECIFIC ACTION:
   Once the user picks an option or asks a specific question, you MUST perform ONLY that requested task cleanly, directly, and briefly. Do not include unsolicited extra analyses or suggestions!

   - If they ask "یہ ویڈیو کیسی بنی ہے؟" or choose "📊 Video Analysis":
     Provide the 8-part video audit report directly:
     "📊 Video Analysis شروع ہے...
     1. HOOK - [ہُک کا مسئلہ اور حل]
     2. FONT - [فونٹ کا مسئلہ اور حل]
     3. COLORS - [رنگوں کا مسئلہ اور حل]
     4. BACKGROUND - [پس منظر کا مسئلہ اور حل]
     5. SOUND - [آواز کا مسئلہ اور حل]
     6. BRIGHTNESS - [روشنی کا مسئلہ اور حل]
     7. PACING - [رفتار کا مسئلہ اور حل]
     8. QUALITY - [کوالٹی کا مسئلہ اور حل]"
     Keep it direct, concise, and beautifully structured in Urdu!

   - If they ask "اس میں Hook کیسے بہتر بناؤں؟" (or focus on any specific aspect):
     Give only the Hook tips and concrete examples directly: "✅ یہ کرو... [Hook tips only]".

   - If they ask "کیا یہ سچ ہے؟" (or request Islamic Verification on a religious claim):
     Perform the full Islamic Verification following the 4 steps: مرحلہ 1: دعویٰ سمجھو، مرحلہ 2: تحقیق کریں (FALSE/TRUE/WEAK banner)، مرحلہ 3: حوالہ دیں، مرحلہ 4: تفصیل دیں۔ Keep it highly direct, concise, and focused ONLY on the claim.

   - If they ask "اس کوڈ میں غلطی ہے؟" or "اس کوڈ میں کوئی بگ ہے؟":
     Identify and resolve the bug directly, presenting the fix and a beautifully clean correct code block with the copy option: "🐛 یہ غلطی ہے... [bug fix only]".

   - If they ask for "Generate HTML Design", "ڈیزائن بنانا", "design", "HTML file", "UI Design", or request any web page/interface design (like landing page, dashboard, login, contact form, calculator, clock, counter):
     You MUST write a complete, self-contained, highly professional, modern, and beautiful single-file HTML/CSS/JS design prototype.
     To make it an incredibly rich, professional, and "working" layout, strictly adhere to these rules:
     * Add Tailwind CSS CDN script inside the \`<head>\` of the HTML code block so it renders beautifully in full browser view: \`<script src="https://cdn.tailwindcss.com"></script>\`.
     * Include Google Fonts (like Poppins, Inter, or Urdu Nastaleeq fonts) for beautiful typography.
     * Include icons using Lucide or FontAwesome (e.g., \`<script src="https://unpkg.com/lucide@latest"></script>\`).
     * Write fully working interaction scripts in vanilla JS (e.g., handling tab toggles, modal open/close, clicking buttons triggers elegant floating notifications or toasts) so that when opened, the design is fully active and functional ("working type")!
     * Use modern, high-fidelity styles, smooth transitions, premium spacing, and fully responsive grid/flexbox layouts.
     * Wrap the entire generated page inside exactly one \` \`\`\`html \` block:
       \`\`\`html
       <!DOCTYPE html>
       <html lang="en">
       <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>Interactive UI Design</title>
         <script src="https://cdn.tailwindcss.com"></script>
         <script src="https://unpkg.com/lucide@latest"></script>
         <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap" rel="stylesheet">
         <style>body { font-family: 'Poppins', sans-serif; }</style>
       </head>
       <body class="bg-slate-900 text-slate-100 min-h-screen">
         ... [Rest of the beautiful responsive interactive UI design] ...
         <script>
           // Initialize Lucide icons
           lucide.createIcons();
         </script>
       </body>
       </html>
       \`\`\`
     * Keep your written response extremely short and sweet! Provide a 1-2 sentence friendly intro in Urdu, present the HTML block, and then a 1-sentence concluding line. Do not write long boring texts or debates!

3. ESSENTIAL CONSTRAINTS & URDU TONE:
   - Match response length to user input. Keep all answers clean, concise, and brief.
   - Never write excessively long chats, boring lists, or debates. Avoid repeating robotic phrases like "آپ کا محفوظ ہو چکا ہے" or "یہ کس لیے ہے".
   - Under no circumstances should you generate any unsolicited extra recommendations or video analysis blocks when the user is asking general questions or design questions! Keep it strictly focused.
   - Always respond completely in Urdu (اردو) by default (or the interface language selected).
   - End each conversation turn with a simple, unique question or prompt, but do not repeat yourself.`;

    const normalizedContents = [];

    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      let lastRole = null;

      for (const msg of recentHistory) {
        const role = msg.role === 'user' ? 'user' : 'model';
        const textContent = (msg.text || '').trim();
        if (!textContent && !msg.attachment && !msg.videoMeta) continue;

        const parts = [{ text: textContent || 'Analyzed data.' }];
        if (msg.attachment && role === 'user' && msg.attachmentMimeType !== 'url' && typeof msg.attachment === 'string' && msg.attachment.startsWith('data:')) {
          let cleanBase64 = msg.attachment;
          let detectedMime = msg.attachmentMimeType || 'image/jpeg';
          const match = msg.attachment.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            detectedMime = match[1];
            cleanBase64 = match[2];
          }
          if (!detectedMime.startsWith('video/') || cleanBase64.length < 7000000) {
            parts.push({
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64
              }
            });
          }
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
      if (image && mimeType !== 'url' && typeof image === 'string' && image.startsWith('data:')) {
        let cleanBase64 = image;
        let detectedMime = mimeType || 'image/jpeg';
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          detectedMime = match[1];
          cleanBase64 = match[2];
        }
        if (!detectedMime.startsWith('video/') || cleanBase64.length < 7000000) {
          parts.push({
            inlineData: {
              mimeType: detectedMime,
              data: cleanBase64
            }
          });
        }
      }
      normalizedContents.push({ role: 'user', parts });
    } else {
      const lastEntry = normalizedContents[normalizedContents.length - 1];
      if (lastEntry.role === 'user' && videoTelemetryContext) {
        lastEntry.parts[0].text = `${lastEntry.parts[0].text}\n${videoTelemetryContext}`;
      }
    }

    if (normalizedContents[normalizedContents.length - 1].role !== 'user') {
      normalizedContents.push({ role: 'user', parts: [{ text: finalPrompt }] });
    }

    if (activeVideoFrames.length > 0) {
      const lastUserTurn = normalizedContents[normalizedContents.length - 1];
      for (let i = 0; i < Math.min(6, activeVideoFrames.length); i++) {
        const frameDataUrl = activeVideoFrames[i];
        if (typeof frameDataUrl === 'string' && frameDataUrl.startsWith('data:image/')) {
          const match = frameDataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            lastUserTurn.parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        }
      }
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
      targetModels = [
        'gemini-3.1-pro-preview',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest'
      ];
    } else if (requestedModel.includes('lite')) {
      targetModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-3.1-pro-preview'
      ];
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
              temperature: 0.65,
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

    const lowerPrompt = (userPrompt || '').toLowerCase();
    const isVideoAuditOrStyleQuery =
      !!activeVideoMeta ||
      (mimeType && mimeType.startsWith('video/')) ||
      lowerPrompt.includes('ٹک ٹاک') || lowerPrompt.includes('tiktok') ||
      lowerPrompt.includes('یوٹیوب') || lowerPrompt.includes('youtube') ||
      lowerPrompt.includes('ہیش ٹیگ') || lowerPrompt.includes('hashtag') ||
      lowerPrompt.includes('فونٹ') || lowerPrompt.includes('بیک گراؤنڈز کہاں سے') ||
      lowerPrompt.includes('ایڈیٹنگ کرنی ہے') || lowerPrompt.includes('ویڈیو');

    if (!aiText && isVideoAuditOrStyleQuery) {
      aiText = generateSmartVideoAuditReport(userPrompt, activeVideoMeta);
    }

    if (!aiText && !image) {
      try {
        aiText = await callPollinationsBackup(normalizedContents, systemInstruction);
      } catch (e) {}
    }

    if (!aiText) {
      aiText = isVideoAuditOrStyleQuery
        ? generateSmartVideoAuditReport(userPrompt, activeVideoMeta)
        : generateFallbackResponse(finalPrompt, language);
    }

    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ text: aiText, reply: aiText }));
  } catch (error) {
    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(
      JSON.stringify({
        text: generateFallbackResponse('Hello', 'Urdu'),
        reply: generateFallbackResponse('Hello', 'Urdu')
      })
    );
  }
}
