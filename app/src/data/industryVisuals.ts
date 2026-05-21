/**
 * 专业行业视觉系统
 * 替代通用Unsplash图片，生成与高温/钢铁/耐材强相关的专业视觉
 * 
 * 方案：每个分类/关键词对应一组专业的渐变色+SVG图案+行业图标
 * 这比通用库存照片更专业、更稳定、加载更快
 */

// 行业视觉主题配置
export interface VisualTheme {
  gradient: string;         // CSS渐变背景
  iconPath: string;         // SVG图标路径
  patternId: string;        // 背景图案ID
  label: string;            // 图片标签
  accentColor: string;      // 强调色
}

// 关键词 → 视觉主题映射
const VISUAL_RULES: Array<{ keywords: string[]; theme: VisualTheme }> = [
  // ===== 钢铁冶金 - 火焰橙红 =====
  {
    keywords: ['高炉', '炼铁', '生铁', '铁水', '热风炉'],
    theme: {
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #e94560 100%)',
      iconPath: 'M12 2C8 2 5 5 5 9c0 3 2 5 4 6v3h6v-3c2-1 4-3 4-6 0-4-3-7-7-7zm-1 20h2v2h-2z',
      patternId: 'blast-furnace',
      label: '高炉冶炼',
      accentColor: '#e94560',
    },
  },
  {
    keywords: ['转炉', '炼钢', '粗钢', '钢水', '连铸'],
    theme: {
      gradient: 'linear-gradient(135deg, #2d1b00 0%, #5c3d1e 30%, #c76f30 70%, #ff9a3c 100%)',
      iconPath: 'M20 14h-4v-4h4v4zM12 6c-3.3 0-6 2.7-6 6h2c0-2.2 1.8-4 4-4V6zm8 6c0 4.4-3.6 8-8 8v-2c3.3 0 6-2.7 6-6h2z',
      patternId: 'converter',
      label: '转炉炼钢',
      accentColor: '#ff9a3c',
    },
  },
  {
    keywords: ['电炉', '电弧炉'],
    theme: {
      gradient: 'linear-gradient(135deg, #0a0a2e 0%, #1b1464 40%, #4a00e0 80%, #8e2de2 100%)',
      iconPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      patternId: 'electric-arc',
      label: '电弧炉',
      accentColor: '#8e2de2',
    },
  },
  {
    keywords: ['轧钢', '热轧', '冷轧', '钢板', '宽带钢', '钢材'],
    theme: {
      gradient: 'linear-gradient(135deg, #232526 0%, #414345 40%, #a8c0ff 100%)',
      iconPath: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
      patternId: 'rolling',
      label: '轧钢产线',
      accentColor: '#a8c0ff',
    },
  },
  {
    keywords: ['钢铁', '钢厂', '钢企'],
    theme: {
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #e94560 50%, #0f3460 100%)',
      iconPath: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
      patternId: 'steel-mill',
      label: '钢铁工厂',
      accentColor: '#e94560',
    },
  },

  // ===== 耐火原料 - 矿石质感 =====
  {
    keywords: ['镁砂', '镁碳砖', '镁砖', '菱镁矿', '镁橄榄石'],
    theme: {
      gradient: 'linear-gradient(135deg, #1a0a2e 0%, #3d1c56 30%, #7b2ff7 60%, #c471f5 100%)',
      iconPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      patternId: 'magnesia',
      label: '镁质耐材',
      accentColor: '#c471f5',
    },
  },
  {
    keywords: ['铝矾土', '高铝砖', '铝硅', '刚玉', '白刚玉', '棕刚玉'],
    theme: {
      gradient: 'linear-gradient(135deg, #2d1b00 0%, #6b3a0a 30%, #d4a574 70%, #f5e6d3 100%)',
      iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z',
      patternId: 'bauxite',
      label: '铝硅质耐材',
      accentColor: '#d4a574',
    },
  },
  {
    keywords: ['碳化硅', 'SiC', '绿碳化硅'],
    theme: {
      gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 100%)',
      iconPath: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      patternId: 'silicon-carbide',
      label: '碳化硅',
      accentColor: '#6366f1',
    },
  },
  {
    keywords: ['锆英砂', 'AZS', '锆质', '熔铸砖'],
    theme: {
      gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b3a4b 30%, #3d8b7a 60%, #92d1c5 100%)',
      iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      patternId: 'zircon',
      label: '锆质耐材',
      accentColor: '#92d1c5',
    },
  },
  {
    keywords: ['石墨电极', '石墨', '碳素', '电极'],
    theme: {
      gradient: 'linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #4d4d4d 60%, #666666 100%)',
      iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
      patternId: 'graphite',
      label: '碳素石墨',
      accentColor: '#9ca3af',
    },
  },
  {
    keywords: ['硅线石', '硅砖', '焦炉', '焦炭'],
    theme: {
      gradient: 'linear-gradient(135deg, #1a0a00 0%, #5c2e00 30%, #b87333 70%, #daa06d 100%)',
      iconPath: 'M4 22h16V10l-6-6H4v18zm2-2V6h7v5h5v9H6z',
      patternId: 'silica',
      label: '硅质耐材',
      accentColor: '#daa06d',
    },
  },

  // ===== 水泥建材 =====
  {
    keywords: ['水泥', '回转窑', '分解炉', '篦冷机', '熟料', '混凝土'],
    theme: {
      gradient: 'linear-gradient(135deg, #3a3d40 0%, #636f73 30%, #a8b5b7 70%, #e0e5e6 100%)',
      iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8h3c0 2.76 2.24 5 5 5v3z',
      patternId: 'cement',
      label: '水泥建材',
      accentColor: '#a8b5b7',
    },
  },

  // ===== 玻璃窑炉 =====
  {
    keywords: ['玻璃', '浮法', '光伏玻璃', '全氧燃烧'],
    theme: {
      gradient: 'linear-gradient(135deg, #0c1445 0%, #1e3a8a 30%, #3b82f6 60%, #93c5fd 100%)',
      iconPath: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zm-8-1h2v-3h3v-2h-3V9h-2v3H9v2h3z',
      patternId: 'glass',
      label: '玻璃窑炉',
      accentColor: '#93c5fd',
    },
  },

  // ===== 有色冶金 =====
  {
    keywords: ['有色', '铜冶炼', '铝电解', '锌冶炼', '电解铝', '闪速炉'],
    theme: {
      gradient: 'linear-gradient(135deg, #1a0a00 0%, #b45309 30%, #f59e0b 70%, #fbbf24 100%)',
      iconPath: 'M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7 3.5v7.64l-7 3.5-7-3.5V7.68l7-3.5z',
      patternId: 'nonferrous',
      label: '有色冶金',
      accentColor: '#fbbf24',
    },
  },

  // ===== 石化 =====
  {
    keywords: ['石化', '化工', '催化裂化', '加热炉', '裂解炉'],
    theme: {
      gradient: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 30%, #2563eb 70%, #60a5fa 100%)',
      iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      patternId: 'petrochemical',
      label: '石油化工',
      accentColor: '#60a5fa',
    },
  },

  // ===== 电力 =====
  {
    keywords: ['电力', '电厂', '锅炉', '焚烧', '能源'],
    theme: {
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e40af 30%, #f59e0b 70%, #fcd34d 100%)',
      iconPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      patternId: 'power',
      label: '电力能源',
      accentColor: '#fcd34d',
    },
  },

  // ===== 政策 =====
  {
    keywords: ['工信部', '政策', '法规', '标准', '规划', '环保', '排放', '生态环境'],
    theme: {
      gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 70%, #818cf8 100%)',
      iconPath: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z',
      patternId: 'policy',
      label: '政策法规',
      accentColor: '#818cf8',
    },
  },

  // ===== 展会 =====
  {
    keywords: ['展会', '博览会', '论坛', '会议', '展览'],
    theme: {
      gradient: 'linear-gradient(135deg, #172554 0%, #1e40af 30%, #2563eb 60%, #3b82f6 100%)',
      iconPath: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
      patternId: 'exhibition',
      label: '行业展会',
      accentColor: '#3b82f6',
    },
  },

  // ===== 技术 =====
  {
    keywords: ['3D打印', '数字', '智能', '创新', '纳米'],
    theme: {
      gradient: 'linear-gradient(135deg, #0c0a1d 0%, #1a1145 30%, #6d28d9 70%, #a78bfa 100%)',
      iconPath: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
      patternId: 'tech',
      label: '技术创新',
      accentColor: '#a78bfa',
    },
  },

  // ===== 企业 =====
  {
    keywords: ['瑞泰', '濮耐', '奥镁', '上市', '年报', '投资'],
    theme: {
      gradient: 'linear-gradient(135deg, #042f2e 0%, #0f766e 30%, #14b8a6 70%, #5eead4 100%)',
      iconPath: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
      patternId: 'enterprise',
      label: '企业动态',
      accentColor: '#5eead4',
    },
  },

  // ===== 浇注料/不定形 =====
  {
    keywords: ['浇注料', '喷涂料', '不定形', '预制件'],
    theme: {
      gradient: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 30%, #a855f7 70%, #d8b4fe 100%)',
      iconPath: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
      patternId: 'monolithic',
      label: '不定形耐材',
      accentColor: '#d8b4fe',
    },
  },

  // ===== 耐火材料通用 =====
  {
    keywords: ['耐火', '耐材', '炉衬', '窑衬', '衬里', '炉窑', '隔热', '保温'],
    theme: {
      gradient: 'linear-gradient(135deg, #1a0a00 0%, #7c2d12 30%, #c2410c 60%, #fb923c 100%)',
      iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      patternId: 'refractory',
      label: '耐火材料',
      accentColor: '#fb923c',
    },
  },
];

