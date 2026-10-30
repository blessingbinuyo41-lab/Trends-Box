/**
 * Article Cover Image Extraction & Context-Aware Editorial Visual Engine
 * 
 * Solves:
 * 1. Mismatched Public Figures (e.g. Tinubu showing on Burna Boy award story) by extracting
 *    authentic verified newsroom photographs directly from the specific article URL, and banning
 *    unverified global search thumbnails.
 * 2. Inappropriate/Hallucinated AI Characters (e.g. random smiling woman for deceased gospel singer Toluwanisings)
 *    by enforcing strict editorial journalism negative constraints (zero fake portraits, zero generic people,
 *    and using respectful symbolic memorial scenes, award trophies, or press environments).
 */

export interface PromptClassification {
  prompt: string;
  isTragedyOrMourning: boolean;
  isCelebrityOrAward: boolean;
  isPoliticsOrGov: boolean;
  isEconomyOrBusiness: boolean;
  isSports: boolean;
}

/**
 * Extracts the authentic press photograph directly from a news article URL via its OpenGraph or Twitter Card meta tags.
 * Only reads the first ~35KB of HTML to ensure sub-second response without downloading whole web pages.
 */
export async function extractArticleImage(
  url: string,
  timeoutMs: number = 2500
): Promise<string | null> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
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

    // Match og:image or twitter:image tags
    const match = 
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

    if (match && match[1]) {
      let candidate = match[1].trim();
      if (candidate.startsWith('//')) {
        candidate = 'https:' + candidate;
      } else if (candidate.startsWith('/')) {
        const parsed = new URL(url);
        candidate = `${parsed.protocol}//${parsed.host}${candidate}`;
      }

      // Filter out low-quality assets (logos, icons, default placeholders, avatars)
      const lower = candidate.toLowerCase();
      const isBad = 
        lower.includes('logo') ||
        lower.includes('icon') ||
        lower.includes('avatar') ||
        lower.includes('favicon') ||
        lower.includes('default') ||
        lower.includes('placeholder') ||
        lower.includes('blank') ||
        lower.includes('spinner') ||
        lower.includes('theme') ||
        lower.includes('advert') ||
        lower.includes('ad-') ||
        lower.includes('1x1') ||
        lower.includes('pixel') ||
        lower.includes('widget') ||
        lower.endsWith('.svg');

      if (!isBad && (candidate.startsWith('http://') || candidate.startsWith('https://'))) {
        return candidate;
      }
    }
  } catch {
    // Network or timeout failure gracefully ignored
  }
  return null;
}

/**
 * Builds a context-aware editorial image prompt that eliminates AI hallucinations of fake faces,
 * mismatched public figures, or smiling people in tragedy/mourning reports.
 */
export function buildEditorialImagePrompt(
  title: string,
  excerpt: string = '',
  category: string = 'General'
): PromptClassification {
  const text = `${title} ${excerpt} ${category}`.toLowerCase();

  const isTragedyOrMourning = /\b(mourn|mourns|mourning|loss|death|dead|dies|died|killed|killings|tragedy|tragic|victim|victims|burial|funeral|late|passing|collapsed|explosion|crash|accident|fatal|slain|passed away)\b/i.test(text);
  const isCelebrityOrAward = /\b(ballon d'?or|award|awards|grammy|trophy|celebrity|artiste|singer|musician|actor|actress|burna|wizkid|davido|tiwa|asake|rema|hollywood|nollywood|concert|festival|honour|honored)\b/i.test(text);
  const isPoliticsOrGov = /\b(president|tinubu|governor|senate|senator|minister|ministry|federal government|fg|cabinet|assembly|court|supreme court|judiciary|police|military|lawmaker)\b/i.test(text);
  const isEconomyOrBusiness = /\b(naira|cbn|inflation|fx|dollar|economy|budget|gdp|tax|bank|oil|nnpc|refinery|dangote|stock|market|trade|revenue)\b/i.test(text);
  const isSports = /\b(football|soccer|super eagles|afcon|fifa|champions league|match|stadium|coach|arsenal|chelsea|epl|victor osimhen|lookman)\b/i.test(text);

  let visualDirection = '';

  if (isTragedyOrMourning) {
    visualDirection = `A deeply solemn, respectful, and dignified memorial photojournalistic composition. An empty performance stage or solemn podium illuminated by a single warm golden-amber spotlight cutting through gentle shadow. A vintage acoustic instrument, microphone stand, or podium in quiet silhouette, accompanied by dignified floral tributes and a soft warm memorial candle glow. Atmospheric silence, respectful news documentary depth. STRICT RULE: Absolutely NO human faces, NO portraits, NO caricatures, NO smiling people, and NO fake people.`;
  } else if (isCelebrityOrAward) {
    visualDirection = `A prestigious international awards gala and entertainment photojournalism composition. A gleaming golden prestigious award trophy standing majestically on an illuminated presentation plinth, surrounded by dramatic stage spotlights, red carpet gala ambiance, and soft glittering bokeh of flashing press cameras. High fashion, cinematic editorial luxury, 8k documentary capture. STRICT REQUIREMENT: Focus on the trophy, stage, spotlights, and prestigious setting. Absolutely NO fake human faces or distorted portraits.`;
  } else if (isPoliticsOrGov) {
    visualDirection = `An authoritative Nigerian governmental press room and state chamber setting. An official executive briefing podium flanked by national flags and state architectural columns, equipped with official broadcast microphones, bathed in dramatic press conference lighting. Serious documentary photojournalism, majestic depth. NO fake faces or caricatures.`;
  } else if (isEconomyOrBusiness) {
    visualDirection = `A high-level editorial financial photojournalism composition. High-tech financial charts and currency market analytical monitors in a modern African central banking headquarters or financial district skyline at twilight, sharp clean architectural lines, sophisticated corporate editorial lighting. NO fake portraits.`;
  } else if (isSports) {
    visualDirection = `A dramatic sports photojournalism scene. Floodlit premier stadium grass pitch under towering arena lights, a professional match ball resting on the turf, cinematic stadium mist and dramatic evening sports atmosphere. NO fake human face portraits.`;
  } else {
    visualDirection = `A premier editorial documentary photojournalism composition illustrating Nigerian news context. Authentic real-world setting, dramatic cinematic lighting, clean journalistic framing, rich textures, 8k resolution. STRICT REQUIREMENT: Absolutely NO fake human portraits or random faces. Focus on symbolic objects, professional environments, and editorial ambiance.`;
  }

  const prompt = `${visualDirection} Strictly illustrating the news headline: "${title}". Editorial news photojournalism aesthetic, 16:9 widescreen, hyper-realistic, no text, no floating letters, no watermarks, no logos, no fake smiling faces.`;

  return {
    prompt,
    isTragedyOrMourning,
    isCelebrityOrAward,
    isPoliticsOrGov,
    isEconomyOrBusiness,
    isSports
  };
}
