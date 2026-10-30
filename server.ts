import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { tavily } from "@tavily/core";
import { GoogleGenAI } from "@google/genai";
import { extractArticleImage, buildEditorialImagePrompt } from "./src/lib/articleImageHelper";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateEditorialCover(title: string, category: string, dateStr: string, platform?: string): string {
  // Clean and escape XML entities in title
  const safeTitle = (title || "Nigeria Breaking News")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const safeCategory = (category || "GENERAL").toUpperCase();
  const safeDate = dateStr || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const safePlatform = (platform || "TRENDS BOX VERIFIED").toUpperCase();

  // Color schemes based on category
  const themeMap: Record<string, { bg1: string; bg2: string; accent: string; badgeBg: string; textAccent: string }> = {
    POLITICS: { bg1: "#140a10", bg2: "#260c18", accent: "#f43f5e", badgeBg: "#be123c", textAccent: "#fda4af" },
    TECHNOLOGY: { bg1: "#07131e", bg2: "#0c2438", accent: "#06b6d4", badgeBg: "#0e7490", textAccent: "#67e8f9" },
    ENTERTAINMENT: { bg1: "#160b1e", bg2: "#2a103a", accent: "#c084fc", badgeBg: "#7e22ce", textAccent: "#e9d5ff" },
    SPORTS: { bg1: "#061510", bg2: "#0b281d", accent: "#10b981", badgeBg: "#047857", textAccent: "#6ee7b7" },
    GENERAL: { bg1: "#0f1117", bg2: "#161b26", accent: "#38bdf8", badgeBg: "#1d4ed8", textAccent: "#bae6fd" },
  };

  const theme = themeMap[safeCategory] || themeMap.GENERAL;

  // Split title into lines (max ~34 chars per line for bold typography)
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
    
    <!-- Background Base -->
    <rect width="1200" height="630" fill="url(#bgGrad)"/>
    <rect width="1200" height="630" fill="url(#grid)"/>
    <circle cx="920" cy="180" r="480" fill="url(#glow)"/>
    
    <!-- Top Header Bar -->
    <g transform="translate(80, 80)">
      <rect x="0" y="0" width="140" height="34" rx="17" fill="${theme.badgeBg}" opacity="0.95"/>
      <text x="70" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="2">${safeCategory}</text>
      
      <circle cx="165" cy="17" r="3.5" fill="rgba(255,255,255,0.4)"/>
      <text x="185" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="12" font-weight="700" fill="rgba(255,255,255,0.7)" letter-spacing="1.5">TRENDS BOX EDITORIAL</text>
      
      <text x="1040" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.45)" text-anchor="end" letter-spacing="1">${safeDate}</text>
    </g>

    <!-- Main Headline Text (Matches the exact news headline) -->
    <g transform="translate(80, 220)">
      ${lines.map((line, i) => `
        <text x="0" y="${i * 74}" font-family="'Playfair Display', Georgia, serif" font-size="52" font-weight="800" fill="#ffffff" letter-spacing="-0.5">
          ${line}
        </text>
      `).join('')}
    </g>
    
    <!-- Editorial Accent Line -->
    <rect x="80" y="475" width="140" height="5" rx="2.5" fill="${theme.accent}"/>

    <!-- Footer Bar -->
    <g transform="translate(80, 540)">
      <circle cx="6" cy="6" r="5" fill="${theme.accent}"/>
      <circle cx="6" cy="6" r="10" fill="${theme.accent}" opacity="0.2"/>
      <text x="28" y="11" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="13" font-weight="700" fill="${theme.textAccent}" letter-spacing="1.2">${safePlatform}</text>
      <text x="1040" y="11" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="12" font-weight="500" fill="rgba(255,255,255,0.35)" text-anchor="end">NIGERIA'S REAL-TIME NEWS AGGREGATOR</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Local proxy for Netlify Functions to support AI Studio preview
  app.post("/.netlify/functions/generate", async (req, res) => {
    try {
      const { prompt, genType, category, recentTitles } = req.body;
      const groqKey = process.env.GROQ_API_KEY;
      const tavilyKey = process.env.TAVILY_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

      if (!groqKey || !tavilyKey) {
        return res.status(500).json({ 
          error: "Missing API Keys. Please set GROQ_API_KEY and TAVILY_API_KEY in the Secrets panel." 
        });
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

      // Helper: Verify if a URL points directly to an individual news article (not category, tag, archive, or homepage)
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

      // 1. Search latest breaking Nigerian news with topic: "news" and filter strictly for direct articles
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

        // Keep strictly direct article posts (exclude homepages, section archives, tag pages)
        let directArticles = (searchResult.results || []).filter(r => isDirectArticleUrl(r.url));

        // If fewer than 3 direct articles, run a targeted fallback search specifically for articles
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

        // Clean all URLs to guarantee direct navigation without tracking parameters
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
      } catch (e) {
        console.error("Local search failed:", e);
      }

      // Build duplicate avoidance instruction
      const recentTitlesList = Array.isArray(recentTitles) && recentTitles.length > 0
        ? `\n\n      DUPLICATE AVOIDANCE: The user has already generated content with these titles. You MUST choose a DIFFERENT story/topic:\n${recentTitles.map((t: string) => `      - "${t}"`).join('\n')}`
        : '';

      // 2. Upgraded Reasoning Algorithm Engine
      const systemPrompt = `You are an elite Nigerian senior investigative journalist, editor-in-chief, and social media news strategist.
Your task is to analyze breaking news from today (${currentDate}) and transform raw news data into a masterful, authentic editorial piece with genuine human delivery.

CORE EDITORIAL & REASONING PRINCIPLES:
1. RECENCY & FACTUAL RIGOR:
   - You MUST anchor strictly to news from TODAY (${currentDate}). Never report stale news from weeks ago.
   - Rely strictly on verifiable facts, figures, names, and quotes provided in the search context. Do not hallucinate or invent statements.
2. HUMAN-LIKE DELIVERY (NO AI CLICHES):
   - Write with the authoritative, engaging cadence of a premier Nigerian news columnist.
   - BANNED CLICHES: Never use robotic AI filler phrases like "In a pivotal move", "In a significant development", "It is worth noting", "Only time will tell", "A testament to", "In conclusion", "Fast forward to today", or "Amidst growing concerns".
   - Employ active verbs, compelling storytelling, varied sentence pacing, and authentic Nigerian context (currency symbols, locations, ministries, public sentiment).

TARGET FORMAT: ${isSocial ? 'SOCIAL MEDIA CONTENT' : 'FULL BLOG EDITORIAL'}

${isSocial ? `
SPECIFIC SOCIAL FORMAT REQUIREMENTS:
- TITLE: Punchy, urgent, scroll-stopping headline under 12 words with an active hook (e.g. "⚡ FG Discloses Key Terms in ₦4.2T Infrastructure Bond").
- EXCERPT: Exactly 1 single, high-impact sentence delivering the central takeaway.
- CONTENT:
  * First paragraph: Exactly 1-2 crisp, punchy sentences detailing the breaking event and what it means right now.
  * Second paragraph: 2-3 bullet points of critical figures/facts (formatted with •).
  * Third line: 3-4 trending Nigerian hashtags (e.g., #Nigeria #Lagos #${currentCategory.replace(/\s+/g, '')} #TrendsBox).
` : `
SPECIFIC BLOG EDITORIAL REQUIREMENTS:
- TITLE: Authoritative, compelling headline specific to the story (e.g., "Inside the ₦4.2T Infrastructure Deal: Why Lagos-Calabar Highway Is at the Center").
- EXCERPT: A single, elegant, sophisticated sentence capturing the core significance.
- CONTENT: Complete investigative article structured into logical narrative sections:
  * An immediate opening hook revealing the breaking event.
  * Deep investigative reporting with specific figures, dates, and quotes from verified sources.
  * Practical implications for Nigerian citizens, businesses, and policymakers.
  * Forward-looking perspective without generic conclusions.
- SOCIAL COMPANION (REQUIRED): Always provide 'socialTitle', 'socialContent' (1-2 crisp sentences + key bullet takeaways + hashtags) and 'hashtags' so this blog can be seamlessly converted to social media format!
`}

OUTPUT FORMAT:
Return ONLY a valid JSON object with the following fields:
- "title": string (the headline)
- "excerpt": string (1 crisp sentence)
- "content": string (the full formatted content)
- "relevantSourceIds": array of numbers matching the [Source X] IDs
- "socialTitle": string (punchy social headline)
- "socialContent": string (the 1-2 sentence core insight + bullet takeaways + hashtags)
- "hashtags": array of strings (e.g. ["#Nigeria", "#${currentCategory.replace(/\s+/g, '')}", "#TrendsBox"])${recentTitlesList}`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context ? `Context: ${context}\n\nPrompt: ${prompt}` : prompt }
        ],
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Filter sources to only include those the model found relevant
      let filteredSources = sources;
      if (data.relevantSourceIds && Array.isArray(data.relevantSourceIds)) {
        filteredSources = sources.filter(s => data.relevantSourceIds.includes(s.id));
      }
      if (filteredSources.length === 0 && sources.length > 0) {
        filteredSources = [sources[0]];
      }

      // 3. Context-Aware Headline-Matched Cover Image Engine
      // Solves:
      // A) Mismatched political figures on entertainment/sports (e.g. Tinubu on Burna Boy)
      // B) Fake hallucinated faces/caricatures for deceased ministers, victims, or celebrities (e.g. random smiling woman for Toluwanisings)
      let imageUrl = "";

      // Step 1: Extract authentic newsroom press photograph directly from the original article post
      // Journalists publish the genuine photo of Burna Boy or the memorial photo of Toluwanisings in og:image
      for (const source of filteredSources.slice(0, 3)) {
        if (source.url && isDirectArticleUrl(source.url)) {
          try {
            const articlePhoto = await extractArticleImage(source.url, 2500);
            if (articlePhoto) {
              imageUrl = articlePhoto;
              break;
            }
          } catch (e) {
            console.warn("Direct article photo extraction skipped for:", source.url, e);
          }
        }
      }

      // Step 2: Context-Aware Editorial AI Image Generation (with Strict Negative Constraints)
      // If no authentic newsroom photo could be retrieved directly:
      // We prompt Gemini using buildEditorialImagePrompt.
      // CRITICAL JOURNALISM CONSTRAINTS:
      // If the headline is about a victim, tragedy, deceased person (like Toluwanisings), or specific celebrity (like Burna Boy):
      // - Absolutely NO fake faces, smiling people, or hallucinated human likenesses!
      // - For tributes/mourning: Dignified memorial warm amber spotlight on acoustic instruments, microphone stand, candles & flowers.
      // - For awards: Gleaming golden award trophy, red carpet gala stage lights, camera flashes.
      const trimmedGeminiKey = (geminiKey || "").trim();
      if (!imageUrl && trimmedGeminiKey && trimmedGeminiKey.length > 10 && trimmedGeminiKey !== "undefined" && trimmedGeminiKey !== "placeholder") {
        try {
          const genAI = new GoogleGenAI({ 
            apiKey: trimmedGeminiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build'
              }
            }
          });

          const { prompt: imagePrompt } = buildEditorialImagePrompt(data.title, data.excerpt || "", currentCategory);

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
      // NEVER blindly take searchImages[0] (which caused President Tinubu to show on Burna Boy's Ballon d'Or story!)
      // ONLY accept an image from Tavily search results if its URL specifically matches the news subject's name or keywords.
      if (!imageUrl && searchImages.length > 0) {
        const headlineWords = data.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length >= 4);
        const verifiedKeywordMatch = searchImages.find(img => {
          if (typeof img !== 'string') return false;
          const lower = img.toLowerCase();
          if (lower.includes('logo') || lower.includes('icon') || lower.includes('avatar') || lower.includes('advert')) return false;
          // Reject photos of known political figures if the article is about sports or entertainment
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
      // Guaranteed 100% matched to the headline, branded, zero wrong faces, zero hallucinations.
      if (!imageUrl) {
        const topPlatform = filteredSources[0]?.platform || "Trends Box Verified";
        imageUrl = generateEditorialCover(data.title, currentCategory, currentDate, topPlatform);
      }

      res.json({ 
        ...data, 
        sources: filteredSources,
        imageUrl,
        category: currentCategory,
        type: genType
      });
    } catch (error: any) {
      console.error("Local function error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Convert any existing blog post into social format
  app.post("/api/convert-to-social", async (req, res) => {
    try {
      const { title, excerpt, content, category } = req.body;
      const groqKey = process.env.GROQ_API_KEY;

      if (!title || !content) {
        return res.status(400).json({ error: "Missing title or content" });
      }

      if (groqKey) {
        try {
          const groq = new OpenAI({
            apiKey: groqKey,
            baseURL: "https://api.groq.com/openai/v1",
          });

          const prompt = `Convert this Nigerian news blog article into an exact social media post.
Article Title: ${title}
Article Excerpt: ${excerpt || ''}
Article Content: ${content.substring(0, 2000)}

Requirements:
- socialTitle: Catchy, scroll-stopping headline under 12 words with an active hook (e.g. "⚡ ${title.replace(/^[⚡\s]+/, '')}").
- socialExcerpt: 1-sentence core takeaway.
- socialContent: Exactly 1-2 punchy sentences summarizing the core facts, followed by 2-3 bullet points with key numbers/details, and 3-4 trending hashtags (e.g. #Nigeria #${(category || 'News').replace(/\s+/g, '')} #TrendsBox).
- hashtags: array of hashtags.

Return ONLY a JSON object with fields: socialTitle, socialExcerpt, socialContent, hashtags.`;

          const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "openai/gpt-oss-120b",
            response_format: { type: "json_object" },
          });

          const data = JSON.parse(completion.choices[0].message.content || '{}');
          return res.json(data);
        } catch (groqErr) {
          console.warn("Groq conversion failed, using fallback:", groqErr);
        }
      }

      // Fast fallback if Groq is unavailable
      const firstSentence = excerpt || content.split('.')[0] + '.';
      const bullets = content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 20 && !l.startsWith('#'))
        .slice(1, 4)
        .map(l => `• ${l.length > 100 ? l.slice(0, 97) + '...' : l}`)
        .join('\n');

      const catTag = `#${(category || 'Nigeria').replace(/\s+/g, '')}`;
      const fallbackContent = `${firstSentence}\n\n${bullets ? `${bullets}\n\n` : ''}#Nigeria ${catTag} #TrendsBox #Breaking`;

      return res.json({
        socialTitle: title.startsWith('⚡') ? title : `⚡ ${title}`,
        socialExcerpt: firstSentence,
        socialContent: fallbackContent,
        hashtags: ['#Nigeria', catTag, '#TrendsBox']
      });
    } catch (err: any) {
      console.error("Convert error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Routes (Add any non-database routes here if needed)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Trends Box Server is running" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      // Fallback if dist doesn't exist yet
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