// 默认行业视觉主题（高温窑炉通用）
const DEFAULT_THEME: VisualTheme = {
  gradient: 'linear-gradient(135deg, #1a0a00 0%, #7c2d12 30%, #c2410c 60%, #fb923c 100%)',
  iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  patternId: 'default',
  label: '高温工业',
  accentColor: '#fb923c',
};

/**
 * 根据标题匹配视觉主题
 */
export function getVisualThemeForTitle(title: string): VisualTheme {
  for (const rule of VISUAL_RULES) {
    for (const keyword of rule.keywords) {
      if (title.includes(keyword)) {
        return rule.theme;
      }
    }
  }
  return DEFAULT_THEME;
}

/**
 * 根据分类ID匹配视觉主题
 */
export function getVisualThemeForCategory(categoryId: string): VisualTheme {
  const categoryMap: Record<string, string> = {
    'industry-news': '钢铁',
    'market': '耐火',
    'technology': '3D打印',
    'enterprise': '上市',
    'policy': '政策',
    'exhibition': '展会',
    'recommend': '耐火',
  };
  const keyword = categoryMap[categoryId] || '耐火';
  return getVisualThemeForTitle(keyword);
}

/**
 * 生成专业行业视觉SVG
 * 返回一个SVG字符串，可直接用作img src或内联渲染
 */
