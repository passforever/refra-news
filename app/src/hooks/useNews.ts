import { useState, useEffect } from 'react';
import type { NewsItem, IndustryType, NewsCategory } from '@/types';
import { MOCK_NEWS } from '@/data/mockData';

const INDUSTRY_KEY = 'refra_selected_industry';
const LAST_UPDATED_KEY = 'refra_last_updated';

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
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    // Simulate network request
    const timer = setTimeout(() => {
      let filtered = MOCK_NEWS;

      if (selectedIndustry !== 'all') {
        filtered = filtered.filter(
          (item) => item.industries.includes(selectedIndustry) || item.industries.includes('all')
        );
      }

      if (selectedCategory !== 'all') {
        filtered = filtered.filter((item) => item.category === selectedCategory);
      }

      setNews(filtered);
      setLoading(false);

      const stored = localStorage.getItem(LAST_UPDATED_KEY);
      if (stored) {
        setLastUpdated(stored);
      } else {
        const now = new Date().toLocaleString('zh-CN');
        localStorage.setItem(LAST_UPDATED_KEY, now);
        setLastUpdated(now);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedIndustry, selectedCategory]);

  return { news, loading, lastUpdated };
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
