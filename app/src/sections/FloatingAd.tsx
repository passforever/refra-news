import React, { useState, useEffect } from 'react';

export interface AdConfig {
  title: string;
  description: string;
  linkUrl: string;
  imageUrl: string;
  enabled: boolean;
}

const AD_STORAGE_KEY = 'refra_floating_ad_config';
const AD_CLOSED_KEY = 'refra_floating_ad_closed';
const AD_SHOW_DELAY = 3000;
const AD_REAPPEAR_HOURS = 24;

const DEFAULT_AD_CONFIG: AdConfig = {
  title: '东豫科技 · 耐材服务专家',
  description: '钢铁行业新建及维修项目 · 专业耐火材料全流程服务 · 咨询热线：0371-XXXX-XXXX',
  linkUrl: '#',
  imageUrl: '',
  enabled: true,
};

function getAdConfig(): AdConfig {
  try {
    const stored = localStorage.getItem(AD_STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      return { ...DEFAULT_AD_CONFIG, ...config };
    }
  } catch { /* ignore */ }
  return DEFAULT_AD_CONFIG;
}

interface FloatingAdProps {
  position?: 'bottom-right' | 'bottom-left';
}

export const FloatingAd: React.FC<FloatingAdProps> = ({
  position = 'bottom-right',
}) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [config, setConfig] = useState<AdConfig>(DEFAULT_AD_CONFIG);

  useEffect(() => {
    const adConfig = getAdConfig();
    setConfig(adConfig);

    if (!adConfig.enabled) return;

    // 检查是否在关闭冷却期内
    const closedAt = localStorage.getItem(AD_CLOSED_KEY);
    if (closedAt) {
      const elapsed = Date.now() - parseInt(closedAt, 10);
      if (elapsed < AD_REAPPEAR_HOURS * 60 * 60 * 1000) {
        return;
      }
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, AD_SHOW_DELAY);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      localStorage.setItem(AD_CLOSED_KEY, Date.now().toString());
    }, 300);
  };

  if (!visible || !config.enabled) return null;

  const positionClass = position === 'bottom-left'
    ? 'bottom-6 left-6'
    : 'bottom-6 right-6';

  return (
    <div
      className={`fixed ${positionClass} z-50 transition-all duration-300 ${
        closing ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-72 max-w-[calc(100vw-3rem)]">
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors text-sm font-bold"
          aria-label="关闭广告"
        >
          ✕
        </button>

        {/* 广告内容 */}
        <a
          href={config.linkUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
          onClick={(e) => {
            if (!config.linkUrl || config.linkUrl === '#') e.preventDefault();
          }}
        >
          {/* 广告图片 */}
          {config.imageUrl ? (
            <div className="relative h-36 overflow-hidden">
              <img
                src={config.imageUrl}
                alt={config.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-10">
                <h4 className="text-white font-bold text-sm leading-snug">{config.title}</h4>
              </div>
            </div>
          ) : (
            /* 没有图片时显示纯文字版 */
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🔥</span>
                <h4 className="text-white font-bold text-sm">{config.title}</h4>
              </div>
            </div>
          )}

          {/* 描述 */}
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500 leading-relaxed">{config.description}</p>
            {config.linkUrl && config.linkUrl !== '#' && (
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium group-hover:text-blue-700">
                了解详情
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            )}
          </div>
        </a>
      </div>
    </div>
  );
};