export function generateIndustrySVG(
  title: string,
  width: number = 600,
  height: number = 350
): string {
  const theme = getVisualThemeForTitle(title);

  // 生成工业网格图案
  const gridLines = generateGridPattern(width, height);
  // 生成装饰元素
  const decorations = generateDecorations(theme, width, height);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg_${theme.patternId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${extractGradientColor(theme.gradient, 0)}"/>
        <stop offset="50%" style="stop-color:${extractGradientColor(theme.gradient, 50)}"/>
        <stop offset="100%" style="stop-color:${extractGradientColor(theme.gradient, 100)}"/>
      </linearGradient>
      <filter id="glow_${theme.patternId}">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <!-- 背景 -->
    <rect width="${width}" height="${height}" fill="url(#bg_${theme.patternId})"/>
    <!-- 网格 -->
    ${gridLines}
    <!-- 装饰 -->
    ${decorations}
    <!-- 图标 -->
    <g transform="translate(${width * 0.15}, ${height * 0.2}) scale(3)" filter="url(#glow_${theme.patternId})">
      <path d="${theme.iconPath}" fill="rgba(255,255,255,0.9)"/>
    </g>
    <!-- 标签 -->
    <rect x="${width - 120}" y="${height - 40}" width="110" height="28" rx="4" fill="rgba(0,0,0,0.3)"/>
    <text x="${width - 65}" y="${height - 21}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="11" font-family="system-ui, sans-serif">${theme.label}</text>
  </svg>`;
}

/**
 * 生成数据URI格式的SVG图片
 * 可以直接用于 img src 或 CSS background
 */
export function getIndustryImageURI(title: string, width: number = 600, height: number = 350): string {
  const svg = generateIndustrySVG(title, width, height);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ===== 辅助函数 =====

function extractGradientColor(_gradient: string, position: number): string {
  const colorMap: Record<string, Record<number, string>> = {
    // 高炉 - 火焰红
    'blast-furnace': { 0: '#1a1a2e', 50: '#0f3460', 100: '#e94560' },
    'steel-mill': { 0: '#1a1a2e', 50: '#e94560', 100: '#0f3460' },
    // 转炉 - 橙色
    'converter': { 0: '#2d1b00', 50: '#c76f30', 100: '#ff9a3c' },
    // 电弧炉 - 紫色闪电
    'electric-arc': { 0: '#0a0a2e', 50: '#4a00e0', 100: '#8e2de2' },
    // 轧钢
    'rolling': { 0: '#232526', 50: '#414345', 100: '#a8c0ff' },
    // 镁质
    'magnesia': { 0: '#1a0a2e', 50: '#7b2ff7', 100: '#c471f5' },
    // 铝硅质
    'bauxite': { 0: '#2d1b00', 50: '#d4a574', 100: '#f5e6d3' },
    // 碳化硅
    'silicon-carbide': { 0: '#0f0c29', 50: '#302b63', 100: '#6366f1' },
    // 锆质
    'zircon': { 0: '#0d1b2a', 50: '#3d8b7a', 100: '#92d1c5' },
    // 石墨
    'graphite': { 0: '#1a1a1a', 50: '#4d4d4d', 100: '#666666' },
    // 硅质
    'silica': { 0: '#1a0a00', 50: '#b87333', 100: '#daa06d' },
    // 水泥
    'cement': { 0: '#3a3d40', 50: '#a8b5b7', 100: '#e0e5e6' },
    // 玻璃
    'glass': { 0: '#0c1445', 50: '#3b82f6', 100: '#93c5fd' },
    // 有色
    'nonferrous': { 0: '#1a0a00', 50: '#f59e0b', 100: '#fbbf24' },
    // 石化
    'petrochemical': { 0: '#0a1628', 50: '#2563eb', 100: '#60a5fa' },
    // 电力
    'power': { 0: '#0f172a', 50: '#1e40af', 100: '#fcd34d' },
    // 政策
    'policy': { 0: '#1e1b4b', 50: '#4338ca', 100: '#818cf8' },
    // 展会
    'exhibition': { 0: '#172554', 50: '#2563eb', 100: '#3b82f6' },
    // 技术
    'tech': { 0: '#0c0a1d', 50: '#6d28d9', 100: '#a78bfa' },
    // 企业
    'enterprise': { 0: '#042f2e', 50: '#14b8a6', 100: '#5eead4' },
    // 不定形
    'monolithic': { 0: '#3b0764', 50: '#a855f7', 100: '#d8b4fe' },
    // 耐火通用
    'refractory': { 0: '#1a0a00', 50: '#c2410c', 100: '#fb923c' },
  };

  const theme = getVisualThemeForTitle('');
  const colors = colorMap[theme.patternId] || colorMap['refractory']!;
  return colors[position] || colors[50] || '#333333';
}

function generateGridPattern(width: number, height: number): string {
  let lines = '';
  // 水平线
  for (let y = 40; y < height; y += 50) {
    lines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>`;
  }
  // 垂直线
  for (let x = 40; x < width; x += 50) {
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>`;
  }
  return lines;
}

function generateDecorations(theme: VisualTheme, width: number, height: number): string {
  let dec = '';
  // 右上角光晕
  dec += `<circle cx="${width * 0.85}" cy="${height * 0.15}" r="80" fill="${theme.accentColor}" opacity="0.08"/>`;
  dec += `<circle cx="${width * 0.85}" cy="${height * 0.15}" r="50" fill="${theme.accentColor}" opacity="0.12"/>`;
  // 左下角光晕
  dec += `<circle cx="${width * 0.1}" cy="${height * 0.85}" r="60" fill="rgba(255,255,255,0.03)"/>`;
  // 数据装饰线
  dec += `<line x1="${width * 0.55}" y1="${height * 0.6}" x2="${width * 0.85}" y2="${height * 0.35}" stroke="${theme.accentColor}" stroke-width="1" opacity="0.15"/>`;
  dec += `<line x1="${width * 0.6}" y1="${height * 0.7}" x2="${width * 0.9}" y2="${height * 0.4}" stroke="${theme.accentColor}" stroke-width="0.5" opacity="0.1"/>`;
  // 装饰小点
  for (let i = 0; i < 6; i++) {
    const x = width * 0.5 + Math.sin(i * 1.2) * width * 0.25;
    const y = height * 0.5 + Math.cos(i * 1.5) * height * 0.3;
    dec += `<circle cx="${x}" cy="${y}" r="2" fill="${theme.accentColor}" opacity="0.2"/>`;
  }
  return dec;
}
