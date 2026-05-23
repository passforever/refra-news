import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { NewsItem, NewsCategory, IndustryType } from '@/types';
import { CATEGORIES, MOCK_NEWS } from '@/data/mockData';
import { getImageForTitle } from '@/data/imageMapping';
import taikeNewsData from '@/data/taikeNews.json';
import wechatNewsData from '@/data/wechatNews.json';

const ADMIN_STORAGE_KEY = 'refra_admin_news';

/** 聚合全部数据源查找单条资讯 */
function findNewsById(id: string): NewsItem | null {
  // 1. 后台手动录入
  try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      const adminData = JSON.parse(stored);
      const found = adminData.items?.find((item: NewsItem) => item.id === id);
      if (found) return found;
    }
  } catch { /* ignore */ }

  // 2. MOCK 数据
  const mockItem = MOCK_NEWS.find((n) => n.id === id);
  if (mockItem) return mockItem;

  // 3. 爬虫数据（泰科钢铁）
  if (taikeNewsData?.items) {
    const crawled = taikeNewsData.items.find((item: any) => item.id === id);
    if (crawled) {
      return {
        id: crawled.id || `tk_${Math.random().toString(36).slice(2, 10)}`,
        title: crawled.title || '',
        summary: crawled.summary || crawled.title || '',
        source: crawled.source || '泰科钢铁',
        sourceUrl: crawled.sourceUrl || '#',
        category: (crawled.category || 'industry-news') as NewsCategory,
        publishedAt: crawled.publishedAt || '',
        tags: crawled.tags || [],
        industries: (crawled.industries || ['all', 'steel']) as IndustryType[],
        isTop: (crawled as any).isTop || false,
      };
    }
  }

  // 4. 爬虫数据（微信公众号）
  if (wechatNewsData?.items) {
    const wxItem = wechatNewsData.items.find((item: any) => item.id === id);
    if (wxItem) {
      return {
        id: wxItem.id || `wx_${Math.random().toString(36).slice(2, 10)}`,
        title: wxItem.title || '',
        summary: wxItem.summary || wxItem.title || '',
        source: wxItem.source || '微信公众号',
        sourceUrl: wxItem.sourceUrl || '#',
        category: (wxItem.category || 'industry-news') as NewsCategory,
        publishedAt: wxItem.publishedAt || '',
        tags: wxItem.tags || [],
        industries: (wxItem.industries || ['all', 'steel']) as IndustryType[],
        isTop: (wxItem as any).isTop || false,
      };
    }
  }

  return null;
}

const categoryColorMap: Record<string, string> = {
  recommend: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'industry-news': 'bg-blue-100 text-blue-700 border-blue-200',
  market: 'bg-green-100 text-green-700 border-green-200',
  technology: 'bg-purple-100 text-purple-700 border-purple-200',
  enterprise: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  policy: 'bg-red-100 text-red-700 border-red-200',
  exhibition: 'bg-orange-100 text-orange-700 border-orange-200',
};

/** 生成完整正文（约200字） */
function generateContent(item: NewsItem): string {
  if (item.content) return item.content;
  // 基于 summary 扩展为更完整的正文
  const summary = item.summary || item.title;
  if (summary.length >= 180) return summary;
  // 添加补充段落
  const supplement = `\n\n据悉，该资讯来源于${item.source}。耐火材料资讯平台将持续关注行业动态，为用户提供及时、准确的行业情报服务。如需了解更详细信息，请点击下方"查看原文"链接访问原始出处。`;
  return summary + supplement;
}

