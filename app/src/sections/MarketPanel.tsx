import React from 'react';
import { MOCK_MARKET_DATA } from '@/data/mockData';

export const MarketPanel: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <span className="text-green-500">📊</span> 主要原料行情
        </h3>
        <span className="text-xs text-gray-400">仅供参考</span>
      </div>
      <div className="divide-y divide-gray-50">
        {MOCK_MARKET_DATA.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-blue-50/30 transition-colors">
            <span className="text-sm text-gray-700 font-medium">{item.name}</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-mono font-bold text-gray-900">{item.price}</span>
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded ${
                  item.trend === 'up'
                    ? 'bg-red-50 text-red-500'
                    : item.trend === 'down'
                    ? 'bg-green-50 text-green-500'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '─'} {item.changePercent}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 bg-gray-50 text-center">
        <span className="text-xs text-gray-400">数据来源：大宗商品头条 | 每日更新</span>
      </div>
    </div>
  );
};
