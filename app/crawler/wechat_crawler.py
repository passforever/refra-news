#!/usr/bin/env python3
"""
微信公众号耐火材料资讯爬虫 v2
- 覆盖15+行业公众号来源
- 内容质量评分 & 去重
- 耐材关联度优先
- 摘要不再只是标题（从搜索摘要中提取真实内容）
"""

import json
import re
import os
import sys
import time
import hashlib
from datetime import datetime
from urllib.parse import quote

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("请安装依赖: pip install requests beautifulsoup4", file=sys.stderr)
    sys.exit(1)

# ===== 路径 =====
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "wechatNews.json")

# ===== 爬取配置 =====
MAX_ARTICLES_PER_KEYWORD = 8
REQUEST_TIMEOUT = 12
REQUEST_DELAY = 1.5   # 每次请求间隔（秒）

# ===== 搜索关键词（扩充，覆盖更多耐材相关议题）=====
SEARCH_KEYWORDS = [
    # 核心耐材
    "耐火材料 行业动态",
    "耐火材料 市场行情",
    "耐火材料 技术进展",
    "耐材 价格 采购",
    # 原料行情
    "镁砂 价格 辽宁",
    "铝矾土 行情 2026",
    "刚玉 莫来石 价格",
    "碳化硅 耐火",
    # 应用端（下游）
    "高炉 耐火材料",
    "转炉 炉衬 耐材",
    "电炉 炉衬 技术",
    "热风炉 砌砖",
    "焦炉 炉衬 修复",
    "水泥窑 耐火",
    # 关联行业
    "钢铁 耐材 采购",
    "耐材之窗 资讯",
    "中国耐火材料行业协会",
    "上海钢联 耐材",
    "冶金 耐火 新材料",
]

# ===== 目标公众号列表（来源标注 & 权重）=====
# weight: 1=普通, 2=专业耐材媒体(优先), 3=行业核心(最优先)
KNOWN_ACCOUNTS = {
    # 耐材专业来源（最高权重）
    "耐材之窗": 3,
    "中国耐火材料行业协会": 3,
    "找耐火材料网": 3,
    "上海钢联耐材网": 3,
    "河南省耐火材料行业协会": 2,
    # 钢铁/冶金专业来源（高权重）
    "世界金属导报": 2,
    "冶金传媒": 2,
    "冶金之家": 2,
    "炼铁技术": 2,
    "炼铁热风炉": 2,
    "焦化精英": 2,
    "京诚冶金公司": 2,
    "今日钢铁": 2,
    "海外钢铁": 2,
    "合金头条": 2,
    # 综合钢铁来源（普通权重）
    "我的钢铁网": 1,
    "泰科钢铁": 1,
}

# ===== 耐材核心关键词（用于关联度评分）=====
REFRACTORY_CORE = [
    "耐火材料", "耐材", "镁砂", "镁碳砖", "铝矾土", "刚玉", "莫来石",
    "碳化硅", "浇注料", "高铝砖", "硅砖", "AZS", "锆英石", "炉衬",
    "窑衬", "衬里", "铁沟料", "炉窑", "耐火砖", "不定形耐火", "隔热砖",
    "氧化铝空心球", "镁铬砖", "白刚玉", "棕刚玉", "电熔镁", "烧结镁",
]

REFRACTORY_SECONDARY = [
    "高炉", "转炉", "电炉", "热风炉", "焦炉", "水泥窑", "玻璃窑",
    "炉衬寿命", "烧损率", "热震稳定性", "荷重软化", "线变化率",
    "窑炉", "保温", "隔热", "砌筑", "喷补", "维修", "大修",
]

# ===== 低质量过滤关键词（包含则降权/过滤）=====
LOW_QUALITY_PATTERNS = [
    r"招聘", r"求职", r"岗位招募", r"内推",
    r"恭喜.*获奖", r"荣获.*奖", r"获得.*荣誉",
    r"元旦快乐", r"春节快乐", r"节日.*祝福",
    r"转发.*抽奖", r"点赞.*免费",
    r"扫码.*关注", r"长按.*二维码",
]

# ===== HTTP 请求头 =====
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
}


# ─────────────────────────────────────
# 工具函数
# ─────────────────────────────────────

