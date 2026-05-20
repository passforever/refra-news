export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: string;
  sourceUrl: string;
  category: NewsCategory;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
  industries: IndustryType[];
  isTop?: boolean;
}

export type NewsCategory =
  | 'recommend'
  | 'industry-news'
  | 'market'
  | 'technology'
  | 'enterprise'
  | 'policy'
  | 'exhibition';

export type IndustryType =
  | 'all'
  | 'steel'
  | 'cement'
  | 'glass'
  | 'nonferrous'
  | 'petrochemical'
  | 'ceramic'
  | 'power'
  | 'carbon';

export interface Industry {
  id: IndustryType;
  name: string;
  icon: string;
  description: string;
  kiln?: string;
}

export interface CategoryInfo {
  id: NewsCategory;
  name: string;
  icon: string;
  color: string;
}

export interface MarketData {
  name: string;
  price: string;
  change: string;
  changePercent: string;
  trend: 'up' | 'down' | 'flat';
  unit: string;
}

export interface CrawlerSource {
  name: string;
  url: string;
  type: string;
  selectors?: Record<string, string>;
}
