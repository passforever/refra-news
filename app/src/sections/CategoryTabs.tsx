import React from 'react';
import type { NewsCategory } from '@/types';
import { CATEGORIES } from '@/data/mockData';

interface CategoryTabsProps {
  selected: NewsCategory | 'all';
  onSelect: (cat: NewsCategory | 'all') => void;
  counts?: Record<string, number>;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ selected, onSelect, counts }) => {
  const all = [{ id: 'all' as const, name: '全部', icon: '📌', color: 'text-gray-600' }, ...CATEGORIES];

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
      {all.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id as NewsCategory | 'all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
            selected === cat.id
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
          {counts && counts[cat.id] !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              selected === cat.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {counts[cat.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
