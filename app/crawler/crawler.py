#!/usr/bin/env python3
"""
耐火材料资讯爬虫脚本
每日自动爬取权威资讯网站并更新 src/data/newsData.json

用法:
  python crawler/crawler.py          # 执行爬取
  python crawler/crawler.py --test   # 测试模式（不写入文件）

依赖安装:
  pip install requests beautifulsoup4 lxml fake-useragent schedule

配置 GitHub Actions 实现每日自动执行：见 .github/workflows/crawler.yml
"""

import json
import os
import re
import time
import uuid
import hashlib
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

try:
    import requests
    from bs4 import BeautifulSoup
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False
    print("[WARN] requests / beautifulsoup4 未安装，将使用演示模式输出示例数据结构")


# ─────────────────────────────────────────────
# 耐材关联度关键词
# ─────────────────────────────────────────────
REFRACTORY_CORE = [
    "耐火材料", "耐材", "镁砂", "镁碳砖", "铝矾土", "刚玉", "莫来石",
    "碳化硅", "浇注料", "高铝砖", "硅砖", "AZS", "锆", "炉衬",
    "窑衬", "衬里", "铁沟", "耐火砖", "不定形耐火", "隔热砖",
    "白刚玉", "棕刚玉", "电熔镁", "烧结镁", "镁铬砖",
]
REFRACTORY_SECONDARY = [
    "高炉", "转炉", "电炉", "热风炉", "焦炉", "水泥窑", "玻璃窑",
    "炉衬寿命", "砌筑", "喷补", "窑炉", "保温材料", "炉窑大修",
]

LOW_QUALITY_PATTERNS = [
    r"招聘", r"求职", r"元旦快乐", r"春节快乐", r"节日祝福",
    r"转发.*抽奖", r"扫码.*关注",
]


def score_relevance(title: str, summary: str = "") -> int:
    text = title + " " + summary
    score = 0
    for kw in REFRACTORY_CORE:
        if kw in text:
            score += 10
        if kw in title:
            score += 5
    for kw in REFRACTORY_SECONDARY:
        if kw in text:
            score += 4
    return min(score, 100)


def is_low_quality(title: str) -> bool:
    for p in LOW_QUALITY_PATTERNS:
        if re.search(p, title):
            return True
    return len(title.strip()) < 8


def title_hash(title: str) -> str:
    simplified = re.sub(r"[^\u4e00-\u9fa5a-zA-Z0-9]", "", title)
    return hashlib.md5(simplified.encode()).hexdigest()[:8]


def build_rich_summary(title: str, source_name: str, category: str) -> str:
    """根据标题关键词生成更丰富的摘要描述"""
    # 提取标题中的核心信息
    clean = re.sub(r'^[【\[][^】\]]+[】\]]', '', title).strip()

    # 按关键词补充上下文
    ctx_map = [
        (["耐火材料", "耐材"], "耐火材料行业动态："),
        (["镁砂", "铝矾土", "刚玉"], "耐火原料市场："),
        (["高炉", "转炉", "电炉", "热风炉"], "冶金炉窑用耐火材料相关："),
        (["水泥窑", "玻璃窑"], "窑炉用耐材相关："),
        (["价格", "行情", "报价"], "市场行情："),
        (["政策", "标准", "法规"], "行业政策："),
        (["技术", "研发", "创新"], "技术动态："),
    ]
    prefix = ""
    for kws, label in ctx_map:
        if any(kw in title for kw in kws):
            prefix = label
            break

    summary = f"{prefix}{clean}"
    if source_name and source_name not in summary:
        summary += f"（来源：{source_name}）"
    return summary[:200]


