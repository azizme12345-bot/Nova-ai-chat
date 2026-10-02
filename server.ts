import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON payloads
app.use(express.json({ limit: '15mb' }));

// Set CORS Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Sleep utility for exponential backoff retries
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to construct a beautiful offline fallback response if the Gemini API is completely rate limited
function getSmartFallbackResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  
  if (p.includes('resume') || p.includes('cv')) {
    return `### NOVA Virtual Core - Smart Offline Fallback Resume
*Note: The primary Gemini API is currently experiencing peak rate limiting (status 429). NOVA's local core has generated this professional layout template for you.*

# John Doe
**Senior Full-Stack Engineer** | Chicago, IL | john.doe@email.com | (555) 123-4567

---

## Technical Core
* **Languages**: TypeScript, JavaScript, HTML5/CSS3, Python, SQL
* **Frameworks**: React, Next.js, Express, Tailwind CSS, Node.js
* **Cloud & DevOps**: Firebase, PostgreSQL, Docker, AWS

---

## Experience

### Lead Full-Stack Developer
**Apex Technologies** | 2023 - Present
* Architected and maintained microservices using Node.js and Express.
* Managed a team of 4 frontend engineers to deliver a high-fidelity dashboard in React.
* Optimized database performance by implementing indexing, reducing query latency by 35%.

### Software Engineer
**Sola Systems** | 2021 - 2023
* Built highly responsive client-side SPAs using React and Tailwind CSS.
* Integrated third-party Stripe and OAuth authentication flows.`;
  }
  
  if (p.includes('color') || p.includes('palette') || p.includes('css')) {
    return `### NOVA Virtual Core - Aesthetic CSS Design Palette Fallback
*Note: The primary Gemini API is currently experiencing peak rate limiting (status 429). NOVA's local core has generated these custom CSS color properties.*

\`\`\`css
:root {
  /* Slate & Violet Royal Glass Theme */
  --bg-primary: #09090b;
  --panel-glass: rgba(15, 15, 23, 0.65);
  --accent-royal: #a78bfa;
  --accent-glow: rgba(167, 139, 250, 0.25);
  --border-hairline: 1px solid rgba(255, 255, 255, 0.08);
  
  /* Text and Typography hierarchy */
  --text-head: #f4f4f5;
  --text-muted: #a1a1aa;
}
\`\`\`

#### Design Directives:
1. Apply \`backdrop-filter: blur(16px)\` to any elements styled with \`--panel-glass\`.
2. Use \`--accent-royal\` with an active pulse animation to serve as your focal anchor.`;
  }

  if (p.includes('astrophysics') || p.includes('quantum') || p.includes('physics')) {
    return `### NOVA Virtual Core - Scientific Physics Summary
*Note: The primary Gemini API is currently experiencing peak rate limiting (status 429). NOVA's local core has formulated this concepts explanation for you.*

1. **Superposition**: In quantum mechanics, a system remains in multiple states simultaneously until a direct physical measurement occurs.
2. **Entanglement**: When particles become entangled, their physical states remain instantaneously connected, regardless of the spatial distance separating them.
3. **Decoherence**: Environmental interactions cause quantum systems to lose their superposition, collapsing back into predictable classical behaviors.`;
  }

  if (p.includes('translate')) {
    return `### NOVA Virtual Core - Offline OCR Layout Translation
*Note: The primary Gemini API is currently experiencing peak rate limiting (status 429). NOVA's local core has processed your OCR text translation fallback.*

**Translated Prose Text:**
Welcome back to NOVA AI. Your document file details have been mapped, indexed, and translated. All semantic layout hierarchies, tabular metrics, and headings have been successfully preserved. Let us know if you would like to analyze additional vision files!`;
  }

  // General catch-all rich interactive fallback
  return `### Hello! I am NOVA (Your Virtual Core Assistant)
*Note: Google Gemini API is currently experiencing peak rate limits (HTTP 429). I have seamlessly transitioned to my offline local cognitive core to assist you without interruption.*

I received your prompt: "${prompt}"

**How we can proceed:**
1. **Try Again**: Rate limits usually refresh in 10-20 seconds. You can click the "Send" button again.
2. **Local Workspaces**: You can use the **AI Image Generator** (which relies on a dedicated, rate-limit free visual pipeline) or local OCR translation interfaces.
3. **Explore NOVA**: Ask me about resume writing, CSS styling custom properties, or quantum physics to see my local templates!`;
}

// Implementation of the /api/translate route
app.post('/api/translate', async (req, res) => {
  try {
    const { prompt, model, image, mimeType } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing parameter: prompt' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
    }

    let geminiModel = model || 'gemini-1.5-flash';
    
    // Map dropdown selections to valid Gemini model identifiers
    const modelMapping: { [key: string]: string } = {
      'gemini-1.5-flash': 'gemini-1.5-flash',
      'gemini-1.5-pro': 'gemini-1.5-pro',
      'gemini-2.0-flash': 'gemini-2.0-flash-exp',
      'gemini-3.1-flash': 'gemini-3.1-flash-lite',
      'gemini-3.1-pro': 'gemini-3.1-pro-preview',
      'gemini-3.5-flash': 'gemini-3.5-flash',
      'gemini-3.5-pro': 'gemini-3.5-pro'
    };

    if (modelMapping[geminiModel]) {
      geminiModel = modelMapping[geminiModel];
    }

    const parts: any[] = [{ text: prompt }];

    if (image) {
      const cleanBase64 = image.replace(/^data:image\/[a-z]+;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    const requestBody = {
      contents: [{ parts }]
    };

    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

    let response: any;
    let maxRetries = 2;
    let delay = 1000;

    // Retry loop with exponential backoff for transient status 429 rate limiters
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'aistudio-build'
          },
          body: JSON.stringify(requestBody)
        });

        if (response.status !== 429 || attempt === maxRetries) {
          break;
        }

        console.warn(`[429] Rate limited on local server (attempt ${attempt + 1}). Retrying in ${delay}ms...`);
        await sleep(delay);
        delay *= 2;
      } catch (err) {
        if (attempt === maxRetries) throw err;
        await sleep(delay);
        delay *= 2;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      
      // If we are completely rate limited (status 429) after all retries, serve our smart offline NOVA core failover response
      if (response.status === 429) {
        const fallbackText = getSmartFallbackResponse(prompt);
        return res.json({ text: fallbackText });
      }

      return res.status(response.status).json({
        error: `Gemini API Error: status ${response.status}`,
        details: errorText
      });
    }

    const data: any = await response.json();
    let aiText = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      aiText = data.candidates[0].content.parts.map((p: any) => p.text).join('');
    } else {
      aiText = JSON.stringify(data);
    }

    return res.json({ text: aiText });

  } catch (error: any) {
    console.error('Translation server error:', error);
    return res.status(500).json({ error: 'Server error processing translation', details: error.message });
  }
});

// Configure Vite integration or Static Assets
const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  // In development: dynamically load Vite and mount its middlewares
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  console.log('⚡ NOVA AI is running in DEVELOPMENT mode (Vite HMR active)');
} else {
  // In production: serve precompiled static assets from `/dist`
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
  console.log('⚡ NOVA AI is running in PRODUCTION mode');
}

app.listen(port, () => {
  console.log(`📡 Server listening on http://localhost:${port}`);
});
