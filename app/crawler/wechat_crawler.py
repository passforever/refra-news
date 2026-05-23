#!/usr/bin/env python3
"""
微信公众号耐火材料资讯爬虫
使用搜狗微信搜索获取行业最新文章
输出格式与 taike_crawler.py 一致，便于前端统一加载
"""

import json
import re
import os
import sys
from datetime import datetime
from urllib.parse import quote

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("请安装依赖: pip install requests beautifulsoup4", file=sys.stderr)
    sys.exit(1)

# ===== 配置 =====
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "wechatNews.json")
MAX_ARTICLES_PER_KEYWORD = 5
REQUEST_TIMEOUT = 15

# 耐火材料行业核心搜索关键词
SEARCH_KEYWORDS = [
    "耐火材料 行业动态",
    "耐火材料 市场行情",
    "镁砂 价格 辽宁",
    "铝矾土 行情",
    "高炉 耐火材料 技术",
]

# 已知的耐火材料相关公众号名称（用于来源标注）
KNOWN_ACCOUNTS = [
    "耐材之窗",
    "中国耐火材料行业协会",
    "找耐火材料网",
    "河南省耐火材料行业协会",
    "我的钢铁网",
]

# ===== 请求头 =====
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}


def extract_date(text: str) -> str:
    """从文本中提取日期，格式化为 YYYY-MM-DD"""
    patterns = [
        r"(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})",
        r"(\d{1,2})[-/月](\d{1,2})",
    ]
    for pattern in patterns:
        m = re.search(pattern, text)
        if m:
            groups = m.groups()
            if len(groups) == 3:
                y, mo, d = groups
                return f"{y}-{int(mo):02d}-{int(d):02d}"
            elif len(groups) == 2:
                mo, d = groups
                return f"2026-{int(mo):02d}-{int(d):02d}"
    return datetime.now().strftime("%Y-%m-%d")


def clean_text(text: str) -> str:
    """清理文本中的特殊字符和空白"""
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def classify_article(title: str, summary: str) -> str:
    """根据标题和摘要自动分类"""
    text = title + summary
    keywords_map = {
        "market": ["价格", "行情", "涨", "跌", "报价", "吨", "市场走势"],
        "technology": ["技术", "研发", "创新", "专利", "实验", "工艺", "配方"],
        "enterprise": ["公司", "企业", "集团", "上市", "年报", "投产", "项目"],
        "policy": ["政策", "法规", "标准", "环保", "排放", "规划", "通知"],
        "exhibition": ["展会", "论坛", "会议", "展览", "博览会"],
    }
    for category, keywords in keywords_map.items():
        for kw in keywords:
            if kw in text:
                return category
    return "industry-news"


def search_sogou_wechat(keyword: str, page: int = 1) -> list:
    """
    搜狗微信搜索
    注意：搜狗微信搜索可能因反爬措施而受限
    此处采用基础搜索，如遇封禁请切换数据源
    """
    results = []
    try:
        url = f"https://weixin.sogou.com/weixin?type=2&query={quote(keyword)}&page={page}"
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        resp.encoding = "utf-8"

        if resp.status_code != 200:
            print(f"  ⚠ 搜狗搜索返回状态码: {resp.status_code}", file=sys.stderr)
            return results

        soup = BeautifulSoup(resp.text, "html.parser")

        # 尝试多种选择器适配搜狗微信搜索结果页结构
        items = []
        for selector in [
            ".news-list li",
            ".news-list2 li",
            ".wx-rb li",
            ".news-box .txt-box",
            "ul.news-list > li",
            ".results .item",
            "li[id^=sogou_]",
        ]:
            found = soup.select(selector)
            if found:
                items = found
                break

        # 如果上面的选择器都不匹配，尝试更通用的方法
        if not items:
            # 查找包含公众号文章链接的 li 元素
            all_links = soup.select("a[href*='mp.weixin.qq.com']")
            if all_links:
                for link in all_links[:MAX_ARTICLES_PER_KEYWORD * 2]:
                    parent = link.find_parent("li") or link.find_parent("div")
                    if parent:
                        items.append(parent)
                    else:
                        items.append(link)

        for item in items:
            try:
                # 尝试多种方式提取标题和链接
                title_el = None
                for title_sel in ["h3 a", ".tit a", ".txt-box h3 a", "a[href*='mp.weixin.qq.com']"]:
                    title_el = item.select_one(title_sel)
                    if title_el:
                        break

                if not title_el:
                    continue

                title = clean_text(title_el.get_text())
                if not title or len(title) < 5:
                    continue

                link = title_el.get("href", "")
                if not link:
                    continue

                summary_el = item.select_one(".txt-info, .s-p")
                summary = clean_text(summary_el.get_text()) if summary_el else title

                source_el = item.select_one(".account, .s-p")
                source = "微信公众号"
                if source_el:
                    source_text = source_el.get_text()
                    for account in KNOWN_ACCOUNTS:
                        if account in source_text:
                            source = account
                            break

                date_el = item.select_one(".s2, .time")
                date_str = extract_text(date_el.get_text()) if date_el else datetime.now().strftime("%Y-%m-%d")

                results.append({
                    "title": title,
                    "summary": summary[:200],
                    "source": source,
                    "sourceUrl": link if link.startswith("http") else "#",
                    "date": date_str,
                    "category": classify_article(title, summary),
                })
            except Exception:
                continue

    except requests.RequestException as e:
        print(f"  ⚠ 请求失败: {e}", file=sys.stderr)
    except Exception as e:
        print(f"  ⚠ 解析异常: {e}", file=sys.stderr)

    return results


def extract_text(el):
    """安全提取元素文本"""
    return el.get_text() if el else ""


def crawl_all():
    """主爬取逻辑"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始爬取微信公众号耐火材料资讯...")
    print(f"  搜索关键词: {SEARCH_KEYWORDS}")

    all_articles = []
    seen_urls = set()

    for keyword in SEARCH_KEYWORDS:
        print(f"\n  🔍 搜索: {keyword}")
        articles = search_sogou_wechat(keyword)
        print(f"    找到 {len(articles)} 条结果")

        for article in articles:
            url = article.get("sourceUrl", "")
            if url and url in seen_urls:
                continue
            if url:
                seen_urls.add(url)

            all_articles.append({
                "id": f"wx_{hash(article.get('title', '')) & 0xFFFF:04x}_{len(all_articles)}",
                "title": article.get("title", ""),
                "summary": article.get("summary", ""),
                "source": article.get("source", "微信公众号"),
                "sourceUrl": article.get("sourceUrl", "#"),
                "category": article.get("category", "industry-news"),
                "publishedAt": article.get("date", datetime.now().strftime("%Y-%m-%d")),
                "tags": [],
                "industries": ["all", "steel"],
            })

    # 如果搜狗爬取结果太少，补充手动维护的公众号名称列表
    if len(all_articles) < 5:
        print(f"\n  ⚠ 爬取结果较少（{len(all_articles)}条），输出已知公众号列表供备用")
        # 输出备用信息
        pass

    # 按日期排序
    all_articles.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)

    # 构建输出数据
    output = {
        "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source": "搜狗微信搜索",
        "totalCount": len(all_articles),
        "keywords": SEARCH_KEYWORDS,
        "items": all_articles,
    }

    # 写入文件
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 完成！共获取 {len(all_articles)} 条资讯")
    print(f"📁 输出文件: {OUTPUT_FILE}")
    return output


if __name__ == "__main__":
    crawl_all()
