import { useState, useMemo } from 'react';
import type { NewsCategory, NewsItem } from '@/types';
import { useIndustry, useNews, useSearch } from '@/hooks/useNews';
import { MarketTicker } from '@/sections/MarketTicker';
import { IndustrySelector } from '@/sections/IndustrySelector';
import { CategoryTabs } from '@/sections/CategoryTabs';
import { NewsCard } from '@/sections/NewsCard';
import { MarketPanel } from '@/sections/MarketPanel';
import { CrawlerSourcesPanel } from '@/sections/CrawlerSourcesPanel';
import { NewsDetailModal } from '@/sections/NewsDetailModal';
import { FloatingAd } from '@/sections/FloatingAd';
import { CATEGORIES } from '@/data/mockData';

// 导航项配置
const NAV_ITEMS = [
  { id: 'home', label: '首页', category: 'all' as const },
  { id: 'market', label: '行情', category: 'market' as const },
  { id: 'tech', label: '技术库', category: 'technology' as const },
  { id: 'enterprise', label: '企业名录', category: 'enterprise' as const },
  { id: 'exhibition', label: '展会日历', category: 'exhibition' as const },
  { id: 'about', label: '关于', category: 'all' as const },
];

export default function App() {
  const { selectedIndustry, setSelectedIndustry } = useIndustry();
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');

  const { news, loading } = useNews(selectedIndustry, selectedCategory);
  const filteredNews = useSearch(searchQuery, news);

  // 处理导航切换
  const handleNavClick = (navId: string) => {
    setActiveNav(navId);
    const navItem = NAV_ITEMS.find(item => item.id === navId);
    if (navItem && navItem.category) {
      setSelectedCategory(navItem.category);
    }
    // 如果是"关于"页面，显示全部
    if (navId === 'about') {
      setSelectedCategory('all');
    }
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: news.length };
    CATEGORIES.forEach((cat) => {
      counts[cat.id] = news.filter((n) => n.category === cat.id).length;
    });
    return counts;
  }, [news]);

  const topNews = filteredNews.filter((n) => n.isTop).slice(0, 3);
  const regularNews = filteredNews.filter((n) => !n.isTop);
  const featuredNews = topNews.length > 0 ? topNews : filteredNews.slice(0, 2);
  const listNews = topNews.length > 0 ? regularNews : filteredNews.slice(2);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-md shadow-blue-200">
                <span className="text-white text-lg">🔥</span>
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-gray-900 leading-tight tracking-tight">
                  耐火材料资讯平台
                </h1>
                <p className="text-xs text-blue-500 font-medium">Refractory Materials Intelligence Hub</p>
              </div>
            </div>

            {/* Search */}
            <div className="hidden sm:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="搜索新闻、技术、材料品种…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-sm px-3 py-2 rounded-lg transition-colors font-medium ${
                    activeNav === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile menu */}
            <button
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="打开菜单"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed top-16 right-0 w-64 h-[calc(100vh-4rem)] bg-white shadow-xl z-50 lg:hidden overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-gray-900">导航菜单</span>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <nav className="space-y-1">
                    {NAV_ITEMS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleNavClick(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${
                          activeNav === item.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </nav>
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-xs text-gray-400 mb-2">行业链接</p>
                    <div className="flex flex-wrap gap-2">
                      {['耐材协会', '冶金网', '水泥网', '玻璃网'].map((link) => (
                        <a
                          key={link}
                          href="#"
                          className="text-xs bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 px-2 py-1 rounded transition-colors"
                          onClick={() => setSidebarOpen(false)}
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Mobile search */}
          <div className="sm:hidden pb-3">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="搜索资讯…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Market Ticker */}
      <MarketTicker />

      {/* Industry Selector */}
      <IndustrySelector selected={selectedIndustry} onSelect={setSelectedIndustry} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left main column */}
          <div className="flex-1 min-w-0">
            {/* Category Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-5">
              <CategoryTabs
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                counts={categoryCounts}
              />
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  {searchQuery
                    ? `"${searchQuery}" 搜索结果`
                    : selectedCategory === 'all'
                    ? '最新资讯'
                    : CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                </span>
                {!loading && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                    共 {filteredNews.length} 条
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="h-40 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-4/5" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-gray-500 text-base font-medium">暂无相关资讯</p>
                <p className="text-gray-400 text-sm mt-1">尝试调整行业筛选或搜索关键词</p>
                <button
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedIndustry('all');
                  }}
                >
                  清除全部筛选
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top featured news */}
                {featuredNews.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featuredNews.map((item) => (
                      <NewsCard
                        key={item.id}
                        item={item}
                        variant="large"
                        onClick={setSelectedNews}
                      />
                    ))}
                  </div>
                )}

                {/* Regular news grid */}
                {listNews.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listNews.map((item) => (
                      <NewsCard
                        key={item.id}
                        item={item}
                        variant="medium"
                        onClick={setSelectedNews}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="hidden xl:flex flex-col gap-5 w-72 flex-shrink-0">
            <MarketPanel />
            <CrawlerSourcesPanel />

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <span>🔗</span> 行业链接
                </h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {[
                  '中国耐材协会', '冶金工业信息', '水泥网', '中国玻璃网',
                  '中国有色网', '化工在线', '中国电力网', '中国陶瓷网'
                ].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-xs bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>

            {/* Update schedule */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
              <h3 className="font-bold text-lg mb-2">📡 权威数据</h3>
              <p className="text-sm text-blue-100 mb-3 leading-relaxed">
                汇聚行业协会官网、专业资讯门户及权威媒体内容，为您提供及时准确的行业资讯服务。
              </p>
              <div className="space-y-1.5 text-xs text-blue-100">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />行业协会官网
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />专业资讯门户
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />大型企业公告
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />原料市场行情
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg">
                  <span className="text-white">🔥</span>
                </div>
                <span className="text-white font-bold text-lg">耐火材料资讯平台</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                聚焦耐火材料及高温窑炉行业，每日自动汇聚行业动态、市场行情、技术进展与政策资讯。
                为钢铁、水泥、玻璃、有色、石化等下游行业用户提供精准的行业情报服务。
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">资讯分类</h4>
              <ul className="space-y-2 text-sm">
                {['行业新闻', '市场行情', '技术前沿', '企业动态', '政策法规', '展会活动'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-blue-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">应用行业</h4>
              <ul className="space-y-2 text-sm">
                {['钢铁冶金', '水泥建材', '玻璃窑炉', '有色冶金', '石油化工', '电力能源'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-blue-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              © 2026 耐火材料资讯平台 | 内容来源于公开权威网站，仅供参考
            </p>
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-600">
                聚焦高温窑炉行业 · 服务钢铁水泥玻璃用户
              </p>
              <a
                href="#/admin"
                className="text-xs text-gray-500 hover:text-blue-500 transition-colors"
              >
                管理
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* News Detail Modal */}
      <NewsDetailModal item={selectedNews} onClose={() => setSelectedNews(null)} />

      {/* Floating Ad */}
      <FloatingAd
        title="东豫科技 · 耐材服务专家"
        description="钢铁行业新建及维修项目 · 专业耐火材料全流程服务 · 咨询热线：0371-XXXX-XXXX"
      />
    </div>
  );
}
