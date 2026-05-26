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
  relevanceScore?: number;
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
  | 'carbon'
  | 'hotblast'    // 热风炉
  | 'cokeoven';   // 焦炉

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
  // 月度数据
  monthlyChange?: string;      // 月度涨跌
  monthlyChangePercent?: string; // 月度涨跌幅
  monthlyTrend?: 'up' | 'down' | 'flat';
  // 季度数据
  quarterlyChange?: string;      // 季度涨跌
  quarterlyChangePercent?: string; // 季度涨跌幅
  quarterlyTrend?: 'up' | 'down' | 'flat';
  // 同比数据
  yoyChange?: string;      // 同比涨跌
  yoyChangePercent?: string; // 同比涨跌幅
  yoyTrend?: 'up' | 'down' | 'flat';
}

export interface CrawlerSource {
  name: string;
  url: string;
  type: string;
  selectors?: Record<string, string>;
}
