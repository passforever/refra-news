import React from 'react';
import type { NewsItem } from '@/types';
import { CATEGORIES } from '@/data/mockData';

interface NewsCardProps {
  item: NewsItem;
  variant?: 'large' | 'medium' | 'small' | 'list';
  onClick?: (item: NewsItem) => void;
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

export const NewsCard: React.FC<NewsCardProps> = ({ item, variant = 'medium', onClick }) => {
  const cat = CATEGORIES.find((c) => c.id === item.category);
  const colorClass = categoryColorMap[item.category] || 'bg-gray-100 text-gray-700 border-gray-200';

  if (variant === 'list') {
    return (
      <article
        className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-blue-50/40 rounded-lg px-2 transition-colors"
        onClick={() => onClick?.(item)}
      >
        <span className={`text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap ${colorClass}`}>
          {cat?.name}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 line-clamp-1 hover:text-blue-600 transition-colors">
            {item.title}
          </p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{item.publishedAt}</span>
      </article>
    );
  }

  if (variant === 'large') {
    return (
      <article
        className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300"
        onClick={() => onClick?.(item)}
      >
        {item.imageUrl && (
          <div className="relative overflow-hidden h-52">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {item.isTop && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                置顶
              </span>
            )}
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${colorClass}`}>
              {cat?.icon} {cat?.name}
            </span>
            <span className="text-xs text-gray-400">{item.publishedAt}</span>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
            {item.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{item.summary}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span>📰</span> {item.source}
            </span>
            <div className="flex gap-1 flex-wrap justify-end">
              {item.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full border border-blue-100">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'small') {
    return (
      <article
        className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex gap-3 p-3"
        onClick={() => onClick?.(item)}
      >
        {item.imageUrl && (
          <div className="w-20 h-16 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-xs px-1.5 py-0.5 rounded border ${colorClass}`}>{cat?.name}</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
            {item.title}
          </h3>
          <span className="text-xs text-gray-400 mt-1 block">{item.publishedAt} · {item.source}</span>
        </div>
      </article>
    );
  }

  // medium (default)
  return (
    <article
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300"
      onClick={() => onClick?.(item)}
    >
      {item.imageUrl && (
        <div className="relative overflow-hidden h-40">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${colorClass}`}>
            {cat?.icon} {cat?.name}
          </span>
          <span className="text-xs text-gray-400">{item.publishedAt}</span>
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
          {item.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.summary}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400 truncate">{item.source}</span>
          <div className="flex gap-1">
            {item.tags.slice(0, 1).map((tag) => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};
