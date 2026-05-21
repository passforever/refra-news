import React, { useState } from 'react';
import { MOCK_MARKET_DATA } from '@/data/mockData';

type TimeRange = 'daily' | 'monthly' | 'quarterly';

export const MarketPanel: React.FC = () => {
  const [activeRange, setActiveRange] = useState<TimeRange>('daily');

  const getTrendColor = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up': return 'bg-red-50 text-red-500';
      case 'down': return 'bg-green-50 text-green-500';
      default: return 'bg-gray-50 text-gray-400';
    }
  };

  const getTrendSymbol = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up': return '▲';
      case 'down': return '▼';
      default: return '─';
    }
  };

  const getChangeData = (item: typeof MOCK_MARKET_DATA[0]) => {
    switch (activeRange) {
      case 'monthly':
        return { change: item.monthlyChangePercent || '—', trend: item.monthlyTrend || 'flat' };
      case 'quarterly':
        return { change: item.quarterlyChangePercent || '—', trend: item.quarterlyTrend || 'flat' };
      default:
        return { change: item.changePercent, trend: item.trend };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="text-green-500">📊</span> 主要原料行情
          </h3>
        </div>
        {/* 时间维度切换 */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setActiveRange('daily')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              activeRange === 'daily'
                ? 'bg-blue-100 text-blue-600 font-medium'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            日涨跌
          </button>
          <button
            onClick={() => setActiveRange('monthly')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              activeRange === 'monthly'
                ? 'bg-blue-100 text-blue-600 font-medium'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            月度
          </button>
          <button
            onClick={() => setActiveRange('quarterly')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              activeRange === 'quarterly'
                ? 'bg-blue-100 text-blue-600 font-medium'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            季度
          </button>
        </div>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 text-xs text-gray-400 font-medium">
        <div className="col-span-5">品种</div>
        <div className="col-span-3 text-right">价格</div>
        <div className="col-span-4 text-right">
          {activeRange === 'daily' ? '日涨跌' : activeRange === 'monthly' ? '环比(%)' : '同比(%)'}
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {MOCK_MARKET_DATA.map((item, i) => {
          const { change, trend } = getChangeData(item);
          return (
            <div key={i} className="grid grid-cols-12 gap-2 px-5 py-3 hover:bg-blue-50/30 transition-colors items-center">
              <div className="col-span-5">
                <span className="text-sm text-gray-700 font-medium">{item.name}</span>
              </div>
              <div className="col-span-3 text-right">
                <div className="flex flex-col items-end">
                  <span className="font-mono font-bold text-gray-900 text-sm">{item.price}</span>
                  <span className="text-xs text-gray-400">{item.unit}</span>
                </div>
              </div>
              <div className="col-span-4 text-right">
                <span className={`inline-flex items-center gap-0.5 font-mono text-xs px-2 py-1 rounded ${
                  getTrendColor(trend)
                }`}>
                  {getTrendSymbol(trend)} {change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 图例说明 */}
      <div className="px-5 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>上涨
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>下跌
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>持平
            </span>
          </div>
          <span>仅供参考</span>
        </div>
      </div>
    </div>
  );
};
