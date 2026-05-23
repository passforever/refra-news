import { useState, useEffect } from 'react';
import type { NewsItem, IndustryType, NewsCategory } from '@/types';
import { MOCK_NEWS } from '@/data/mockData';
// 导入爬虫数据（Vite 支持直接 import JSON）
import taikeNewsData from '@/data/taikeNews.json';
import wechatNewsData from '@/data/wechatNews.json';

const INDUSTRY_KEY = 'refra_selected_industry';
const ADMIN_STORAGE_KEY = 'refra_admin_news';

// 解析爬虫数据：将 JSON 中的 items 转换为 NewsItem 格式
function loadCrawledNews(): NewsItem[] {
  const items: NewsItem[] = [];

  // 泰科钢铁爬虫数据
  if (taikeNewsData && taikeNewsData.items && Array.isArray(taikeNewsData.items)) {
    for (const item of taikeNewsData.items) {
      items.push({
        id: item.id || `tk_${Math.random().toString(36).slice(2, 10)}`,
        title: item.title || '',
        summary: item.summary || item.title || '',
        source: item.source || '泰科钢铁',
        sourceUrl: item.sourceUrl || '#',
        category: (item.category || 'industry-news') as NewsCategory,
        publishedAt: item.publishedAt || new Date().toISOString().split('T')[0],
        tags: item.tags || [],
        industries: (item.industries || ['all', 'steel']) as IndustryType[],
        isTop: item.isTop || false,
      });
    }
  }

  // 如果未来有更多爬虫数据源，在此处添加
  // import otherNewsData from '@/data/otherNews.json';
  // ...

  // 微信公众号爬虫数据
  if (wechatNewsData && wechatNewsData.items && Array.isArray(wechatNewsData.items)) {
    for (const item of wechatNewsData.items) {
      items.push({
        id: item.id || `wx_${Math.random().toString(36).slice(2, 10)}`,
        title: item.title || '',
        summary: item.summary || item.title || '',
        source: item.source || '微信公众号',
        sourceUrl: item.sourceUrl || '#',
        category: (item.category || 'industry-news') as NewsCategory,
        publishedAt: item.publishedAt || new Date().toISOString().split('T')[0],
        tags: item.tags || [],
        industries: (item.industries || ['all', 'steel']) as IndustryType[],
        isTop: item.isTop || false,
      });
    }
  }

  return items;
}

// 缓存爬虫数据，避免每次渲染重新解析
let _crawledNewsCache: NewsItem[] | null = null;
function getCrawledNews(): NewsItem[] {
  if (!_crawledNewsCache) {
    _crawledNewsCache = loadCrawledNews();
  }
  return _crawledNewsCache;
}

export function useIndustry() {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>(() => {
    return (localStorage.getItem(INDUSTRY_KEY) as IndustryType) || 'all';
  });

  const handleSelectIndustry = (industry: IndustryType) => {
    setSelectedIndustry(industry);
    localStorage.setItem(INDUSTRY_KEY, industry);
  };

  return { selectedIndustry, setSelectedIndustry: handleSelectIndustry };
}

export function useNews(selectedIndustry: IndustryType, selectedCategory: NewsCategory | 'all' = 'all') {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      // 合并三层数据：爬虫数据 + MOCK数据 + 后台手动录入
      let allNews: NewsItem[] = [];

      // 1. 爬虫数据（最新、最真实）
      const crawledNews = getCrawledNews();
      allNews = [...crawledNews];

      // 2. MOCK 数据（补充）
      const existingIds = new Set(allNews.map(n => n.id));
      const mockItems = MOCK_NEWS.filter(n => !existingIds.has(n.id));
      allNews = [...allNews, ...mockItems];

      // 3. 后台手动录入的数据
      try {
        const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (stored) {
          const adminData = JSON.parse(stored);
          if (adminData.items && Array.isArray(adminData.items)) {
            const existingIds2 = new Set(allNews.map(n => n.id));
            const adminItems = adminData.items.filter(
              (item: NewsItem) => !existingIds2.has(item.id)
            );
            allNews = [...adminItems, ...allNews];
          }
        }
      } catch { /* ignore */ }

      // 按行业筛选
      if (selectedIndustry !== 'all') {
        allNews = allNews.filter(
          (item) => item.industries.includes(selectedIndustry) || item.industries.includes('all')
        );
      }

      // 按分类筛选
      if (selectedCategory !== 'all') {
        allNews = allNews.filter((item) => item.category === selectedCategory);
      }

      // 按时间倒序，置顶优先
      allNews.sort((a, b) => {
        if (a.isTop && !b.isTop) return -1;
        if (!a.isTop && b.isTop) return 1;
        return b.publishedAt.localeCompare(a.publishedAt);
      });

      setNews(allNews);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedIndustry, selectedCategory]);

  return { news, loading };
}

export function useSearch(query: string, news: NewsItem[]) {
  if (!query.trim()) return news;
  const q = query.toLowerCase();
  return news.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
  );
}
