import { Category, ReliabilityScore } from "./types";

export const CATEGORIES: Category[] = ['Politics', 'Sports', 'Entertainment', 'Technology', 'General'];

export const RELIABILITY_SCORES: ReliabilityScore[] = [
  { name: 'Premium Times', score: 95, description: 'High investigative standards and factual accuracy.' },
  { name: 'The Cable', score: 92, description: 'Reliable real-time reporting and balanced views.' },
  { name: 'Channels TV', score: 94, description: 'Leading broadcast news with strong editorial standards.' },
  { name: 'Punch', score: 88, description: 'Widely read with strong historical presence.' },
  { name: 'Daily Trust', score: 87, description: 'Strong regional coverage and reliable reporting.' },
  { name: 'Guardian Nigeria', score: 90, description: 'Intellectual depth and high editorial quality.' },
  { name: 'Arise News', score: 91, description: 'Global perspective on Nigerian news.' },
  { name: 'Vanguard', score: 85, description: 'Popular news source with broad coverage.' },
  { name: 'Sahara Reporters', score: 80, description: 'Aggressive reporting, occasionally controversial.' },
  { name: 'BellaNaija', score: 85, description: 'Top-tier entertainment and lifestyle coverage.' }
];

export function getReliabilityScore(sourceName: string): number {
  const source = RELIABILITY_SCORES.find(s => 
    sourceName.toLowerCase().includes(s.name.toLowerCase()) || 
    s.name.toLowerCase().includes(sourceName.toLowerCase())
  );
  return source ? source.score : 70; // Default score for unknown sources
}
