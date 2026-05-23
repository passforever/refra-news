import React, { useState, useEffect, useCallback } from 'react';
import type { NewsItem, NewsCategory, IndustryType } from '@/types';
import { CATEGORIES } from '@/data/mockData';
import { INDUSTRIES } from '@/data/mockData';
import { getIndustryImageURI } from '@/data/industryVisuals';

const ADMIN_STORAGE_KEY = 'refra_admin_news';
const AD_STORAGE_KEY = 'refra_floating_ad_config';
const ADMIN_PASSWORD = 'dy2026'; // 简单密码保护

// 行业选项（排除 all）
const INDUSTRY_OPTIONS = INDUSTRIES.filter(i => i.id !== 'all');

interface AdConfig {
  title: string;
  description: string;
  linkUrl: string;
  imageUrl: string;
  enabled: boolean;
}

const DEFAULT_AD_CONFIG: AdConfig = {
  title: '东豫科技 · 耐材服务专家',
  description: '钢铁行业新建及维修项目 · 专业耐火材料全流程服务 · 咨询热线：0371-XXXX-XXXX',
  linkUrl: '#',
  imageUrl: '',
  enabled: true,
};

export const AdminPanel: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [mainTab, setMainTab] = useState<'news' | 'ad'>('news');
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [__activeTab, _setActiveTab] = useState<'list' | 'create'>('list');

  // 广告配置
  const [adConfig, setAdConfig] = useState<AdConfig>(DEFAULT_AD_CONFIG);
  const [adSaved, setAdSaved] = useState(false);

  // 表单状态
  const [form, setForm] = useState({
    title: '',
    summary: '',
    source: '',
    sourceUrl: '',
    category: 'industry-news' as NewsCategory,
    publishedAt: new Date().toISOString().split('T')[0],
    imageUrl: '',
    tags: '',
    industries: ['all'] as IndustryType[],
    isTop: false,
  });

  // 加载数据
  const loadData = useCallback(() => {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setNewsList(data.items || []);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 加载广告配置
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AD_STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        setAdConfig({ ...DEFAULT_AD_CONFIG, ...config });
      }
    } catch { /* ignore */ }
  }, []);

  // 保存数据
  const saveData = (items: NewsItem[]) => {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({
      lastUpdated: new Date().toISOString(),
      items,
    }));
    setNewsList(items);
  };

  // 登录
  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('密码错误');
    }
  };

  // 重置表单
  const resetForm = () => {
    setForm({
      title: '',
      summary: '',
      source: '',
      sourceUrl: '',
      category: 'industry-news',
      publishedAt: new Date().toISOString().split('T')[0],
      imageUrl: '',
      tags: '',
      industries: ['all'],
      isTop: false,
    });
    setEditingItem(null);
    setIsCreating(false);
  };

  // 开始创建
  const startCreate = () => {
    resetForm();
    setIsCreating(true);
    _setActiveTab('create');
  };

  // 开始编辑
  const startEdit = (item: NewsItem) => {
    setForm({
      title: item.title,
      summary: item.summary,
      source: item.source,
      sourceUrl: item.sourceUrl,
      category: item.category,
      publishedAt: item.publishedAt,
      imageUrl: item.imageUrl || '',
      tags: item.tags.join('、'),
      industries: item.industries,
      isTop: item.isTop || false,
    });
    setEditingItem(item);
    setIsCreating(true);
    _setActiveTab('create');
  };

  // 保存资讯
  const handleSave = () => {
    if (!form.title.trim()) {
      alert('请输入标题');
      return;
    }

    const tagsArray = form.tags.split(/[、,，\s]+/).filter(t => t.trim());
    const imageUrl = form.imageUrl.trim() || getIndustryImageURI(form.title);

    const newsItem: NewsItem = {
      id: editingItem?.id || `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: form.title.trim(),
      summary: form.summary.trim() || form.title.trim(),
      source: form.source.trim() || '手动录入',
      sourceUrl: form.sourceUrl.trim() || '#',
      category: form.category,
      publishedAt: form.publishedAt,
      imageUrl,
      tags: tagsArray,
      industries: form.industries,
      isTop: form.isTop,
    };

    let updatedList: NewsItem[];
    if (editingItem) {
      updatedList = newsList.map(item => item.id === editingItem.id ? newsItem : item);
    } else {
      updatedList = [newsItem, ...newsList];
    }

    saveData(updatedList);
    resetForm();
    _setActiveTab('list');
    alert(editingItem ? '修改成功！' : '添加成功！');
  };

  // 删除资讯
  const handleDelete = (id: string) => {
    if (!confirm('确定要删除这条资讯吗？')) return;
    const updated = newsList.filter(item => item.id !== id);
    saveData(updated);
  };

  // 切换置顶
  const toggleTop = (id: string) => {
    const updated = newsList.map(item =>
      item.id === id ? { ...item, isTop: !item.isTop } : item
    );
    saveData(updated);
  };

  // 导出数据
  const handleExport = () => {
    const data = JSON.stringify({ items: newsList }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refra-news-admin-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入数据
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.items && Array.isArray(data.items)) {
            const merged = [...data.items, ...newsList];
            // 去重
            const seen = new Set<string>();
            const unique = merged.filter(item => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
            saveData(unique);
            alert(`导入成功！共 ${data.items.length} 条资讯`);
          } else {
            alert('数据格式不正确');
          }
        } catch {
          alert('文件解析失败');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // 筛选
  const filteredList = newsList.filter(item => {
    const matchSearch = !searchQuery ||
      item.title.includes(searchQuery) ||
      item.summary.includes(searchQuery);
    const matchCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // ===== 登录界面 =====
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <span className="text-3xl">🔧</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">后台管理</h1>
            <p className="text-sm text-gray-500 mt-1">耐火材料资讯平台</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="请输入管理密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              进入后台
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            提示：初始密码 dy2026
          </p>
        </div>
      </div>
    );
  }

  // ===== 分类名称映射 =====
  const getCategoryName = (id: string) => {
    return CATEGORIES.find(c => c.id === id)?.name || id;
  };

  // 保存广告配置
  const handleAdSave = () => {
    localStorage.setItem(AD_STORAGE_KEY, JSON.stringify(adConfig));
    setAdSaved(true);
    setTimeout(() => setAdSaved(false), 2000);
  };

  // ===== 管理界面 =====
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🔧</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">后台管理</h1>
              <p className="text-xs text-gray-400">耐火材料资讯平台</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              ← 返回前台
            </a>
            <button
              onClick={() => setAuthenticated(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              退出
            </button>
          </div>
        </div>
        {/* Tab切换 */}
        <div className="max-w-6xl mx-auto px-4 flex border-t border-gray-100">
          <button
            onClick={() => setMainTab('news')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mainTab === 'news'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📰 资讯管理
          </button>
          <button
            onClick={() => setMainTab('ad')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mainTab === 'ad'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📢 广告管理
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {mainTab === 'news' && (
        <>
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{newsList.length}</p>
            <p className="text-xs text-gray-500 mt-1">总资讯数</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-bold text-red-500">{newsList.filter(n => n.isTop).length}</p>
            <p className="text-xs text-gray-500 mt-1">置顶资讯</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-bold text-blue-600">
              {newsList.filter(n => n.publishedAt === new Date().toISOString().split('T')[0]).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">今日新增</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-bold text-green-600">
              {new Set(newsList.map(n => n.source)).size}
            </p>
            <p className="text-xs text-gray-500 mt-1">来源数量</p>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={startCreate}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>＋</span> 新增资讯
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            导出数据
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            导入数据
          </button>
        </div>

        {/* 创建/编辑表单 */}
        {isCreating && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editingItem ? '编辑资讯' : '新增资讯'}
              </h2>
              <button
                onClick={() => { resetForm(); _setActiveTab('list'); }}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 标题 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="请输入资讯标题"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 摘要 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="请输入资讯摘要（留空将使用标题）"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as NewsCategory })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              {/* 发布日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发布日期</label>
                <input
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 来源 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="如：泰科钢铁、我的钢铁网等"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 来源链接 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">来源链接</label>
                <input
                  type="url"
                  value={form.sourceUrl}
                  onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 封面图 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">封面图URL</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="留空将根据标题自动匹配"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {!form.imageUrl && form.title && (
                  <p className="text-xs text-blue-500 mt-1">
                    将自动匹配关键词图片：{getIndustryImageURI(form.title).slice(0, 40)}...
                  </p>
                )}
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="用、号或逗号分隔，如：镁砂、高炉、价格"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 关联行业 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">关联行业</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map(ind => (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => {
                        const industries = form.industries.includes(ind.id)
                          ? form.industries.filter(i => i !== ind.id)
                          : [...form.industries, ind.id];
                        setForm({ ...form, industries });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        form.industries.includes(ind.id)
                          ? 'bg-blue-100 text-blue-600 border-blue-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {ind.icon} {ind.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 置顶 */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isTop}
                    onChange={(e) => setForm({ ...form, isTop: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">置顶显示</span>
                </label>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                {editingItem ? '保存修改' : '添加资讯'}
              </button>
              <button
                onClick={() => { resetForm(); _setActiveTab('list'); }}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="搜索标题或摘要..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部分类</option>
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* 资讯列表 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-gray-500 font-medium">暂无资讯</p>
              <p className="text-gray-400 text-sm mt-1">点击"新增资讯"按钮添加第一条</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredList.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  {/* 缩略图 */}
                  <div className="w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={item.imageUrl || getIndustryImageURI(item.title)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.isTop && (
                        <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-medium">置顶</span>
                      )}
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {getCategoryName(item.category)}
                      </span>
                      <span className="text-xs text-gray-400">{item.publishedAt}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.source}</p>
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleTop(item.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        item.isTop
                          ? 'bg-red-50 text-red-500 border-red-100'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {item.isTop ? '取消置顶' : '置顶'}
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
        )}

        {mainTab === 'ad' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">📢 浮动广告配置</h2>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adConfig.enabled}
                    onChange={(e) => setAdConfig({ ...adConfig, enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">启用广告</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">广告标题</label>
                <input
                  type="text"
                  value={adConfig.title}
                  onChange={(e) => setAdConfig({ ...adConfig, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：东豫科技 · 耐材服务专家"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">广告描述</label>
                <textarea
                  value={adConfig.description}
                  onChange={(e) => setAdConfig({ ...adConfig, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="如：钢铁行业新建及维修项目 · 专业耐火材料全流程服务"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">跳转链接</label>
                <input
                  type="url"
                  value={adConfig.linkUrl}
                  onChange={(e) => setAdConfig({ ...adConfig, linkUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://... （留空则不跳转）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">广告图片URL</label>
                <input
                  type="url"
                  value={adConfig.imageUrl}
                  onChange={(e) => setAdConfig({ ...adConfig, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://... （留空则显示默认蓝色背景）"
                />
                {adConfig.imageUrl && (
                  <div className="mt-2 w-48 h-28 rounded-lg overflow-hidden border border-gray-200">
                    <img src={adConfig.imageUrl} alt="预览" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={handleAdSave}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                {adSaved ? '✓ 已保存' : '保存广告配置'}
              </button>
              <button
                onClick={() => {
                  setAdConfig(DEFAULT_AD_CONFIG);
                  localStorage.removeItem(AD_STORAGE_KEY);
                  setAdSaved(true);
                  setTimeout(() => setAdSaved(false), 2000);
                }}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                恢复默认
              </button>
            </div>
          </div>

          {/* 预览 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">📱 广告预览（前台展示效果）</h3>
            <div className="relative bg-gray-50 rounded-xl p-4 flex justify-end">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden w-64">
                <button className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center bg-black/40 text-white rounded-full text-xs">✕</button>
                {adConfig.imageUrl ? (
                  <div className="relative h-28 overflow-hidden">
                    <img src={adConfig.imageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-8">
                      <p className="text-white font-bold text-xs">{adConfig.title}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-lg">🔥</span>
                      <p className="text-white font-bold text-xs">{adConfig.title}</p>
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs text-gray-500 leading-relaxed">{adConfig.description}</p>
                  {adConfig.linkUrl && adConfig.linkUrl !== '#' && (
                    <p className="mt-1.5 text-xs text-blue-600 font-medium">了解详情 →</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
