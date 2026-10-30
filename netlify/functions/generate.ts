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

    // Helper: Verify if a URL points directly to an individual news article
    const isDirectArticleUrl = (urlStr: string): boolean => {
      if (!urlStr || typeof urlStr !== 'string') return false;
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) return false;

      try {
        const url = new URL(urlStr);
        const path = url.pathname.replace(/\/+$/, '');
        if (!path || path === '' || path === '/') return false;

        const nonArticlePatterns = [
          /^\/(topics?|category|categories|tag|tags|all-posts|author|authors|archives?|feed|search|section|sections|hub|channels?)(\/|$)/i,
          /^\/(politics|business|entertainment|metro|sports|news|opinion|opinions|editorial|columns?|features?|headline|headlines|live|videos?|photos?|trending|latest|latest-news|breaking-news|top-stories|hot-news|all-news|special-reports|lifestyle)(\/?)$/i,
          /\/(category|categories|topics?|tags?|all-posts|section|sections)\//i,
          /\/page\/\d+/i,
          /\/wp-content\//i,
          /\/about(-us)?\/?$/i,
          /\/contact(-us)?\/?$/i,
          /\/privacy(-policy)?\/?$/i,
          /\/terms(-of-service)?\/?$/i
        ];
        for (const pat of nonArticlePatterns) {
          if (pat.test(path)) return false;
        }

        const segments = path.split('/').filter(Boolean);
        if (segments.length === 0) return false;

        const host = url.hostname.replace('www.', '').toLowerCase();
        const lastSegment = segments[segments.length - 1];

        // Premium Times: .../news/.../12345-slug.html
        if (host.includes('premiumtimesng.com')) {
          return (lastSegment.endsWith('.html') || lastSegment.endsWith('.htm')) && /\d+/.test(lastSegment);
        }

        // Vanguard: /202X/MM/...
        if (host.includes('vanguardngr.com')) {
          return segments.some(s => /^202\d$/.test(s)) && segments.length >= 3;
        }

        // Daily Post: /202X/MM/DD/...
        if (host.includes('dailypost.ng')) {
          return segments.some(s => /^202\d$/.test(s)) && segments.length >= 3;
        }

        // The Punch, TheCable, The Nation, Guardian NG, ThisDay, etc.
        const hyphenCount = (lastSegment.match(/-/g) || []).length;
        const hasArticleSlug = hyphenCount >= 2 && lastSegment.length >= 16;
        const hasArticleExt = lastSegment.endsWith('.html') || lastSegment.endsWith('.php');
        const hasArticleDate = segments.some(s => /^202\d$/.test(s));

        return hasArticleSlug || hasArticleExt || hasArticleDate;
      } catch {
        return false;
      }
    };

    const cleanArticleUrl = (urlStr: string): string => {
      try {
        const url = new URL(urlStr);
        url.search = '';
        url.hash = '';
        return url.toString().replace(/\/+$/, '/');
      } catch {
        return urlStr;
      }
    };

    const detectPlatform = (urlStr: string): { platform: string; reliabilityScore: number } => {
      try {
        const host = new URL(urlStr).hostname.replace('www.', '').toLowerCase();
        const outlets: Record<string, { platform: string; reliabilityScore: number }> = {
          'punchng.com': { platform: 'The Punch', reliabilityScore: 98 },
          'vanguardngr.com': { platform: 'Vanguard', reliabilityScore: 97 },
          'premiumtimesng.com': { platform: 'Premium Times', reliabilityScore: 99 },
          'dailypost.ng': { platform: 'Daily Post', reliabilityScore: 96 },
          'thecable.ng': { platform: 'TheCable', reliabilityScore: 98 },
          'guardian.ng': { platform: 'The Guardian NG', reliabilityScore: 97 },
          'thenationonlineng.net': { platform: 'The Nation', reliabilityScore: 96 },
          'thisdaylive.com': { platform: 'ThisDay', reliabilityScore: 96 },
          'businessday.ng': { platform: 'BusinessDay', reliabilityScore: 98 },
          'independent.ng': { platform: 'Independent', reliabilityScore: 95 }
        };
        for (const [d, meta] of Object.entries(outlets)) {
          if (host.includes(d)) return meta;
        }
        const firstPart = host.split('.')[0];
        return { platform: firstPart.charAt(0).toUpperCase() + firstPart.slice(1), reliabilityScore: 95 };
      } catch {
        return { platform: 'Verified Outlet', reliabilityScore: 95 };
      }
    };

    const extractArticleImage = async (url: string, timeoutMs: number = 2500): Promise<string | null> => {
      if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          }
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const reader = res.body?.getReader();
        if (!reader) return null;
        let html = '';
        const decoder = new TextDecoder('utf-8');
        while (html.length < 35000) {
          const { done, value } = await reader.read();
          if (done) break;
          html += decoder.decode(value, { stream: true });
          if (html.includes('</head>')) break;
        }
        try { reader.cancel(); } catch (_) {}
        const match = 
          html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
          html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
        if (match && match[1]) {
          let candidate = match[1].trim();
          if (candidate.startsWith('//')) candidate = 'https:' + candidate;
          else if (candidate.startsWith('/')) {
            const parsed = new URL(url);
            candidate = `${parsed.protocol}//${parsed.host}${candidate}`;
          }
          const lower = candidate.toLowerCase();
          const isBad = lower.includes('logo') || lower.includes('icon') || lower.includes('avatar') || lower.includes('favicon') || lower.includes('default') || lower.includes('placeholder') || lower.includes('spinner') || lower.includes('theme') || lower.includes('advert') || lower.includes('1x1') || lower.endsWith('.svg');
          if (!isBad && (candidate.startsWith('http://') || candidate.startsWith('https://'))) {
            return candidate;
          }
        }
      } catch (_) {}
      return null;
    };

    const buildEditorialImagePrompt = (title: string, excerpt: string = '', cat: string = 'General'): string => {
      const text = `${title} ${excerpt} ${cat}`.toLowerCase();
      const isTragedyOrMourning = /\b(mourn|mourns|mourning|loss|death|dead|dies|died|killed|killings|tragedy|tragic|victim|victims|burial|funeral|late|passing|collapsed|explosion|crash|accident|fatal|slain)\b/i.test(text);
      const isCelebrityOrAward = /\b(ballon d'?or|award|awards|grammy|trophy|celebrity|artiste|singer|musician|actor|actress|burna|wizkid|davido|tiwa|asake|rema|hollywood|nollywood|concert|festival)\b/i.test(text);
      const isPolitics = /\b(president|tinubu|governor|senate|senator|minister|ministry|federal government|fg|cabinet|assembly|court|supreme court|judiciary|police|military)\b/i.test(text);
      const isEconomy = /\b(naira|cbn|inflation|fx|dollar|economy|budget|gdp|tax|bank|oil|nnpc|refinery|dangote|stock|market|trade)\b/i.test(text);
      const isSports = /\b(football|soccer|super eagles|afcon|fifa|champions league|match|stadium|coach|arsenal|chelsea|epl)\b/i.test(text);

      let visual = '';
      if (isTragedyOrMourning) {
        visual = `A deeply solemn, respectful, and dignified memorial photojournalistic composition. An empty performance stage or solemn podium illuminated by a single warm golden-amber spotlight. A vintage acoustic instrument, microphone stand, or podium in quiet silhouette, accompanied by dignified floral tributes and a soft warm memorial candle glow. Atmospheric silence, respectful news documentary depth. STRICT RULE: Absolutely NO human faces, NO portraits, NO caricatures, NO smiling people, and NO fake people.`;
      } else if (isCelebrityOrAward) {
        visual = `A prestigious international awards gala and entertainment photojournalism composition. A gleaming golden prestigious award trophy standing majestically on an illuminated presentation plinth, surrounded by dramatic stage spotlights, red carpet gala ambiance, and soft glittering bokeh of flashing press cameras. High fashion, cinematic editorial luxury, 8k documentary capture. STRICT REQUIREMENT: Focus on the trophy, stage, spotlights, and prestigious setting. Absolutely NO fake human faces or distorted portraits.`;
      } else if (isPolitics) {
        visual = `An authoritative Nigerian governmental press room and state chamber setting. An official executive briefing podium flanked by national flags and state architectural columns, equipped with official broadcast microphones, bathed in dramatic press conference lighting. Serious documentary photojournalism, majestic depth. NO fake faces or caricatures.`;
      } else if (isEconomy) {
        visual = `A high-level editorial financial photojournalism composition. High-tech financial charts and currency market analytical monitors in a modern African central banking headquarters or financial district skyline at twilight, sharp clean architectural lines, sophisticated corporate editorial lighting. NO fake portraits.`;
      } else if (isSports) {
        visual = `A dramatic sports photojournalism scene. Floodlit premier stadium grass pitch under towering arena lights, a professional match ball resting on the turf, cinematic stadium mist and dramatic evening sports atmosphere. NO fake human face portraits.`;
      } else {
        visual = `A premier editorial documentary photojournalism composition illustrating Nigerian news context. Authentic real-world setting, dramatic cinematic lighting, clean journalistic framing, rich textures, 8k resolution. STRICT REQUIREMENT: Absolutely NO fake human portraits or random faces. Focus on symbolic objects, professional environments, and editorial ambiance.`;
      }
      return `${visual} Strictly illustrating the news headline: "${title}". Editorial news photojournalism aesthetic, 16:9 widescreen, hyper-realistic, no text, no floating letters, no watermarks, no logos, no fake smiling faces.`;
    };

    try {
      const searchQuery = prompt.toLowerCase().includes("find the latest news") || prompt.toLowerCase().includes("latest news")
        ? `${currentCategory} breaking news published today ${currentDate} Nigeria Punch Vanguard Premium Times`
        : `${prompt} latest news today ${currentDate} Nigeria`;

      const searchResult = await tvly.search(searchQuery, {
        topic: "news",
        searchDepth: "advanced",
        maxResults: 16,
        includeImages: true,
        includeDomains: ["punchng.com", "vanguardngr.com", "dailypost.ng", "premiumtimesng.com", "guardian.ng", "thecable.ng", "thenationonlineng.net", "thisdaylive.com"]
      });

      if (Array.isArray(searchResult.images) && searchResult.images.length > 0) {
        searchImages = searchResult.images
          .map((img: any) => typeof img === 'string' ? img : img?.url)
          .filter((url): url is string => typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://')));
      }

      // Filter strictly for direct news articles
      let directArticles = (searchResult.results || []).filter(r => isDirectArticleUrl(r.url));

      if (directArticles.length < 3) {
        try {
          const fallbackSearch = await tvly.search(`${currentCategory} Nigeria breaking news story today ${currentDate} Punch Vanguard TheCable`, {
            topic: "news",
            searchDepth: "advanced",
            maxResults: 10,
            includeDomains: ["punchng.com", "vanguardngr.com", "dailypost.ng", "premiumtimesng.com", "guardian.ng", "thecable.ng"]
          });
          const secondaryDirect = (fallbackSearch.results || []).filter(r => isDirectArticleUrl(r.url));
          const seenUrls = new Set(directArticles.map(a => cleanArticleUrl(a.url)));
          for (const item of secondaryDirect) {
            const cleaned = cleanArticleUrl(item.url);
            if (!seenUrls.has(cleaned)) {
              seenUrls.add(cleaned);
              directArticles.push(item);
            }
          }
        } catch (secErr) {
          console.warn("Secondary search skipped:", secErr);
        }
      }

      const finalCandidates = directArticles.map(r => ({
        ...r,
        url: cleanArticleUrl(r.url),
        meta: detectPlatform(r.url)
      }));

      context = `TODAY'S DATE: ${currentDate}\n\n` + finalCandidates.slice(0, 6).map((r, i) => {
        return `[Source ${i}] Platform: ${r.meta.platform}\nTitle: ${r.title}\nArticle URL: ${r.url}\nContent: ${r.content}`;
      }).join("\n\n");

      sources = finalCandidates.slice(0, 6).map((r, i) => ({
        id: i,
        name: r.title,
        platform: r.meta.platform,
        url: r.url,
        reliabilityScore: r.meta.reliabilityScore
      }));
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

    // Step 1: Extract authentic newsroom press photograph directly from the original article post
    for (const source of filteredSources.slice(0, 3)) {
      if (source.url && isDirectArticleUrl(source.url)) {
        try {
          const articlePhoto = await extractArticleImage(source.url, 2500);
          if (articlePhoto) {
            imageUrl = articlePhoto;
            break;
          }
        } catch (_) {}
      }
    }

    // Step 2: Context-Aware Editorial AI Image Generation with Strict Negative Constraints
    // Never generate fake faces or hallucinated human likenesses for victims or named celebrities
    if (!imageUrl && gatewayKey) {
      try {
        const options: any = { apiKey: gatewayKey };
        if (gatewayUrl) options.httpOptions = { baseUrl: gatewayUrl };
        const genAI = new GoogleGenAI(options);
        const imagePrompt = buildEditorialImagePrompt(data.title, data.excerpt || "", currentCategory);
        const imgModel = await genAI.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: imagePrompt }]
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
        console.warn("Gemini context-aware image generation skipped:", imgErr);
      }
    }

    // Step 3: Strictly Guarded Secondary Search Images
    // Never take searchImages[0] blindly (blocks Tinubu or political thumbnails on entertainment/sports)
    if (!imageUrl && searchImages.length > 0) {
      const headlineWords = data.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length >= 4);
      const verifiedKeywordMatch = searchImages.find(img => {
        if (typeof img !== 'string') return false;
        const lower = img.toLowerCase();
        if (lower.includes('logo') || lower.includes('icon') || lower.includes('avatar') || lower.includes('advert')) return false;
        if ((currentCategory.toLowerCase() === 'entertainment' || currentCategory.toLowerCase() === 'sports') &&
            (lower.includes('tinubu') || lower.includes('shettima') || lower.includes('buhari') || lower.includes('atiku') || lower.includes('wike'))) {
          return false;
        }
        return headlineWords.some((w: string) => lower.includes(w));
      });
      if (verifiedKeywordMatch) {
        imageUrl = verifiedKeywordMatch;
      }
    }

    // Step 4: Bespoke Editorial News Headline Cover
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
