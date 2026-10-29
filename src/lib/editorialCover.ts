import { GenerationRecord } from '../types';

export function generateEditorialCover(
  title: string, 
  category: string = 'General', 
  dateStr?: string, 
  platform: string = 'Trends Box Verified'
): string {
  const safeTitle = (title || "Nigeria Breaking News")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const safeCategory = (category || "GENERAL").toUpperCase();
  const safeDate = dateStr || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const safePlatform = platform.toUpperCase();

  const themeMap: Record<string, { bg1: string; bg2: string; accent: string; badgeBg: string; textAccent: string }> = {
    POLITICS: { bg1: "#140a10", bg2: "#260c18", accent: "#f43f5e", badgeBg: "#be123c", textAccent: "#fda4af" },
    TECHNOLOGY: { bg1: "#07131e", bg2: "#0c2438", accent: "#06b6d4", badgeBg: "#0e7490", textAccent: "#67e8f9" },
    ENTERTAINMENT: { bg1: "#160b1e", bg2: "#2a103a", accent: "#c084fc", badgeBg: "#7e22ce", textAccent: "#e9d5ff" },
    SPORTS: { bg1: "#061510", bg2: "#0b281d", accent: "#10b981", badgeBg: "#047857", textAccent: "#6ee7b7" },
    GENERAL: { bg1: "#0f1117", bg2: "#161b26", accent: "#38bdf8", badgeBg: "#1d4ed8", textAccent: "#bae6fd" },
  };

  const theme = themeMap[safeCategory] || themeMap.GENERAL;

  // Split title into lines (~34 chars per line)
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

export interface ConvertedSocialData {
  socialTitle: string;
  socialExcerpt: string;
  socialContent: string;
  keyPoints: string[];
  hashtags: string[];
}

export function convertBlogToSocial(item: GenerationRecord): ConvertedSocialData {
  // If item already has pre-generated social content from the enhanced engine, use it
  if (item.socialContent && item.socialTitle) {
    const rawContent = item.socialContent;
    const lines = rawContent.split('\n').map(l => l.trim()).filter(Boolean);
    const bullets = lines.filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*')).map(l => l.replace(/^[•\-*]\s*/, ''));
    
    return {
      socialTitle: item.socialTitle,
      socialExcerpt: item.excerpt,
      socialContent: item.socialContent,
      keyPoints: bullets.length > 0 ? bullets : [item.excerpt],
      hashtags: item.hashtags || ['#Nigeria', `#${item.category.replace(/\s+/g, '')}`, '#BreakingNews', '#TrendsBox']
    };
  }

  // Smart client-side extraction to match the exact social implementation
  const title = item.title.replace(/^[⚡\s]+/, '');
  const socialTitle = `⚡ ${title}`;

  // 1-2 sentence core details
  let coreSentence = item.excerpt?.trim();
  if (!coreSentence || coreSentence.length < 20) {
    const sentences = item.content.split(/(?<=[.?!])\s+/);
    coreSentence = sentences.slice(0, 2).join(' ');
  }

  // Extract key fact bullets from paragraphs
  const paragraphs = item.content
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 25 && !p.startsWith('#') && !p.startsWith('http') && !p.toLowerCase().includes('in conclusion'));

  const keyPoints: string[] = [];
  for (const p of paragraphs.slice(1, 5)) {
    const sent = p.split(/(?<=[.?!])\s+/)[0] || p;
    if (sent.length > 20 && !keyPoints.some(kp => kp.includes(sent.slice(0, 20)))) {
      keyPoints.push(sent.length > 125 ? sent.slice(0, 122) + '...' : sent);
    }
    if (keyPoints.length >= 3) break;
  }

  const categoryTag = `#${(item.category || 'News').replace(/\s+/g, '')}`;
  const hashtags = ['#Nigeria', categoryTag, '#TrendingNews', '#TrendsBox'];

  const bulletText = keyPoints.length > 0 ? keyPoints.map(k => `• ${k}`).join('\n') : '';
  const socialContent = `${coreSentence}\n\n${bulletText ? `${bulletText}\n\n` : ''}${hashtags.join(' ')}`;

  return {
    socialTitle,
    socialExcerpt: coreSentence,
    socialContent,
    keyPoints: keyPoints.length > 0 ? keyPoints : [coreSentence],
    hashtags
  };
}
