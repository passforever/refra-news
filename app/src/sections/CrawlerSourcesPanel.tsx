import React from 'react';
import { CRAWLER_SOURCES } from '@/data/mockData';

export const CrawlerSourcesPanel: React.FC = () => {
  const typeLabels: Record<string, string> = {
    industry: '行业协会',
    portal: '资讯门户',
    media: '行业媒体',
    enterprise: '企业官网',
    research: '科研机构',
    market: '市场数据',
  };
  const typeColors: Record<string, string> = {
    industry: 'bg-blue-50 text-blue-600 border-blue-100',
    portal: 'bg-purple-50 text-purple-600 border-purple-100',
    media: 'bg-orange-50 text-orange-600 border-orange-100',
    enterprise: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    research: 'bg-green-50 text-green-600 border-green-100',
    market: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <span className="text-blue-500">🕷️</span> 数据来源
        </h3>
        <p className="text-xs text-gray-400 mt-1">每日凌晨自动爬取更新</p>
      </div>
      <div className="divide-y divide-gray-50">
        {CRAWLER_SOURCES.map((source, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-700">{source.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[source.type] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
              {typeLabels[source.type] || source.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
