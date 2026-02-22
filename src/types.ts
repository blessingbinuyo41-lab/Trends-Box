export type GenerationType = 'social' | 'blog';

export type Category = 'Politics' | 'Sports' | 'Entertainment' | 'Technology' | 'General';

export interface NewsSource {
  name: string;
  platform?: string;
  url: string;
  reliabilityScore: number;
}

export interface GenerationRecord {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  type: GenerationType;
  category: Category;
  imageUrl?: string;
  sources: NewsSource[];
  timestamp: string;
}

export interface ReliabilityScore {
  name: string;
  score: number;
  description: string;
}
