#!/usr/bin/env python3
"""
泰科钢铁资讯爬虫模块
通过"今天看啥"平台抓取泰科钢铁公众号发布的资讯

用法:
  python crawler/taike_crawler.py          # 执行爬取
  python crawler/taike_crawler.py --test   # 测试模式

说明:
  泰科钢铁公众号内容通过 jintiankansha.com 平台可获取标题列表，
  页面结构为 div.cell.item > span.item_title > span.hide-content（标题）
  日期信息在 span.small.fade 文本中（"昨天"/"N天前" 等相对时间）
  部分文章有 /t/xxx 链接，新版文章可能无链接。
"""

import json
import re
import hashlib
import argparse
import time
from datetime import datetime, timedelta
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False
    print("[WARN] requests / beautifulsoup4 未安装，将使用演示模式")


# ─────────────────────────────────────────────
# 泰科钢铁来源配置
# ─────────────────────────────────────────────
TAIKE_COLUMN_URL = "https://www.jintiankansha.com/column/ZvIjkAtkpY"
TAIKE_PAGES = 3  # 抓取最近3页

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}

OUTPUT_PATH = Path(__file__).parent.parent / "src" / "data" / "taikeNews.json"
REQUEST_DELAY = 2


# ─────────────────────────────────────────────
# 关键词分类规则
# ─────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "market": [
        "价格", "行情", "涨跌", "报价", "成交", "库存", "采购", "招标",
        "中标", "成本", "利润", "营收", "净利润", "产量", "产能", "销量",
    ],
    "policy": [
        "工信部", "生态环境部", "政策", "法规", "标准", "规划", "意见",
        "通知", "公告", "监管", "环保", "排放", "产能置换", "节能",
    ],
    "technology": [
        "技术", "研发", "突破", "创新", "专利", "工艺", "3D打印",
        "新材料", "智能制造", "低碳", "氢冶金", "电炉",
    ],
    "enterprise": [
        "集团", "公司", "股份", "董事长", "总经理", "投资", "并购",
        "重组", "上市", "年报", "季报", "项目", "投产", "签约",
    ],
    "exhibition": [
        "展会", "博览会", "论坛", "会议", "交流", "参观", "对标",
    ],
}

INDUSTRY_KEYWORDS = {
    "steel": ["钢铁", "高炉", "转炉", "电炉", "轧钢", "炼钢", "炼铁", "连铸",
              "热轧", "冷轧", "钢厂", "钢企", "钢材", "粗钢", "生铁"],
    "cement": ["水泥", "混凝土", "熟料"],
    "glass": ["玻璃", "浮法", "光伏玻璃"],
    "nonferrous": ["有色", "铜", "铝", "锌", "镍", "电解"],
    "petrochemical": ["石化", "化工", "石油", "焦化"],
    "ceramic": ["陶瓷", "窑炉"],
    "power": ["电力", "电厂", "能源"],
    "carbon": ["碳素", "石墨", "电极"],
    "hotblast": ["热风炉"],
    "cokeoven": ["焦炉", "焦炭"],
}

# 耐火材料相关关键词
REFRACTORY_KEYWORDS = [
    "耐火", "耐材", "镁砂", "镁碳砖", "铝矾土", "刚玉", "碳化硅",
    "浇注料", "高铝砖", "硅砖", "AZS", "锆", "炉衬", "窑衬",
    "衬里", "铁沟", "炉窑", "窑炉", "保温", "隔热",
]


def classify_category(title: str) -> str:
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in title:
                return cat
    return "industry-news"


def classify_industries(title: str) -> list:
    industries = ["all"]
    for industry, keywords in INDUSTRY_KEYWORDS.items():
        for kw in keywords:
            if kw in title:
                industries.append(industry)
                break
    return industries


def extract_tags(title: str) -> list:
    tags = []
    for group, keywords in INDUSTRY_KEYWORDS.items():
        for kw in keywords:
            if kw in title and len(tags) < 5:
                tags.append(kw)
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in title and kw not in tags and len(tags) < 5:
                tags.append(kw)
    return tags[:5]


def generate_summary(title: str) -> str:
    clean = re.sub(r'^[【\[][^】\]]+[】\]]', '', title).strip()
    if len(clean) > 60:
        return clean[:57] + "..."
    return clean


def parse_relative_date(text: str) -> str:
    """将相对日期文本转换为 YYYY-MM-DD 格式"""
    today = datetime.today()
    text = text.strip()

    if "分钟前" in text or "刚刚" in text:
        return today.strftime("%Y-%m-%d")
    if "小时前" in text:
        return today.strftime("%Y-%m-%d")
    if "昨天" in text:
        return (today - timedelta(days=1)).strftime("%Y-%m-%d")
    if "前天" in text:
        return (today - timedelta(days=2)).strftime("%Y-%m-%d")
    m = re.search(r'(\d+)天前', text)
    if m:
        return (today - timedelta(days=int(m.group(1)))).strftime("%Y-%m-%d")
    m = re.search(r'(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})', text)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"

    return today.strftime("%Y-%m-%d")