# ─────────────────────────────────────────────
# 爬虫目标配置
# ─────────────────────────────────────────────
SOURCES = [
    {
        "name": "中国耐火材料工业协会",
        "url": "http://www.chinafire.org.cn/news/",
        "category": "industry-news",
        "industries": ["all"],
        "list_selector": "ul.news-list li",
        "title_selector": "a",
        "link_selector": "a",
        "date_selector": "span.date",
    },
    {
        "name": "耐火材料网",
        "url": "http://www.refractories.com.cn/news/list.html",
        "category": "industry-news",
        "industries": ["all"],
        "list_selector": ".news-list .item",
        "title_selector": ".title a",
        "link_selector": ".title a",
        "date_selector": ".date",
    },
    {
        "name": "大宗商品头条（耐火原料）",
        "url": "https://www.mysteel.com/tags/%E8%80%90%E7%81%AB%E6%9D%90%E6%96%99/",
        "category": "market",
        "industries": ["all"],
        "list_selector": "ul.list-view li",
        "title_selector": "a.title",
        "link_selector": "a.title",
        "date_selector": "span.time",
    },
    {
        "name": "水泥工业网",
        "url": "https://www.ccement.com/news/list/",
        "category": "industry-news",
        "industries": ["cement"],
        "list_selector": ".news-list li",
        "title_selector": "a",
        "link_selector": "a",
        "date_selector": ".date",
    },
    {
        "name": "中国玻璃网",
        "url": "https://www.chinaglass.com/news/",
        "category": "industry-news",
        "industries": ["glass"],
        "list_selector": ".news-list li",
        "title_selector": "a",
        "link_selector": "a",
        "date_selector": ".date",
    },
    {
        "name": "生态环境部（政策）",
        "url": "https://www.mee.gov.cn/zcwj/",
        "category": "policy",
        "industries": ["all"],
        "list_selector": "ul.list li",
        "title_selector": "a",
        "link_selector": "a",
        "date_selector": "span",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
}

OUTPUT_PATH = Path(__file__).parent.parent / "src" / "data" / "newsData.json"
MAX_ITEMS_PER_SOURCE = 10
REQUEST_DELAY = 2  # seconds between requests


# ─────────────────────────────────────────────
# 爬取单个来源
# ─────────────────────────────────────────────
def crawl_source(source: dict, session: "requests.Session") -> list[dict]:
    items = []
    try:
        resp = session.get(source["url"], headers=HEADERS, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        rows = soup.select(source["list_selector"])[:MAX_ITEMS_PER_SOURCE]

        for row in rows:
            try:
                title_el = row.select_one(source["title_selector"])
                link_el = row.select_one(source["link_selector"])
                date_el = row.select_one(source["date_selector"])

                if not title_el:
                    continue

                title = title_el.get_text(strip=True)
                href = link_el.get("href", "#") if link_el else "#"
                # 补全相对链接
                if href and not href.startswith("http"):
                    from urllib.parse import urljoin
                    href = urljoin(source["url"], href)

                date_str = date_el.get_text(strip=True) if date_el else datetime.today().strftime("%Y-%m-%d")

                if not title or len(title) < 5:
                    continue

                if is_low_quality(title):
                    continue

                item_id = hashlib.md5(title.encode()).hexdigest()[:12]
                summary = build_rich_summary(title, source["name"], source["category"])
                relevance = score_relevance(title, summary)

                items.append({
                    "id": item_id,
                    "title": title,
                    "summary": summary,
                    "source": source["name"],
                    "sourceUrl": href,
                    "category": source["category"],
                    "publishedAt": date_str,
                    "tags": [],
                    "industries": source["industries"],
                    "isTop": False,
                    "relevanceScore": relevance,
                })
            except Exception as e:
                print(f"  [SKIP] 解析条目失败: {e}")
                continue

        print(f"  ✓ {source['name']}: 获取 {len(items)} 条")
    except Exception as e:
        print(f"  ✗ {source['name']} 爬取失败: {e}")

    return items


# ─────────────────────────────────────────────
# 合并 & 去重
# ─────────────────────────────────────────────
def deduplicate(old_items: list[dict], new_items: list[dict]) -> list[dict]:
    seen_ids = {item["id"] for item in old_items}
    seen_title_hashes = {title_hash(item["title"]) for item in old_items}

    unique_new = []
    for item in new_items:
        if item["id"] in seen_ids:
            continue
        th = title_hash(item["title"])
        if th in seen_title_hashes:
            continue
        seen_ids.add(item["id"])
        seen_title_hashes.add(th)
        unique_new.append(item)

    # 保留旧数据最近 90 天
    cutoff = (datetime.today() - timedelta(days=90)).strftime("%Y-%m-%d")
    old_filtered = [item for item in old_items if item.get("publishedAt", "9999") >= cutoff]
    all_items = unique_new + old_filtered

    # 按耐材关联度 + 时间排序
    all_items.sort(key=lambda x: (
        x.get("relevanceScore", 0),
        x.get("publishedAt", ""),
    ), reverse=True)
    return all_items[:500]  # 最多保留 500 条


# ─────────────────────────────────────────────
# 主流程
# ─────────────────────────────────────────────
def main(test_mode: bool = False):
    print(f"\n{'='*50}")
    print(f"  耐火材料资讯爬虫  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}")

    if not HAS_DEPS:
        print("[演示] 依赖未安装，生成示例数据结构...")
        demo_data = {
            "lastUpdated": datetime.now().isoformat(),
            "totalCount": 0,
            "items": [],
        }
        if not test_mode:
            OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
                json.dump(demo_data, f, ensure_ascii=False, indent=2)
            print(f"[OK] 已写入: {OUTPUT_PATH}")
        return

    session = requests.Session()
    all_new_items = []

    for source in SOURCES:
        print(f"\n[爬取] {source['name']}")
        items = crawl_source(source, session)
        all_new_items.extend(items)
        time.sleep(REQUEST_DELAY)

    # 读取旧数据
    old_items = []
    if OUTPUT_PATH.exists():
        try:
            with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
                old_data = json.load(f)
                old_items = old_data.get("items", [])
            print(f"\n[INFO] 已有历史数据 {len(old_items)} 条")
        except Exception:
            pass

    merged = deduplicate(old_items, all_new_items)
    output = {
        "lastUpdated": datetime.now().isoformat(),
        "totalCount": len(merged),
        "items": merged,
    }

    if not test_mode:
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"\n[OK] 已写入 {len(merged)} 条资讯 → {OUTPUT_PATH}")
    else:
        print(f"\n[TEST] 测试完成，共获取 {len(all_new_items)} 条新资讯（未写入文件）")

    print(f"{'='*50}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="耐火材料资讯爬虫")
    parser.add_argument("--test", action="store_true", help="测试模式，不写入文件")
    args = parser.parse_args()
    main(test_mode=args.test)
