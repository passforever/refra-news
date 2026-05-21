import React from 'react';
import type { NewsItem } from '@/types';
import { CATEGORIES } from '@/data/mockData';
import { getIndustryImageURI } from '@/data/industryVisuals';

interface NewsDetailModalProps {
  item: NewsItem | null;
  onClose: () => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;
  const cat = CATEGORIES.find((c) => c.id === item.category);
  const imageUrl = item.imageUrl || getIndustryImageURI(item.title, 800, 400);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-16 px-4 pb-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        {imageUrl && (
          <div className="relative overflow-hidden h-60 rounded-t-2xl">
            <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {item.isTop && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                置顶
              </span>
            )}
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 font-medium px-2 py-0.5 rounded">
              {cat?.icon} {cat?.name}
            </span>
            <span className="text-xs text-gray-400">{item.publishedAt}</span>
            <span className="text-xs text-gray-400">来源：{item.source}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 leading-snug">{item.title}</h2>
          <p className="text-base text-gray-700 leading-relaxed mb-6">{item.summary}</p>
          <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-500 leading-relaxed mb-6">
            <p className="font-medium text-gray-700 mb-2">📄 正文摘要（演示版）</p>
            <p>{item.summary}</p>
            <br />
            <p>
              本资讯由耐火材料资讯平台从 <strong>{item.source}</strong> 采集汇总。
              如需阅读全文，请点击下方链接访问原文页面。
            </p>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                查看原文 →
              </a>
              <button
                className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={onClose}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