/** 获取相关资讯 */
function getRelatedNews(currentId: string, count: number = 3): NewsItem[] {
  const all: NewsItem[] = [];
  // 合并数据源
  try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      const adminData = JSON.parse(stored);
      if (adminData.items) all.push(...adminData.items);
    }
  } catch { /* ignore */ }
  all.push(...MOCK_NEWS);
  if (taikeNewsData?.items) {
    for (const item of taikeNewsData.items) {
      all.push({
        id: item.id,
        title: item.title || '',
        summary: item.summary || item.title || '',
        source: item.source || '泰科钢铁',
        sourceUrl: item.sourceUrl || '#',
        category: (item.category || 'industry-news') as NewsCategory,
        publishedAt: item.publishedAt || '',
        tags: item.tags || [],
        industries: (item.industries || ['all', 'steel']) as IndustryType[],
        isTop: (item as any).isTop || false,
      });
    }
  }
  if (wechatNewsData?.items) {
    for (const item of wechatNewsData.items) {
      all.push({
        id: item.id,
        title: item.title || '',
        summary: item.summary || item.title || '',
        source: item.source || '微信公众号',
        sourceUrl: item.sourceUrl || '#',
        category: (item.category || 'industry-news') as NewsCategory,
        publishedAt: item.publishedAt || '',
        tags: item.tags || [],
        industries: (item.industries || ['all', 'steel']) as IndustryType[],
        isTop: (item as any).isTop || false,
      });
    }
  }

  return all
    .filter((n) => n.id !== currentId)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, count);
}

export const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    // 模拟加载延迟（真实场景可能异步获取）
    const timer = setTimeout(() => {
      const found = findNewsById(id);
      setItem(found);
      setLoading(false);
      if (!found) {
        // 找不到则返回首页
        navigate('/');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [id, navigate]);

  // 滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const relatedNews = useMemo(() => {
    if (!item) return [];
    return getRelatedNews(item.id);
  }, [item]);

  if (loading || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  const cat = CATEGORIES.find((c) => c.id === item.category);
  const imageUrl = item.imageUrl || getImageForTitle(item.title);
  const content = generateContent(item);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 flex-shrink-0"
            aria-label="返回"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
          </div>
          <a
            href="/"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex-shrink-0"
          >
            首页
          </a>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* 头图 */}
        <div className="relative overflow-hidden rounded-2xl mb-6 aspect-[16/9] max-h-[400px] bg-gray-200">
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {item.isTop && (
            <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              置顶
            </span>
          )}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border backdrop-blur-sm bg-white/20 text-white ${categoryColorMap[item.category]?.replace(/bg-\w+-\d+\s/, '').replace(/text-\w+-\d+\s/, 'text-white ') || 'text-white'}`}>
                {cat?.icon} {cat?.name}
              </span>
              <span className="text-xs text-white/80">{item.publishedAt}</span>
            </div>
          </div>
        </div>

        {/* 文章元信息 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {item.publishedAt}
            </span>
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {item.source}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-4">
            {item.title}
          </h1>

          {/* 正文 */}
          <div className="prose prose-sm sm:prose-base max-w-none">
            <div className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
              {content}
            </div>
          </div>

          {/* 标签 */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              查看原文
            </a>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              返回列表
            </button>
          </div>
        </div>

        {/* 相关资讯 */}
        {relatedNews.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              相关资讯
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedNews.map((rel) => {
                const relCat = CATEGORIES.find((c) => c.id === rel.category);
                const relColor = categoryColorMap[rel.category] || 'bg-gray-100 text-gray-700 border-gray-200';
                return (
                  <button
                    key={rel.id}
                    onClick={() => navigate(`/news/${rel.id}`)}
                    className="text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden group"
                  >
                    <div className="h-32 overflow-hidden bg-gray-100">
                      <img
                        src={rel.imageUrl || getImageForTitle(rel.title)}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${relColor}`}>
                          {relCat?.name}
                        </span>
                        <span className="text-xs text-gray-400">{rel.publishedAt}</span>
                      </div>
                      <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                        {rel.title}
                      </h3>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 底部返回 */}
        <div className="mt-10 pb-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            返回资讯列表
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-12">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-gray-600">
            © 2026 耐火材料资讯平台 | 内容来源于公开权威网站，仅供参考
          </p>
        </div>
      </footer>
    </div>
  );
};
