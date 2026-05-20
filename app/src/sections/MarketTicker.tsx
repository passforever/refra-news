import React from 'react';
import type { MarketData } from '@/types';
import { MOCK_MARKET_DATA } from '@/data/mockData';

export const MarketTicker: React.FC = () => {
  const data: MarketData[] = MOCK_MARKET_DATA;

  return (
    <div className="bg-gray-900 text-white overflow-hidden relative">
      <div className="flex items-center">
        <div className="bg-blue-600 px-4 py-2 text-sm font-bold whitespace-nowrap flex-shrink-0 z-10">
          📊 行情快讯
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-ticker gap-8 py-2 px-4">
            {[...data, ...data].map((item, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap text-sm flex-shrink-0">
                <span className="text-gray-300">{item.name}</span>
                <span className="font-mono font-bold">{item.price}</span>
                <span className={item.trend === 'up' ? 'text-red-400' : item.trend === 'down' ? 'text-green-400' : 'text-gray-400'}>
                  {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '─'}
                  {item.change !== '0' ? item.change : ''} {item.changePercent}
                </span>
                <span className="text-gray-500 text-xs">{item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
