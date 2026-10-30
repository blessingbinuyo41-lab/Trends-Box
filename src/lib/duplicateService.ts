import { supabase } from './supabase';
import { GenerationRecord, Category } from '../types';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarityScore: number;
  matchedRecord?: GenerationRecord;
  isCurrentUser: boolean;
  timeAgoText: string;
  matchedKeywords: string[];
}

/**
 * Common English and Nigerian news stop words to strip before extracting core topic entities
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under', 'above',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our',
  'he', 'him', 'his', 'she', 'her', 'you', 'your', 'who', 'whom', 'whose', 'which', 'what',
  'news', 'today', 'breaking', 'report', 'says', 'amid', 'over', 'new', 'latest', 'how', 'why',
  'state', 'nigeria', 'nigerian', 'government', 'president', 'announced', 'directs', 'reveals',
  'generate', 'post', 'blog', 'article', 'find', 'popular', 'stories', 'headline', 'headlines'
]);

/**
 * Extracts normalized core subject keywords from a headline or topic input.
 */
export function extractSubjectKeywords(text: string): string[] {
  if (!text) return [];

  // Remove URLs, punctuation, special symbols
  const clean = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = clean.split(' ');
  const keywords = words.filter(word => {
    if (word.length <= 2) return false;
    if (STOP_WORDS.has(word)) return false;
    // Strip pure digits unless it's a specific year or key term
    if (/^\d+$/.test(word) && word.length < 4) return false;
    return true;
  });

  return Array.from(new Set(keywords));
}

/**
 * Calculates Jaccard & entity overlap similarity score between 0 and 1
 */
export function calculateKeywordSimilarity(keywordsA: string[], keywordsB: string[]): {
  score: number;
  common: string[];
} {
  if (keywordsA.length === 0 || keywordsB.length === 0) {
    return { score: 0, common: [] };
  }

  const setB = new Set(keywordsB);
  const common = keywordsA.filter(w => setB.has(w));

  // If there are key named entities matching (e.g. 2 or more distinct keywords)
  const union = new Set([...keywordsA, ...keywordsB]);
  const score = common.length / Math.min(keywordsA.length, keywordsB.length);

  return { score, common };
}

/**
 * Format relative time (e.g. "2 hours ago", "Yesterday at 4:15 PM")
 */
export function formatTimeAgo(isoString: string): string {
  try {
    const past = new Date(isoString).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - past);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 5) return 'Just moments ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  } catch {
    return 'Recently';
  }
}

/**
 * Fetches platform-wide articles from the last 24 to 48 hours to check for duplicates
 */
export async function fetchRecentPlatformArticles(
  hours: number = 48,
  category?: Category
): Promise<GenerationRecord[]> {
  const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  try {
    let query = supabase
      .from('history')
      .select('*')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(60);

    if (category && category !== 'General') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      imageUrl: item.image_url,
      timestamp: item.created_at || new Date().toISOString(),
      sources: typeof item.sources === 'string' ? JSON.parse(item.sources) : (item.sources || [])
    }));
  } catch (err) {
    console.warn('Supabase platform-wide recent articles check skipped (fallback to local history):', err);
    try {
      const local = JSON.parse(localStorage.getItem('trendsbox_history') || '[]');
      const sinceTime = Date.now() - hours * 60 * 60 * 1000;
      return local.filter((h: any) => {
        const itemTime = new Date(h.timestamp || h.created_at || 0).getTime();
        return itemTime >= sinceTime && (!category || category === 'General' || h.category === category);
      });
    } catch {
      return [];
    }
  }
}

/**
 * Checks if a given topic or headline has already been covered in the last 24 to 48 hours.
 */
export async function checkTopicDuplicate(
  candidateTitleOrInput: string,
  category: Category,
  currentUserId?: string | null,
  timeframeHours: number = 48
): Promise<DuplicateCheckResult> {
  if (!candidateTitleOrInput || candidateTitleOrInput.trim().length < 5) {
    return {
      isDuplicate: false,
      similarityScore: 0,
      isCurrentUser: false,
      timeAgoText: '',
      matchedKeywords: []
    };
  }

  const inputKeywords = extractSubjectKeywords(candidateTitleOrInput);
  if (inputKeywords.length === 0) {
    return {
      isDuplicate: false,
      similarityScore: 0,
      isCurrentUser: false,
      timeAgoText: '',
      matchedKeywords: []
    };
  }

  // Fetch recent articles from Supabase (or local fallback)
  const recentArticles = await fetchRecentPlatformArticles(timeframeHours, category);

  let bestMatch: GenerationRecord | null = null;
  let highestScore = 0;
  let bestCommonKeywords: string[] = [];

  for (const article of recentArticles) {
    const articleKeywords = extractSubjectKeywords(article.title);
    const { score, common } = calculateKeywordSimilarity(inputKeywords, articleKeywords);

    // If candidate shares 2 or more core topic keywords and has high similarity
    const isStrongMatch = (common.length >= 2 && score >= 0.45) || (common.length >= 3 && score >= 0.35) || (score >= 0.7);

    if (isStrongMatch && score > highestScore) {
      highestScore = score;
      bestMatch = article;
      bestCommonKeywords = common;
    }
  }

  if (bestMatch && highestScore > 0) {
    const isCurrentUser = Boolean(currentUserId && bestMatch.user_id === currentUserId);
    return {
      isDuplicate: true,
      similarityScore: highestScore,
      matchedRecord: bestMatch,
      isCurrentUser,
      timeAgoText: formatTimeAgo(bestMatch.timestamp),
      matchedKeywords: bestCommonKeywords
    };
  }

  return {
    isDuplicate: false,
    similarityScore: 0,
    isCurrentUser: false,
    timeAgoText: '',
    matchedKeywords: []
  };
}
