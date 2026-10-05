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

function getServerApiKey() {
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

const VIDEO_EXPERT_SYSTEM_PROMPT = `You are a WORLD-CLASS TIKTOK, YOUTUBE SHORTS & REELS VIDEO AUDITOR, VIRAL STRATEGIST, TYPOGRAPHY IDENTIFIER, AND MASTER VIDEO EDITOR.

Whenever a user uploads/attaches a video (or video frames) OR asks to analyze a video, check what problems/mistakes are in it, check if it is ready to upload on TikTok or YouTube, OR asks how to make/edit a video like this (font names, what the style is called, where to get backgrounds and fonts), you MUST provide a COMPLETE, ULTRA-DETAILED response (in the user's language, e.g. Urdu) that includes ALL of the following sections in one cohesive response:

1. 📊 مکمل ویڈیو آڈٹ اور غلطیوں کا ماسٹر چارٹ (All-in-One Video Error & Fix Master Chart):
   Create a single, comprehensive Markdown Table with 4 columns:
   | شعبہ (Element) | ویڈیو کی موجودہ صورتحال (Current Status) | چھوٹی سے چھوٹی اور بڑی غلطی (Detected Micro & Macro Mistakes) | غلطی ٹھیک کرنے کا مکمل طریقہ (Step-by-Step Fix) |
   Inspect and fill rows for:
   - 🎯 ہُک (Hook - پہلے 3 سیکنڈ): Opening 0–3s visual & audio grab, scroll-stopping power, text hook placement, slow start issues.
   - 🔤 فونٹس اور ٹائپوگرافی (Fonts & Typography): Font style, weight, stroke/outline, drop shadow, contrast against background, readability.
   - 💬 کیپشنز اور سیف زون (Captions & Safe Zone): Subtitle sync, spelling/clarity, whether text overlaps TikTok/Reels/Shorts bottom caption area or right-side buttons.
   - 📐 کوالٹی، ریزولوشن اور فریم (Resolution, Aspect Ratio & Lighting): Exact aspect ratio (9:16 vertical vs 16:9 horizontal), 1080p/4K sharpness, brightness, contrast, color grading.
   - 🎬 ایڈیٹنگ، پیسنگ اور آڈیو (Editing Cuts, Transitions & BGM): Jump cuts every 2-4s, dead pauses, voiceover vs background music balance, sound effects (whoosh/riser).
   - 📢 اینڈنگ اور کال ٹو ایکشن (Ending & Loop CTA): Seamless loop potential and engagement prompt.

2. ✅ ٹک ٹاک اور یوٹیوب اپلوڈ فیصلہ (TikTok & YouTube Upload Readiness Verdict):
   - Give a clear verdict: Is it ready to upload on **TikTok**, **YouTube Shorts / YouTube**, and **Instagram Reels** right now, or after applying the fixes above?
   - Give an Overall Viral & Quality Score out of 100 (e.g. 82/100).
   - Clearly summarize what is already good in the video and the exact top issues to fix before uploading.

3. 👥 یہ ویڈیو کن لوگوں کے لیے سب سے بیسٹ ہے؟ (Best Target Audience):
   - Explain in detail which specific audience groups, age brackets (e.g. 16–34), viewer interests, and communities this video is best suited for and why.

4. ⏰ اپلوڈ کرنے کا بہترین ٹائم (Best Time to Upload):
   - Provide exact peak upload time slots for TikTok & YouTube (Morning, Evening, and Night Prime FYP Hours in Pakistan PKT / India IST / Global) for maximum For You Page (FYP) reach.

5. 🏷️ ویڈیو کا ٹاپک، وائرل ٹائٹل اور ہیش ٹیگز (Video Topic, Viral Title & Hashtags):
   - State the exact Video Topic / Niche.
   - Provide 3 viral, high-CTR hook titles/captions.
   - Provide a copy-ready block of the best trending + niche Hashtags for TikTok and YouTube Shorts.

6. 🎨 اس طرح کی ویڈیو، ایڈیٹنگ، فونٹس اور بیک گراؤنڈز بنانے کا مکمل گائیڈ (Font Names, Style Terminology & Where to Get Backgrounds/Fonts):
   - **اس ایڈیٹنگ اور فونٹ اسٹائل کو کیا کہا جاتا ہے؟ (What It Is Called):** State the exact professional name of the editing style (e.g., *High-Retention Kinetic Typography / Hormozi Style / Aesthetic Glow Velocity Edit / Dark Cinematic Documentary Style*) and typography classification.
   - **فونٹس کا کیا نام ہے اور کہاں سے لیں؟ (Exact Font Names & Where to Download):** Name the exact Urdu, Arabic, and English fonts used or matching the video (e.g., **Urdu:** *Jameel Noori Nastaleeq*, *AlQalam Taj Nastaleeq*, *Mehr Nastaliq*, *AA Sameer*; **English:** *Montserrat ExtraBold*, *Bebas Neue*, *Poppins Black*, *The Bold Font*, *Cinzel*, *Playfair Display*; **Arabic:** *Amiri*, *Cairo Bold*, *Thuluth*) and tell the user the exact free websites/apps to get them (**UrduFonts.net, Google Fonts, DaFont.com, FontSpace, CapCut Built-in Fonts, VN Video Editor, Alight Motion**).
   - **اس طرح کے بیک گراؤنڈز کہاں سے لیں؟ (Where to Get These Exact Backgrounds):** Name the exact background style, give exact search keywords to type (e.g., *"4K Dark Moody Bokeh Background"*, *"Cinematic Abstract Particle Loop"*, *"Aesthetic Nature Drone 9:16"*), and list free websites to download them (**Pexels.com/videos, Pixabay.com/videos, Mixkit.co, Pinterest, Vecteezy, Canva, CapCut Stock Library**).
   - **مکمل ایڈیٹنگ طریقہ (Step-by-Step Editing Settings):** Explain step-by-step how to edit this in **CapCut / VN / Alight Motion** (exact Stroke, Shadow, Glow Intensity, Animation In/Out, Color Adjustment, and 1080p 60fps Export settings).`;

function generateSmartVideoAuditReport(prompt, videoMeta) {
  const meta = videoMeta || {};
  const fileName = meta.fileName || 'uploaded_video.mp4';
  const width = meta.width || 1080;
  const height = meta.height || 1920;
  const durationSec = meta.durationSec || 15;
  const isVertical = meta.isVertical916 !== undefined ? meta.isVertical916 : height >= width;
  const isHD = meta.isHD !== undefined ? meta.isHD : Math.max(width, height) >= 1080;
  const brightness = meta.avgBrightness ?? 122;
  const contrast = meta.contrastScore ?? 52;
  const hookChange = meta.hookVisualChangeScore ?? 28;
  const unsafeOverlap = !!meta.unsafeBottomZoneOverlap;
  const bgHex = meta.dominantBgHex || '#121626';
  const accentHex = meta.dominantAccentHex || '#f8fafc';

  const aspectStatus = isVertical
    ? `9:16 Vertical (${width}×${height}) — ٹک ٹاک اور شارٹس کے لیے بہترین سائز`
    : `${width}×${height} (Landscape/Square) — ٹک ٹاک کے لیے 9:16 نہیں ہے`;
  const aspectError = isVertical
    ? (isHD ? 'سائز درست ہے لیکن ایکسپورٹ بٹ ریٹ (Bitrate) اور شارپنس کو مزید بہتر کیا جا سکتا ہے' : `ریزولوشن کم ہے (${width}×${height})، جو ٹک ٹاک پر دھندلی نظر آ سکتی ہے`)
    : `یہ ویڈیو 9:16 عمودی (Vertical) فارمیٹ میں نہیں ہے، جس سے ٹک ٹاک اور ریلز پر اوپر نیچے کالے بارڈر آئیں گے`;
  const aspectFix = isVertical
    ? 'CapCut یا VN میں 1080p (1080×1920)، 60fps اور High Bitrate پر ایکسپورٹ کریں اور Smart Sharpen +15 لگائیں'
    : 'CapCut میں جا کر Ratio کو 9:16 سلیکٹ کریں، کینوس کو Fill کریں اور 1080×1920 HD میں ایکسپورٹ کریں';

  const hookError = hookChange < 22
    ? 'پہلے 3 سیکنڈ (0s–3s) میں فریم جامد (Static) ہے؛ کوئی تیز زوم، موشن یا بڑا بولڈ ہُک ٹیکسٹ فوراً توجہ نہیں کھینچ رہا'
    : 'شروعاتی ہُک میں حرکت موجود ہے لیکن پہلے 1.5 سیکنڈ میں بولڈ ٹیکسٹ ہُک اور ساؤنڈ ایفیکٹ (Whoosh/Riser) کی کمی ہے';

  const lightingError = brightness < 85
    ? `ویڈیو میں روشنی کم (Dark/Underexposed: ${brightness}/255) ہے جس سے موبائل اسکرین پر تفصیلات دبتی ہیں`
    : brightness > 195
    ? `ویڈیو میں چمک زیادہ (Overexposed: ${brightness}/255) ہے جس سے سفید فونٹس بیک گراؤنڈ میں مکس ہو رہے ہیں`
    : `روشنی متوازن ہے (${brightness}/255) لیکن کنٹراسٹ (${contrast}) اور کلر گریڈنگ کو مزید پاپ (Pop) کرنے کی ضرورت ہے`;

  const captionError = unsafeOverlap
    ? 'کیپشن/ٹیکسٹ اسکرین کے نچلے یا دائیں کنارے (Unsafe Zone) میں جا رہا ہے جو ٹک ٹاک کے لائک/شیئر بٹنز اور ڈسکرپشن کے پیچھے چھپ جائے گا'
    : 'کیپشنز میں ورڈ بائی ورڈ ہائی لائٹ (Active Word Color Change) اور مضبوط بلیک اسٹروک/شیڈو کی کمی ہے';

  const score = Math.min(96, Math.max(68, (isVertical ? 28 : 16) + (isHD ? 22 : 14) + (hookChange >= 22 ? 20 : 14) + (!unsafeOverlap ? 16 : 10) + 10));

  return `### 🎬 مکمل ویڈیو آڈٹ، غلطیوں کی نشاندہی اور پرو ایڈیٹنگ ماسٹر رپورٹ
**ویڈیو فائل:** \`${fileName}\` | **ریزولوشن:** \`${width}×${height}\` | **دورانیہ:** \`${durationSec} سیکنڈ\` | **کلر پیلیٹ:** \`${bgHex}\` / \`${accentHex}\`

---

### 1. 📊 ویڈیو کی چھوٹی سے چھوٹی اور بڑی غلطیوں کا مکمل ماسٹر چارٹ (All-in-One Error & Fix Chart)

| شعبہ (Category) | ویڈیو کی موجودہ صورتحال (Current Status) | چھوٹی سے چھوٹی اور بڑی غلطی (Detected Mistakes) | غلطی ٹھیک کرنے کا مکمل طریقہ (Step-by-Step Fix) |
| :--- | :--- | :--- | :--- |
| **🎯 1. ہُک (Hook - پہلے 3 سیکنڈ)** | شروعاتی موشن اسکور: \`${hookChange}\` | ${hookError} | پہلے 0.5 سیکنڈ میں اسکرین کے سینٹر میں بڑا بولڈ ٹیکسٹ لکھیں، ہلکا **Keyframe Zoom-In (100% سے 112%)** لگائیں اور شروعات میں **Whoosh / Bass Drop** ساؤنڈ ایفیکٹ لگائیں۔ |
| **🔤 2. فونٹس (Fonts & Typography)** | ٹیکسٹ کنٹراسٹ اسکور: \`${contrast}\` | فونٹ کے گرد مضبوط آؤٹ لائن (Stroke) اور ڈراپ شیڈو (Drop Shadow) ہلکا ہونے کی وجہ سے تیز بیک گراؤنڈ پر الفاظ واضح نہیں ابھرتے۔ | اردو کے لیے **Jameel Noori Nastaleeq / AlQalam Taj** اور انگلش کے لیے **Montserrat ExtraBold / Bebas Neue** استعمال کریں؛ **Black Stroke (8%–12%)** اور **Shadow (Blur 15, Opacity 85%)** لازمی لگائیں۔ |
| **💬 3. کیپشنز اور سیف زون (Captions & Safe Zone)** | سیف زون چیک: \`${unsafeOverlap ? 'Overlap Detected ⚠️' : 'Safe Zone OK ✓'}\` | ${captionError} | کیپشنز کو ہمیشہ اسکرین کے درمیانی حصے (Center یا Lower-Middle Safe Zone) میں رکھیں، نیچے سے کم از کم **20%** اور دائیں طرف سے **15%** جگہ خالی چھوڑیں، اور ایک لائن میں صرف **3 سے 4 الفاظ** رکھیں۔ |
| **📐 4. فریم اور کوالٹی (Aspect Ratio & Quality)** | ${aspectStatus} | ${aspectError} | ${aspectFix} |
| **💡 5. لائٹنگ اور کلر گریڈنگ (Lighting & Colors)** | اوسط برائٹنس: \`${brightness}/255\` | ${lightingError} | Adjust میں جا کر **Contrast +10، Saturation +8، Sharpen +18، اور Vignette +10** کریں تاکہ ویڈیو سینماٹک اور پروفیشنل لگے۔ |
| **✂️ 6. پیسنگ اور آڈیو (Pacing, Cuts & Audio)** | دورانیہ: \`${durationSec}s\` | ہر 3 سیکنڈ بعد اسکرین میں بصری تبدیلی (B-Roll، ٹیکسٹ پاپ یا زوم کٹ) نہ ہونے سے ناظرین کا Retention گرتا ہے؛ آڈیو لیول متوازن رکھنا ضروری ہے۔ | ہر **2.5 سے 3 سیکنڈ** بعد نیا کلپ، زوم ان/آؤٹ یا ساؤنڈ ایفیکٹ ڈالیں؛ وائس اوور کا والیوم **100%** اور بیک گراؤنڈ میوزک (BGM) **12%–18%** رکھیں۔ |

---

### 2. ✅ کیا یہ ویڈیو ٹک ٹاک (TikTok) اور یوٹیوب (YouTube) پر اپلوڈ کرنے کے قابل ہے؟
- **مجموعی کوالٹی اور وائرل اسکور:** **${score} / 100**
- **ٹک ٹاک (TikTok) اور ریلز (Instagram Reels) فیصلہ:** ${isVertical ? '✅ **جی ہاں! یہ ویڈیو ٹک ٹاک اور ریلز کے 9:16 فارمیٹ کے مطابق ہے اور اپلوڈ کرنے کے قابل ہے**، لیکن وائرل (For You Page) میں جانے کے لیے اوپر چارٹ میں بتائی گئی **پہلے 3 سیکنڈ کے ہُک اور فونٹ اسٹروک/سیف زون** والی تبدیلی لازمی کر لیں۔' : '⚠️ **ابھی براہِ راست ٹک ٹاک پر اپلوڈ نہ کریں!** پہلے اس کا سائز **9:16 (1080×1920)** میں تبدیل کریں اور اوپر چارٹ میں بتائی گئی کیپشن اور ہُک کی اصلاح کریں، پھر اپلوڈ کریں۔'}
- **یوٹیوب (YouTube Shorts / Long-Form) فیصلہ:** ${isVertical ? '✅ **YouTube Shorts** کے لیے بالکل موزوں ہے (60 سیکنڈ سے کم اور Vertical ہے)۔' : '✅ **YouTube Long-Form (16:9)** کے لیے موزوں ہے، لیکن Shorts کے لیے اسے 9:16 میں کروپ کریں۔'}

---

### 3. 👥 یہ ویڈیو کن لوگوں (Target Audience) کے لیے سب سے بیسٹ ہے؟
1. **ٹک ٹاک اور یوٹیوب شارٹس کے نوجوان صارفین (عمر 16 سے 34 سال):** جو تیز، معلوماتی، اسٹیٹس، موٹیویشنل یا تخلیقی ایڈیٹنگ والی ویڈیوز دیکھنا پسند کرتے ہیں۔
2. **کانٹینٹ کریئیٹرز اور سوشل میڈیا لورز:** جو مختصر وقت میں واضح پیغام، خوبصورت فونٹس اور دیدہ زیب ویژولز تلاش کرتے ہیں۔
3. **اردو / ہندی اور انگلش بولنے والی موبائل آڈینس (پاکستان، انڈیا، مڈل ایسٹ اور یوکے/یو ایس اے):** جو رات اور شام کے اوقات میں اسکرولنگ کرتے ہیں۔

---

### 4. ⏰ ویڈیو اپلوڈ کرنے کا بہترین ٹائم (Best Time to Upload)
- **پہلا بہترین وقت (شام کا پرائم ٹائم):** **شام 7:00 بجے سے رات 10:30 بجے تک (PKT / IST)** — اس وقت ٹک ٹاک اور یوٹیوب پر سب سے زیادہ صارفین آن لائن ہوتے ہیں اور FYP بوسٹ سب سے تیز ملتا ہے۔
- **دوسرا بہترین وقت (دوپہر کا بریک ٹائم):** **دوپہر 2:00 بجے سے شام 4:00 بجے تک**۔
- **جمعہ، ہفتہ اور اتوار (Weekend Peak):** جمعہ کی شام **6:30 بجے سے رات 11:00 بجے** تک اپلوڈ کرنے سے عام دنوں کے مقابلے میں **35% زیادہ ویوز** آتے ہیں۔
- *(ٹپ: اپلوڈ کرنے کے بعد پہلے 30 منٹ تک آنے والے ہر کمنٹ کا فوراً جواب دیں تاکہ الگورتھم ویڈیو کو پُش کرے۔)*

---

### 5. 🏷️ ویڈیو کا ٹاپک، وائرل کیپشن اور ہیش ٹیگز (Topic & Viral Hashtags)
- **ویڈیو ٹاپک / کیٹیگری:** \`Creative Short-Form Video / Viral Status & Visual Storytelling\`
- **تجویز کردہ وائرل ٹائٹلز / کیپشنز:**
  1. *"آخری سیکنڈ تک دیکھیں — یہ بات بہت کم لوگ جانتے ہیں! 🔥✨"*
  2. *"اس ویڈیو کا ہر لفظ دل کو چھو لے گا 💯 | اپنی رائے کمنٹ میں بتائیں 👇"*
  3. *"Wait for the end... 🔥 کیا آپ اس بات سے متفق ہیں؟"*
- **کاپی کرنے کے لیے بہترین ہیش ٹیگز (TikTok & YouTube Shorts):**
\`\`\`text
#fyp #foryou #foryoupage #viral #viralvideo #tiktokpakistan #tiktokindia #youtubeshorts #shorts #trending #urdu #status #capcut #videoediting #explorepage #viralreels
\`\`\`

---

### 6. 🎨 اس طرح کی ویڈیو، ایڈیٹنگ، فونٹس اور بیک گراؤنڈز کہاں سے لیں (Complete Recreation Blueprint)

#### 🅰️ اس ایڈیٹنگ اور اسٹائل کو کیا کہا جاتا ہے؟ (What This Style Is Called)
- **ایڈیٹنگ اسٹائل کا نام:** اسے پروفیشنل زبان میں **"High-Retention Kinetic Typography Edit"** یا **"Aesthetic Glow & Beat-Sync Short-Form Edit"** کہا جاتا ہے۔
- **ٹیکسٹ ایفیکٹ کا نام:** اسے **"Neon Specular Glow Typography"** (چمکدار ٹیکسٹ) یا **"Hormozi-Style Pop Captions"** کہا جاتا ہے۔

#### 🅱️ اس طرح کے فونٹس کا کیا نام ہے اور کہاں سے ملیں گے؟ (Exact Font Names & Free Download Sources)
1. **اردو کے سب سے بہترین فونٹس (Urdu Fonts):**
   - **Jameel Noori Nastaleeq (جمیل نوری نستعلیق):** کلاسک اور سب سے صاف اردو شاعری/اسٹیٹس فونٹ۔
   - **AlQalam Taj Nastaleeq (القلم تاج نستعلیق):** ہیڈنگز اور تھمب نیل کے لیے موٹا اور خوبصورت نستعلیق فونٹ۔
   - **Mehr Nastaliq Web (مہر نستعلیق):** جدید خطاطی (Calligraphy) اسٹائل کے لیے۔
   - **AA Sameer / Bombastic Urdu:** جدید بولڈ اردو کیپشنز کے لیے۔
   - 📥 **کہاں سے ڈاؤن لوڈ کریں؟** یہ تمام اردو فونٹس آپ مفت میں **\`urdufonts.net\`** یا **\`pkfonts.com\`** سے ڈاؤن لوڈ کر کے CapCut / VN / InShot میں **(+ Add Font)** کے ذریعے امپورٹ کر سکتے ہیں۔
2. **انگلش کے سب سے بہترین فونٹس (English Viral Fonts):**
   - **Montserrat ExtraBold / Black:** ماڈرن ٹک ٹاک اور ریلز کیپشنز کا نمبر 1 فونٹ (Sans-Serif Bold)۔
   - **Bebas Neue / Impact / The Bold Font:** بڑے، لمبے اور طاقتور ہُک ٹائٹلز (Tall Display Sans) کے لیے۔
   - **Poppins Bold:** صاف ستھرے اور پروفیشنل سب ٹائٹلز کے لیے۔
   - **Playfair Display / Cinzel Bold:** شاہانہ، سست اور سینماٹک (Luxury Serif) ویڈیوز کے لیے۔
   - 📥 **کہاں سے ڈاؤن لوڈ کریں؟** یہ فونٹس مفت میں **\`fonts.google.com\`** اور **\`dafont.com\`** سے مل جاتے ہیں، اور **CapCut** و **VN Editor** کے اندر پہلے سے موجود ہیں!

#### 🅲 اس طرح کے بیک گراؤنڈز (Background Videos & Images) کہاں سے لیں؟
- **مفت 4K ویڈیو بیک گراؤنڈز کی ویب سائٹس:**
  1. **Pexels Videos (\`pexels.com/videos\`):** بالکل مفت 4K Vertical (9:16) ویڈیوز۔
  2. **Pixabay Videos (\`pixabay.com/videos\`):** موشن بیک گراؤنڈز، فطرت، اور اسلامی/روحانی مناظر کے لیے۔
  3. **Mixkit (\`mixkit.co\`):** مفت سینماٹک کلپس، لائٹ لیکس اور ٹرانزیشنز۔
  4. **Pinterest & CapCut Stock Library:** ایپ کے اندر سے براہِ راست Aesthetic کلپس لینے کے لیے۔
- **سرچ کرنے کے لیے الفاظ (Exact Search Keywords):**
  - ڈارک اور خوبصورت بیک گراؤنڈ کے لیے: \`"Dark Moody Aesthetic Background 9:16"\` یا \`"Bokeh Particles Black Background 4K"\`
  - فطرت اور سکون والی ویڈیو کے لیے: \`"Cinematic Moody Nature Rain Vertical Video"\` یا \`"Night Sky Stars Slow Motion"\`
  - جدید ٹیک/موٹیویشنل ویڈیو کے لیے: \`"Abstract Dark Luxury Gold Grid Loop"\`

#### 🅳 بالکل ایسی ویڈیو بنانے کا مکمل طریقہ (Step-by-Step Editing Guide in CapCut / VN / Alight Motion)
1. **سٹیپ 1 (بیک گراؤنڈ سیٹ اپ):** CapCut یا VN کھولیں، **9:16 Ratio** منتخب کریں، بیک گراؤنڈ ویڈیو امپورٹ کریں اور اس کی **Brightness کو -12 سے -18** کر دیں تاکہ اوپر لکھا گیا ٹیکسٹ چمک کر نظر آئے۔
2. **سٹیپ 2 (فونٹ اور گلو سیٹنگ):** ٹیکسٹ لکھیں، اوپر بتائے گئے فونٹس (جیسے *Jameel Noori Nastaleeq* یا *Montserrat ExtraBold*) لگائیں، **Stroke: Black (10%)**، **Shadow: Black (Opacity 80%, Blur 15, Distance 5)** اور **Glow: White یا Gold (Intensity 35, Range 40)** سیٹ کریں۔
3. **سٹیپ 3 (اینیمیشن):** ٹیکسٹ پر **In Animation → Fade In (0.4s)** یا **Pop / Bounce** لگائیں، اور ویڈیو کلپس کے درمیان **Black Fade** یا **Glitch / Zoom** ٹرانزیشن لگائیں۔
4. **سٹیپ 4 (ایچ ڈی ایکسپورٹ):** آخر میں **1080p Resolution، 60 FPS، اور High Code Rate (Bitrate)** پر ایکسپورٹ کریں۔`;
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
    const systemInstruction = `You are NOVA AI, a World-Class Multimodal AI Assistant, TikTok/YouTube Video Auditor, Intelligent Photo Editing AI, and Intelligent Font-Aware Video Generation AI.
${langInstruction}

${VIDEO_EXPERT_SYSTEM_PROMPT}

${FONT_VIDEO_SYSTEM_PROMPT}

${PHOTO_EDITING_SYSTEM_PROMPT}

CONVERSATIONAL RULES (STRICT MANDATES):
1. MATCH RESPONSE LENGTH TO USER INPUT:
   - For simple greetings like "Hi", "Hello", "سلام", "ہائے": Give a short, natural greeting (e.g. "سلام! میں نووا AI ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟").
   - For "How are you?" / "کیا حال ہے؟": Respond warmly and concisely (e.g. "میں بالکل ٹھیک ہوں، الحمدللہ! آپ سنائیں کیسے ہیں؟").
   - DO NOT output long introductions, feature menus, or unsolicited lectures on simple greetings.
   - ONLY list features or capabilities IF the user explicitly asks "What can you do?" / "What are your features?" / "تم کیا کیا کر سکتے ہو؟".

2. MULTIMODAL AUDITING (VIDEOS, PDFs, PHOTOS, CODE):
   - When a user uploads a Video (or asks to analyze a video, check TikTok/YouTube readiness, find mistakes in hooks/fonts/captions, or asks how to recreate its editing/fonts/backgrounds), ALWAYS follow the 6-part structure in VIDEO_EXPERT_SYSTEM_PROMPT (including the single All-in-One Error & Fix Master Chart, TikTok/YouTube verdict, target audience, best upload time, topic & hashtags, and exact font names + background sources + editing steps).
   - When a user uploads or asks to analyze a screenshot or photo (image/screenshot), you MUST:
     1. Deeply inspect and analyze the image/screenshot.
     2. Find exactly 5 to 8 issues, bugs, or visual/functional mistakes in the image/screenshot.
     3. For each issue/mistake, provide a clear, actionable solution/fix.
     4. Suggest general recommendations for visual, editing, or structural improvement.
     5. ALWAYS respond completely in Urdu, keeping your reply concise, clear, and highly helpful.
   - When a user uploads a PDF document, code file, or website link, deeply inspect and explain its contents, bugs, and fixes.

3. TRUTHFULNESS & MORAL CONSTITUTION:
   - Always stand for truth, logic, and ethical principles.`;

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