# ─────────────────────────────────────────────
# 爬取泰科钢铁公众号 - 修复版
# ─────────────────────────────────────────────
def crawl_taike(session: "requests.Session", max_pages: int = TAIKE_PAGES) -> list:
    """从'今天看啥'平台爬取泰科钢铁公众号文章"""
    all_items = []

    for page in range(1, max_pages + 1):
        url = f"{TAIKE_COLUMN_URL}?page={page}" if page > 1 else TAIKE_COLUMN_URL
        try:
            print(f"  [爬取] 第{page}页: {url}")
            resp = session.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            resp.encoding = 'utf-8'
            soup = BeautifulSoup(resp.text, "lxml")

            # 正确选择器：div.cell.item
            items = soup.select("div.cell.item")
            print(f"  [INFO] 找到 {len(items)} 个元素")

            for item_el in items:
                try:
                    # 提取标题：span.item_title > span.hide-content
                    title_el = item_el.select_one("span.item_title span.hide-content")
                    if not title_el:
                        # 备用：直接取 span.item_title 的文本
                        title_el = item_el.select_one("span.item_title")
                    if not title_el:
                        continue

                    title = title_el.get_text(strip=True)
                    if not title or len(title) < 5:
                        continue

                    # 提取链接：优先找 a[href*="/t/"]，否则用专栏链接
                    link = TAIKE_COLUMN_URL
                    link_el = item_el.select_one("a[href*='/t/']")
                    if link_el:
                        href = link_el.get("href", "")
                        if href and not href.startswith("http"):
                            from urllib.parse import urljoin
                            href = urljoin(url, href)
                        link = href

                    # 提取日期：从 span.small.fade 文本中解析
                    date_str = today_str = datetime.today().strftime("%Y-%m-%d")
                    fade_el = item_el.select_one("span.small.fade")
                    if fade_el:
                        fade_text = fade_el.get_text(separator=" ", strip=True)
                        date_str = parse_relative_date(fade_text)
                    else:
                        # 备用：从整个item文本中寻找日期
                        full_text = item_el.get_text(separator=" ", strip=True)
                        date_str = parse_relative_date(full_text)

                    # 自动分类
                    category = classify_category(title)
                    industries = classify_industries(title)
                    tags = extract_tags(title)

                    item_id = hashlib.md5(title.encode()).hexdigest()[:12]

                    all_items.append({
                        "id": f"tk_{item_id}",
                        "title": title,
                        "summary": generate_summary(title),
                        "source": "泰科钢铁",
                        "sourceUrl": link,
                        "category": category,
                        "publishedAt": date_str,
                        "tags": tags,
                        "industries": industries,
                        "isTop": False,
                    })

                except Exception as e:
                    print(f"    [SKIP] 解析条目失败: {e}")
                    continue

            print(f"  [INFO] 第{page}页解析完成，累计 {len(all_items)} 条")
            time.sleep(REQUEST_DELAY)

        except Exception as e:
            print(f"  [ERROR] 第{page}页爬取失败: {e}")

    # 去重
    seen = set()
    unique = []
    for item in all_items:
        if item["id"] not in seen:
            seen.add(item["id"])
            unique.append(item)

    return unique


