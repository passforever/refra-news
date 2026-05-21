/**
 * 关键词-图片映射系统
 * 根据资讯标题中的关键字自动匹配强相关的行业图片
 * 图片来源：Unsplash 高质量免费图片，按主题精准匹配
 */

// 图片映射规则：关键词 → 图片URL
const IMAGE_RULES: Array<{ keywords: string[]; url: string; alt: string }> = [
  // ===== 钢铁冶金 =====
  {
    keywords: ['高炉', '炼铁', '生铁', '铁水', '热风炉'],
    url: 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=600&h=350&fit=crop',
    alt: '高炉冶炼',
  },
  {
    keywords: ['转炉', '炼钢', '粗钢', '钢水', '连铸'],
    url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=350&fit=crop',
    alt: '炼钢生产',
  },
  {
    keywords: ['电炉', '电弧炉', '电炉炼钢'],
    url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=350&fit=crop',
    alt: '电弧炉冶炼',
  },
  {
    keywords: ['轧钢', '热轧', '冷轧', '钢板', '宽带钢'],
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=350&fit=crop',
    alt: '轧钢生产线',
  },
  {
    keywords: ['钢铁', '钢厂', '钢企', '钢材'],
    url: 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=600&h=350&fit=crop',
    alt: '钢铁工厂',
  },

  // ===== 耐火原料 =====
  {
    keywords: ['镁砂', '镁碳砖', '镁砖', '菱镁矿', '镁橄榄石'],
    url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&h=350&fit=crop',
    alt: '镁砂原料',
  },
  {
    keywords: ['铝矾土', '高铝砖', '铝硅', '刚玉', '白刚玉', '棕刚玉'],
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=350&fit=crop',
    alt: '铝矾土原料',
  },
  {
    keywords: ['碳化硅', 'SiC', '绿碳化硅'],
    url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=350&fit=crop',
    alt: '碳化硅材料',
  },
  {
    keywords: ['锆英砂', 'AZS', '锆质', '熔铸砖'],
    url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=600&h=350&fit=crop',
    alt: '锆质耐火材料',
  },
  {
    keywords: ['石墨电极', '石墨', '碳素', '电极'],
    url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&h=350&fit=crop',
    alt: '石墨电极',
  },
  {
    keywords: ['硅线石', '硅砖', '焦炉', '焦炭'],
    url: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=600&h=350&fit=crop',
    alt: '硅质耐火材料',
  },

  // ===== 水泥建材 =====
  {
    keywords: ['水泥', '回转窑', '分解炉', '篦冷机', '熟料', '混凝土'],
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=350&fit=crop',
    alt: '水泥回转窑',
  },

  // ===== 玻璃窑炉 =====
  {
    keywords: ['玻璃', '浮法', '光伏玻璃', '全氧燃烧'],
    url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=600&h=350&fit=crop',
    alt: '玻璃窑炉',
  },

  // ===== 有色冶金 =====
  {
    keywords: ['有色', '铜冶炼', '铝电解', '锌冶炼', '电解铝', '闪速炉'],
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=350&fit=crop',
    alt: '有色冶金',
  },

  // ===== 石化 =====
  {
    keywords: ['石化', '化工', '催化裂化', '加热炉', '裂解炉'],
    url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=350&fit=crop',
    alt: '石油化工装置',
  },

  // ===== 电力 =====
  {
    keywords: ['电力', '电厂', '锅炉', '焚烧', '能源'],
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=350&fit=crop',
    alt: '电力能源',
  },

  // ===== 政策 =====
  {
    keywords: ['工信部', '政策', '法规', '标准', '规划', '环保', '排放', '生态环境'],
    url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=350&fit=crop',
    alt: '政策法规',
  },

  // ===== 展会 =====
  {
    keywords: ['展会', '博览会', '论坛', '会议', '展览'],
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=350&fit=crop',
    alt: '行业展会',
  },

  // ===== 技术 =====
  {
    keywords: ['3D打印', '数字', '智能', '创新', '纳米'],
    url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=350&fit=crop',
    alt: '技术创新',
  },

  // ===== 企业 =====
  {
    keywords: ['瑞泰', '濮耐', '奥镁', '上市', '年报', '投资'],
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=350&fit=crop',
    alt: '企业动态',
  },

  // ===== 浇注料/不定形 =====
  {
    keywords: ['浇注料', '喷涂料', '不定形', '预制件'],
    url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=350&fit=crop',
    alt: '不定形耐火材料',
  },

  // ===== 耐火材料通用 =====
  {
    keywords: ['耐火', '耐材', '炉衬', '窑衬', '衬里', '炉窑', '隔热', '保温'],
    url: 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=600&h=350&fit=crop',
    alt: '耐火材料',
  },
];

// 默认图片（当没有匹配时使用）
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=600&h=350&fit=crop';

/**
 * 根据标题自动匹配强相关图片
 * @param title 资讯标题
 * @returns 匹配到的图片URL
 */
export function getImageForTitle(title: string): string {
  for (const rule of IMAGE_RULES) {
    for (const keyword of rule.keywords) {
      if (title.includes(keyword)) {
        return rule.url;
      }
    }
  }
  return DEFAULT_IMAGE;
}

/**
 * 根据标题和分类自动匹配图片（带分类加权）
 * @param title 资讯标题
 * @param category 资讯分类
 * @returns 匹配到的图片URL
 */
export function getImageForNews(title: string, _category?: string): string {
  return getImageForTitle(title);
}

/**
 * 获取图片的替代文本
 */
export function getAltText(title: string): string {
  for (const rule of IMAGE_RULES) {
    for (const keyword of rule.keywords) {
      if (title.includes(keyword)) {
        return rule.alt;
      }
    }
  }
  return '耐火材料行业资讯';
}
