import React, { useState } from 'react';
import type { IndustryType } from '@/types';
import { INDUSTRIES } from '@/data/mockData';

interface IndustrySelectorProps {
  selected: IndustryType;
  onSelect: (industry: IndustryType) => void;
}

export const IndustrySelector: React.FC<IndustrySelectorProps> = ({ selected, onSelect }) => {
  const [expanded, setExpanded] = useState(true); // 默认展开

  return (
    <section className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold text-sm">🏭 选择行业</span>
            <span className="text-xs text-gray-400">根据所从事行业获取精准资讯</span>
          </div>
          <button
            className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起 ▲' : '展开全部 ▼'}
          </button>
        </div>
        <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2 transition-all duration-300 overflow-hidden ${!expanded ? 'max-h-20' : 'max-h-96'}`}>
          {INDUSTRIES.map((industry) => (
            <button
              key={industry.id}
              onClick={() => onSelect(industry.id)}
              title={industry.kiln || industry.description}
              className={`group flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-center transition-all duration-200 ${
                selected === industry.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              <span className="text-xl leading-none">{industry.icon}</span>
              <span className="text-xs font-medium leading-tight">{industry.name}</span>
              {industry.kiln && (
                <span className={`text-[10px] leading-tight line-clamp-1 ${selected === industry.id ? 'text-blue-100' : 'text-gray-400 group-hover:text-blue-400'}`}>
                  {industry.kiln.split('/')[0].trim()}
                </span>
              )}
            </button>
          ))}
        </div>
        {selected !== 'all' && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
            <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              {INDUSTRIES.find((i) => i.id === selected)?.icon}{' '}
              当前展示：<strong>{INDUSTRIES.find((i) => i.id === selected)?.name}</strong> 相关资讯
            </span>
            <button
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => onSelect('all')}
            >
              清除筛选 ×
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