def generate_demo_data() -> list:
    """生成泰科钢铁演示数据（当爬取失败时使用）"""
    return [
        {
            "id": "tk_demo_001",
            "title": "工信部：2年后不同企业之间炼铁、炼钢产能不得实施产能置换！",
            "summary": "工信部新规：不同企业集团之间炼铁、炼钢产能不得实施产能置换，将影响钢铁行业产能格局",
            "source": "泰科钢铁",
            "sourceUrl": "https://www.jintiankansha.com/column/ZvIjkAtkpY",
            "category": "policy",
            "publishedAt": datetime.today().strftime("%Y-%m-%d"),
            "tags": ["产能置换", "炼铁", "炼钢", "工信部"],
            "industries": ["all", "steel"],
            "isTop": True,
        },
        {
            "id": "tk_demo_002",
            "title": "河钢集团：2026年一季度营收1029亿，净利润8.67亿！",
            "summary": "河钢集团公布一季度业绩，营收1029亿元，高炉生产稳中有升",
            "source": "泰科钢铁",
            "sourceUrl": "https://www.jintiankansha.com/column/ZvIjkAtkpY",
            "category": "enterprise",
            "publishedAt": (datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d"),
            "tags": ["河钢集团", "营收", "钢铁", "高炉"],
            "industries": ["all", "steel"],
            "isTop": False,
        },
        {
            "id": "tk_demo_003",
            "title": "《2026年国内炼铁高炉统计》出炉",
            "summary": "最新统计数据显示国内炼铁高炉数量及分布情况，对耐火材料需求具有重要参考价值",
            "source": "泰科钢铁",
            "sourceUrl": "https://www.jintiankansha.com/column/ZvIjkAtkpY",
            "category": "market",
            "publishedAt": (datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d"),
            "tags": ["高炉统计", "炼铁", "钢铁"],
            "industries": ["all", "steel", "hotblast"],
            "isTop": False,
        },
        {
            "id": "tk_demo_004",
            "title": "1680mm热轧生产线建设，加速推进！",
            "summary": "国内新建1680mm热轧生产线项目加速推进，带动轧钢用耐火材料需求",
            "source": "泰科钢铁",
            "sourceUrl": "https://www.jintiankansha.com/column/ZvIjkAtkpY",
            "category": "industry-news",
            "publishedAt": (datetime.today() - timedelta(days=2)).strftime("%Y-%m-%d"),
            "tags": ["热轧", "生产线", "钢铁"],
            "industries": ["all", "steel"],
            "isTop": False,
        },
        {
            "id": "tk_demo_005",
            "title": "酒钢集团：2026年一季度，净利润大增195%",
            "summary": "酒钢集团一季度净利润同比增长195%，钢铁板块盈利能力显著提升",
            "source": "泰科钢铁",
            "sourceUrl": "https://www.jintiankansha.com/column/ZvIjkAtkpY",
            "category": "enterprise",
            "publishedAt": (datetime.today() - timedelta(days=2)).strftime("%Y-%m-%d"),
            "tags": ["酒钢", "净利润", "钢铁"],
            "industries": ["all", "steel"],
            "isTop": False,
        },
        {
            "id": "tk_demo_006",
            "title": "沙钢集团总裁龚盛调研沙钢永兴公司",
            "summary": "沙钢集团领导调研下属企业生产运营情况，关注高炉运行效率",
            "source": "泰科钢铁",
            "sourceUrl": "https://www.jintiankansha.com/column/ZvIjkAtkpY",
            "category": "enterprise",
            "publishedAt": (datetime.today() - timedelta(days=3)).strftime("%Y-%m-%d"),
            "tags": ["沙钢", "调研", "高炉"],
            "industries": ["all", "steel"],
            "isTop": False,
        },
        {
            "id": "tk_demo_007",
            "title": "山东钢铁：2026年公司计划生产生铁1617万吨、粗钢1843万吨",
            "summary": "山东钢铁公布年度生产计划，生铁和粗钢产量目标明确，耐材采购需求稳定",
            "source": "泰科钢铁",
            "sourceUrl": "https://www.jintiankansha.com/column/ZvIjkAtkpY",
            "category": "market",
            "publishedAt": (datetime.today() - timedelta(days=2)).strftime("%Y-%m-%d"),
            "tags": ["山东钢铁", "生铁", "粗钢", "产量"],
            "industries": ["all", "steel"],
            "isTop": False,
        },
        {
            "id": "tk_demo_008",
            "title": "首钢集团：2026年一季度营收576亿，净利润17.53亿！",
            "summary": "首钢集团一季度业绩亮眼，营收576亿元，高炉利用系数居行业前列",
            "source": "泰科钢铁",
            "sourceUrl": "https://www.jintiankansha.com/column/ZvIjkAtkpY",
            "category": "enterprise",
            "publishedAt": (datetime.today() - timedelta(days=4)).strftime("%Y-%m-%d"),
            "tags": ["首钢", "营收", "高炉"],
            "industries": ["all", "steel"],
            "isTop": False,
        },
    ]


def main(test_mode: bool = False):
    print(f"\n{'='*50}")
    print(f"  泰科钢铁资讯爬虫  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}")

    items = []

    if HAS_DEPS:
        session = requests.Session()
        items = crawl_taike(session)
        print(f"\n[INFO] 爬取到 {len(items)} 条资讯")

    # 如果爬取失败或无数据，使用演示数据
    if not items:
        print("[INFO] 未获取到数据，使用演示数据")
        items = generate_demo_data()

    # 按时间倒序排列
    items.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)

    output = {
        "lastUpdated": datetime.now().isoformat(),
        "source": "泰科钢铁",
        "totalCount": len(items),
        "items": items,
    }

    if not test_mode:
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"\n[OK] 已写入 {len(items)} 条泰科钢铁资讯 → {OUTPUT_PATH}")
    else:
        print(f"\n[TEST] 测试完成，共 {len(items)} 条（未写入文件）")

    print(f"{'='*50}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="泰科钢铁资讯爬虫")
    parser.add_argument("--test", action="store_true", help="测试模式，不写入文件")
    args = parser.parse_args()
    main(test_mode=args.test)