def clean_text(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_date(text: str) -> str:
    patterns = [
        r"(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})",
        r"(\d{1,2})[-/月](\d{1,2})日?",
    ]
    for pattern in patterns:
        m = re.search(pattern, text)
        if m:
            groups = m.groups()
            if len(groups) == 3:
                return f"{groups[0]}-{int(groups[1]):02d}-{int(groups[2]):02d}"
            elif len(groups) == 2:
                year = datetime.now().year
                return f"{year}-{int(groups[0]):02d}-{int(groups[1]):02d}"
    return datetime.now().strftime("%Y-%m-%d")


def score_relevance(title: str, summary: str) -> int:
    """耐材关联度评分 (0-100)"""
    text = title + " " + summary
    score = 0
    for kw in REFRACTORY_CORE:
        if kw in text:
            score += 10
    for kw in REFRACTORY_SECONDARY:
        if kw in text:
            score += 4
    # 标题中有核心关键词额外加分
    for kw in REFRACTORY_CORE:
        if kw in title:
            score += 5
    return min(score, 100)


def is_low_quality(title: str, summary: str) -> bool:
    """判断是否为低质量内容"""
    text = title + summary
    for pattern in LOW_QUALITY_PATTERNS:
        if re.search(pattern, text):
            return True
    # 标题太短
    if len(title.strip()) < 8:
        return True
    return False


def get_source_weight(source_name: str) -> int:
    """获取来源权重"""
    for account, weight in KNOWN_ACCOUNTS.items():
        if account in source_name:
            return weight
    return 1


def classify_article(title: str, summary: str) -> str:
    text = title + summary
    mapping = {
        "market": ["价格", "行情", "涨", "跌", "报价", "采购", "成本", "利润", "库存"],
        "technology": ["技术", "研发", "创新", "专利", "工艺", "配方", "性能", "试验", "突破"],
        "enterprise": ["公司", "企业", "集团", "上市", "年报", "投产", "项目", "签约"],
        "policy": ["政策", "法规", "标准", "环保", "规划", "通知", "公告", "工信部"],
        "exhibition": ["展会", "论坛", "会议", "展览", "博览会", "研讨"],
    }
    for cat, kws in mapping.items():
        for kw in kws:
            if kw in text:
                return cat
    return "industry-news"


def make_article_id(title: str, source: str) -> str:
    raw = f"{title}|{source}"
    return "wx_" + hashlib.md5(raw.encode()).hexdigest()[:12]


def title_hash(title: str) -> str:
    """用于标题去重的简化哈希（忽略标点、空格）"""
    simplified = re.sub(r"[^\u4e00-\u9fa5a-zA-Z0-9]", "", title)
    return hashlib.md5(simplified.encode()).hexdigest()[:8]


# ─────────────────────────────────────
# 搜狗微信搜索
# ─────────────────────────────────────

def search_sogou_wechat(keyword: str, session: requests.Session) -> list:
    results = []
    try:
        url = f"https://weixin.sogou.com/weixin?type=2&query={quote(keyword)}&page=1"
        resp = session.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        resp.encoding = "utf-8"

        if resp.status_code != 200:
            print(f"  ⚠ 搜狗返回 {resp.status_code}", file=sys.stderr)
            return results

        soup = BeautifulSoup(resp.text, "html.parser")

        # 尝试多个选择器
        items = []
        for selector in [
            ".news-list li",
            ".news-list2 li",
            "ul.news-list > li",
            "li[id^=sogou_]",
        ]:
            found = soup.select(selector)
            if found:
                items = found
                break

        # 备用：通过微信链接找父元素
        if not items:
            links = soup.select("a[href*='mp.weixin.qq.com']")
            for link in links[:MAX_ARTICLES_PER_KEYWORD * 2]:
                parent = link.find_parent("li") or link.find_parent("div")
                if parent:
                    items.append(parent)

        for item in items[:MAX_ARTICLES_PER_KEYWORD]:
            try:
                # 提取标题
                title_el = None
                for sel in ["h3 a", ".tit a", "a[href*='mp.weixin.qq.com']"]:
                    title_el = item.select_one(sel)
                    if title_el:
                        break
                if not title_el:
                    continue

                title = clean_text(title_el.get_text())
                if not title or len(title) < 8:
                    continue

                link = title_el.get("href", "#")
                if not link.startswith("http"):
                    link = "#"

                # 提取摘要（真实摘要而不是标题复制）
                summary = ""
                for sum_sel in [".txt-info", ".s-p", "p.txt"]:
                    sum_el = item.select_one(sum_sel)
                    if sum_el:
                        raw = clean_text(sum_el.get_text())
                        # 过滤掉和标题完全相同或太短的摘要
                        if raw and raw != title and len(raw) > 15:
                            summary = raw[:200]
                            break
                # 如果没有真实摘要，用关键词扩展
                if not summary:
                    summary = f"本文涉及{keyword}相关内容，请点击查看详情。"

                # 提取来源（公众号名称）
                source = "微信公众号"
                for src_sel in [".account", ".s-p", ".media-name"]:
                    src_el = item.select_one(src_sel)
                    if src_el:
                        src_text = src_el.get_text(strip=True)
                        for account in KNOWN_ACCOUNTS:
                            if account in src_text:
                                source = account
                                break
                        if source != "微信公众号":
                            break

                # 提取日期
                date_str = datetime.now().strftime("%Y-%m-%d")
                for date_sel in [".s2", ".time", ".date"]:
                    date_el = item.select_one(date_sel)
                    if date_el:
                        date_str = extract_date(date_el.get_text())
                        break

                results.append({
                    "title": title,
                    "summary": summary,
                    "source": source,
                    "sourceUrl": link,
                    "date": date_str,
                    "category": classify_article(title, summary),
                    "relevance": score_relevance(title, summary),
                    "source_weight": get_source_weight(source),
                })

            except Exception:
                continue

    except requests.RequestException as e:
        print(f"  ⚠ 请求失败: {e}", file=sys.stderr)
    except Exception as e:
        print(f"  ⚠ 解析异常: {e}", file=sys.stderr)

    return results


# ─────────────────────────────────────
# 主爬取逻辑
# ─────────────────────────────────────

def crawl_all():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始爬取微信公众号耐火材料资讯...")

    session = requests.Session()
    session.headers.update(HEADERS)

    raw_articles = []
    seen_title_hashes = set()
    seen_urls = set()

    for keyword in SEARCH_KEYWORDS:
        print(f"\n  🔍 搜索: {keyword}")
        articles = search_sogou_wechat(keyword, session)
        print(f"    原始结果: {len(articles)} 条")

        for a in articles:
            # URL 去重
            url = a.get("sourceUrl", "#")
            if url != "#" and url in seen_urls:
                continue
            if url != "#":
                seen_urls.add(url)

            # 标题去重（相似标题视为同一条）
            th = title_hash(a["title"])
            if th in seen_title_hashes:
                continue
            seen_title_hashes.add(th)

            # 低质量过滤
            if is_low_quality(a["title"], a["summary"]):
                continue

            raw_articles.append(a)

        time.sleep(REQUEST_DELAY)

    print(f"\n  📊 去重&过滤后: {len(raw_articles)} 条")

    # 排序：耐材关联度 * 来源权重 综合评分
    raw_articles.sort(
        key=lambda x: x["relevance"] * x["source_weight"],
        reverse=True
    )

    # 构建最终输出，关联度>0的内容优先，最多保留100条
    final_articles = []
    for i, a in enumerate(raw_articles[:100]):
        final_articles.append({
            "id": make_article_id(a["title"], a["source"]),
            "title": a["title"],
            "summary": a["summary"],
            "source": a["source"],
            "sourceUrl": a["sourceUrl"],
            "category": a["category"],
            "publishedAt": a["date"],
            "tags": [],
            "industries": ["all", "steel"],
            "relevanceScore": a["relevance"],
        })

    # 写入文件
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output = {
        "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source": "微信公众号多源爬虫",
        "totalCount": len(final_articles),
        "keywords": SEARCH_KEYWORDS,
        "accounts": list(KNOWN_ACCOUNTS.keys()),
        "items": final_articles,
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 完成！共获取 {len(final_articles)} 条高质量耐材资讯")
    print(f"📁 输出: {OUTPUT_FILE}")
    return output


if __name__ == "__main__":
    crawl_all()
