import { OpenAI } from "openai";
import { tavily } from "@tavily/core";
import { GoogleGenAI } from "@google/genai";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

function generateEditorialCover(title: string, category: string, dateStr: string, platform?: string): string {
  const safeTitle = (title || "Nigeria Breaking News")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const safeCategory = (category || "GENERAL").toUpperCase();
  const safeDate = dateStr || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const safePlatform = (platform || "TRENDS BOX VERIFIED").toUpperCase();

  const themeMap: Record<string, { bg1: string; bg2: string; accent: string; badgeBg: string; textAccent: string }> = {
    POLITICS: { bg1: "#140a10", bg2: "#260c18", accent: "#f43f5e", badgeBg: "#be123c", textAccent: "#fda4af" },
    TECHNOLOGY: { bg1: "#07131e", bg2: "#0c2438", accent: "#06b6d4", badgeBg: "#0e7490", textAccent: "#67e8f9" },
    ENTERTAINMENT: { bg1: "#160b1e", bg2: "#2a103a", accent: "#c084fc", badgeBg: "#7e22ce", textAccent: "#e9d5ff" },
    SPORTS: { bg1: "#061510", bg2: "#0b281d", accent: "#10b981", badgeBg: "#047857", textAccent: "#6ee7b7" },
    GENERAL: { bg1: "#0f1117", bg2: "#161b26", accent: "#38bdf8", badgeBg: "#1d4ed8", textAccent: "#bae6fd" },
  };

  const theme = themeMap[safeCategory] || themeMap.GENERAL;

  const words = safeTitle.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > 34) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
      if (lines.length >= 3) break;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine && lines.length < 3) {
    lines.push(currentLine.trim());
  }
  if (words.length > 0 && lines.length === 3 && currentLine !== lines[2]) {
    lines[2] = lines[2].replace(/\s+\S+$/, '...');
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.bg1}"/>
        <stop offset="100%" stop-color="${theme.bg2}"/>
      </linearGradient>
      <radialGradient id="glow" cx="80%" cy="25%" r="65%">
        <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      </pattern>
    </defs>
    
    <rect width="1200" height="630" fill="url(#bgGrad)"/>
    <rect width="1200" height="630" fill="url(#grid)"/>
    <circle cx="920" cy="180" r="480" fill="url(#glow)"/>
    
    <g transform="translate(80, 80)">
      <rect x="0" y="0" width="140" height="34" rx="17" fill="${theme.badgeBg}" opacity="0.95"/>
      <text x="70" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="2">${safeCategory}</text>
      
      <circle cx="165" cy="17" r="3.5" fill="rgba(255,255,255,0.4)"/>
      <text x="185" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="12" font-weight="700" fill="rgba(255,255,255,0.7)" letter-spacing="1.5">TRENDS BOX EDITORIAL</text>
      
      <text x="1040" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.45)" text-anchor="end" letter-spacing="1">${safeDate}</text>
    </g>

    <g transform="translate(80, 220)">
      ${lines.map((line, i) => `
        <text x="0" y="${i * 74}" font-family="'Playfair Display', Georgia, serif" font-size="52" font-weight="800" fill="#ffffff" letter-spacing="-0.5">
          ${line}
        </text>
      `).join('')}
    </g>
    
    <rect x="80" y="475" width="140" height="5" rx="2.5" fill="${theme.accent}"/>

    <g transform="translate(80, 540)">
      <circle cx="6" cy="6" r="5" fill="${theme.accent}"/>
      <circle cx="6" cy="6" r="10" fill="${theme.accent}" opacity="0.2"/>
      <text x="28" y="11" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="700" fill="${theme.textAccent}" letter-spacing="1.2">${safePlatform}</text>
      <text x="1040" y="11" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="12" font-weight="500" fill="rgba(255,255,255,0.35)" text-anchor="end">NIGERIA'S REAL-TIME NEWS AGGREGATOR</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { prompt, genType = 'blog', category = 'General', recentTitles = [] } = await req.json();
    
    const groqKey = process.env.GROQ_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;
    const gatewayKey = process.env.NETLIFY_AI_GATEWAY_KEY || process.env.GEMINI_API_KEY;
    const gatewayUrl = process.env.NETLIFY_AI_GATEWAY_URL?.replace(/\/$/, "");

    if (!groqKey || !tavilyKey) {
      return json({ 
        error: "Missing API Keys. Please ensure GROQ_API_KEY and TAVILY_API_KEY are configured." 
      }, 500);
    }

    const groq = new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const tvly = tavily({ apiKey: tavilyKey });

    let context = "";
    let sources: any[] = [];
    let searchImages: string[] = [];
    const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const currentCategory = category || 'General';
    const isSocial = genType === 'social';

    try {
      const searchQuery = prompt.toLowerCase().includes("find the latest news") || prompt.toLowerCase().includes("latest news")
        ? `${currentCategory} breaking news published today ${currentDate} Nigeria Vanguard Punch Premium Times`
        : `${prompt} latest news today ${currentDate} Nigeria`;

      const searchResult = await tvly.search(searchQuery, {
        searchDepth: "advanced",
        maxResults: 6,
        includeImages: true,
        includeDomains: ["punchng.com", "vanguardngr.com", "dailypost.ng", "premiumtimesng.com", "guardian.ng", "thecable.ng", "thisdaylive.com"]
      });

      if (Array.isArray(searchResult.images) && searchResult.images.length > 0) {
        searchImages = searchResult.images
          .map((img: any) => typeof img === 'string' ? img : img?.url)
          .filter((url): url is string => typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://')));
      }

      context = `TODAY'S DATE: ${currentDate}\n\n` + searchResult.results.map((r, i) => `[Source ${i}] Title: ${r.title}\nContent: ${r.content}`).join("\n\n");

      sources = searchResult.results.map((r, i) => {
        let platform = 'Nigerian News';
        try {
          const url = new URL(r.url);
          const host = url.hostname.replace('www.', '').split('.')[0];
          const platformMap: Record<string, string> = {
            'punchng': 'The Punch',
            'vanguardngr': 'Vanguard',
            'dailypost': 'Daily Post',
            'premiumtimesng': 'Premium Times',
            'guardian': 'The Guardian NG',
            'independent': 'Independent',
            'thenationonlineng': 'The Nation',
            'thisdaylive': 'ThisDay',
            'thecable': 'TheCable'
          };
          platform = platformMap[host] || host.charAt(0).toUpperCase() + host.slice(1);
        } catch {
          platform = 'Verified Outlet';
        }

        return {
          id: i,
          name: r.title,
          platform,
          url: r.url
        };
      });
    } catch (searchErr) {
      console.error("Tavily search failed:", searchErr);
    }

    const recentTitlesList = Array.isArray(recentTitles) && recentTitles.length > 0
      ? `\n\n    DUPLICATE AVOIDANCE: The user has already generated content with these titles. You MUST choose a DIFFERENT story/topic from today:\n${recentTitles.map((t: string) => `    - "${t}"`).join('\n')}`
      : '';

    const systemPrompt = `You are Nigeria's foremost investigative journalist, senior news analyst, and editorial director.
Your mission is to analyze real-time raw news wire data and synthesize it into a compelling, authoritative journalistic report with completely natural, sophisticated human delivery.

REASONING & SYNTHESIS METHODOLOGY:
1. RECENCY & RELEVANCE: Analyze the provided news wire context. Select the SINGLE most significant, breaking, or trending story from TODAY (${currentDate}). Do NOT summarize outdated events from weeks ago.
2. RIGOROUS ACCURACY: Rely strictly on verified facts, figures, quotes, and names present in the context. Never fabricate details.
3. HUMAN-LIKE JOURNALISTIC DELIVERY:
   - Eliminate robotic transitions and AI clichés (do NOT use phrases like "In a fast-paced world", "It is worth noting", "In a significant development", "This marks a milestone", "Moreover", "Furthermore").
   - Write with the authoritative, engaging cadence of an investigative editor at Premium Times, The Economist, or BusinessDay.
   - Use varied sentence lengths, natural rhetorical transitions, and clear real-world stakes for Nigerian citizens and stakeholders.
4. FORMAT ADAPTATION (Target format: "${genType.toUpperCase()}"):
   - For 'social': Write a high-impact social news post. Include a viral, punchy headline, 1-2 sentence core hook, 3 bulleted key takeaways (with bullet points •), and 3-4 trending hashtags.
   - For 'blog': Write a comprehensive 3-to-4 paragraph investigative editorial article. Include an engaging opening hook, substantive factual analysis with quotes/figures, real-world Nigerian implications, and a forward-looking conclusion.
5. PAIRED SOCIAL POST GENERATION:
   - Regardless of whether the format is 'blog' or 'social', ALWAYS also generate a structured "socialContent" object so the article can instantly be converted and displayed as a social post.

OUTPUT FORMAT:
Return ONLY a valid JSON object with the following schema:
{
  "title": "Punchy, authoritative, specific headline",
  "excerpt": "A single, sophisticated sentence capturing the core significance of the story",
  "content": "The full text (${isSocial ? 'crisp social post with hook, bullets, and hashtags' : 'multi-paragraph narrative editorial article with deep analysis'})",
  "socialContent": {
    "headline": "Short, catchy headline optimized for social media feeds",
    "summary": "1-2 punchy sentences summarizing the core breaking news",
    "bulletPoints": [
      "Key fact or figure 1",
      "Key fact or figure 2",
      "Key fact or figure 3"
    ],
    "hashtags": ["#Nigeria", "#${currentCategory.replace(/\s+/g, '')}", "#TrendsBox", "#BreakingNews"]
  },
  "relevantSourceIds": [0, 1]
}${recentTitlesList}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context ? `Context: ${context}\n\nPrompt: ${prompt}` : prompt }
      ],
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content || '{}');

    let filteredSources = sources;
    if (data.relevantSourceIds && Array.isArray(data.relevantSourceIds)) {
      filteredSources = sources.filter(s => data.relevantSourceIds.includes(s.id));
    }
    if (filteredSources.length === 0 && sources.length > 0) {
      filteredSources = [sources[0]];
    }

    let imageUrl = "";

    // 1. Try Gemini image generation if gateway credentials are present
    if (gatewayKey) {
      try {
        const options: any = { apiKey: gatewayKey };
        if (gatewayUrl) options.httpOptions = { baseUrl: gatewayUrl };
        const genAI = new GoogleGenAI(options);
        const imgModel = await genAI.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: `A professional editorial journalistic news photograph directly illustrating the news story: "${data.title}". Context: ${data.excerpt}. Setting: Nigeria. Authentic photojournalism style, cinematic lighting, 16:9 aspect ratio, high resolution.` }]
          },
          config: { imageConfig: { aspectRatio: "16:9" } }
        });
        
        for (const part of imgModel.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (imgErr) {
        console.warn("Gemini image generation skipped, using headline cover:", imgErr);
      }
    }

    // 2. Real photo from Tavily search if available
    if (!imageUrl && searchImages.length > 0) {
      imageUrl = searchImages[0];
    }

    // 3. Fallback: Bespoke Editorial News Headline Cover
    if (!imageUrl) {
      const topPlatform = filteredSources[0]?.platform || "Trends Box Verified";
      imageUrl = generateEditorialCover(data.title, currentCategory, currentDate, topPlatform);
    }

    return json({ 
      ...data, 
      sources: filteredSources,
      imageUrl,
      category: currentCategory,
      type: genType
    });
  } catch (error: any) {
    console.error("Function execution error:", error);
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
};
