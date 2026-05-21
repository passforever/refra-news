import { useState, useEffect } from 'react';
import type { NewsItem, IndustryType, NewsCategory } from '@/types';
import { MOCK_NEWS } from '@/data/mockData';

const INDUSTRY_KEY = 'refra_selected_industry';
const ADMIN_STORAGE_KEY = 'refra_admin_news';

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
      // 合并 MOCK 数据和后台手动录入数据
      let allNews = [...MOCK_NEWS];

      // 读取后台手动录入的数据
      try {
        const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (stored) {
          const adminData = JSON.parse(stored);
          if (adminData.items && Array.isArray(adminData.items)) {
            // 合并并去重
            const existingIds = new Set(allNews.map(n => n.id));
            const adminItems = adminData.items.filter(
              (item: NewsItem) => !existingIds.has(item.id)
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

      // 按时间倒序
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
