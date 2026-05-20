# 耐火材料资讯平台

一个基于 React + TypeScript + Vite + Tailwind CSS 的耐火材料行业资讯聚合平台，支持每日自动爬取权威资讯，按行业精准推送。

## 功能特性

- 🏭 **行业精准筛选**：覆盖钢铁冶金、水泥建材、玻璃窑炉、有色冶金、石油化工、陶瓷建材、电力能源、碳素焦化等八大行业
- 📰 **多维资讯分类**：推荐、行业新闻、市场行情、技术前沿、企业动态、政策法规、展会活动
- 📊 **原料行情快讯**：实时滚动展示镁砂、刚玉、碳化硅等主要原料价格
- 🕷️ **每日自动爬取**：通过 GitHub Actions 在每天北京时间凌晨 02:00 自动爬取更新
- 🔍 **全文搜索**：支持标题、摘要、标签的即时搜索过滤
- 📱 **响应式设计**：适配桌面端和移动端

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **爬虫**：Python 3.12 + requests + BeautifulSoup4
- **CI/CD**：GitHub Actions（每日自动爬取 + 构建 + 部署）
- **托管**：GitHub Pages

## 快速开始

### 本地开发

```bash
cd app
npm install
npm run dev
```

### 本地构建

```bash
cd app
npm run build
```

### 手动运行爬虫

```bash
pip install -r app/crawler/requirements.txt
python app/crawler/crawler.py

# 测试模式（不写文件）
python app/crawler/crawler.py --test
```

## 部署到 GitHub Pages

### 1. 创建 GitHub 仓库

```bash
git init
git add .
git commit -m "feat: 初始化耐火材料资讯平台"
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 2. 启用 GitHub Pages

进入仓库 **Settings → Pages**，将 **Source** 设置为 `gh-pages` 分支。

### 3. 自动部署

每次 push 或每日凌晨 02:00（北京时间），GitHub Actions 会自动：
1. 执行 Python 爬虫脚本爬取最新资讯
2. 构建 React 前端
3. 部署到 GitHub Pages

也可以在 **Actions** 页面手动触发工作流。

## 目录结构

```
.
├── .github/
│   └── workflows/
│       └── crawler.yml          # GitHub Actions 自动化配置
├── app/
│   ├── crawler/
│   │   ├── crawler.py           # Python 爬虫脚本
│   │   └── requirements.txt     # Python 依赖
│   ├── src/
│   │   ├── data/
│   │   │   ├── mockData.ts      # 演示数据 + 常量配置
│   │   │   └── newsData.json    # 爬虫输出（自动生成）
│   │   ├── hooks/
│   │   │   └── useNews.ts       # 新闻数据 Hook
│   │   ├── sections/            # 页面组件
│   │   ├── types/               # TypeScript 类型定义
│   │   └── App.tsx              # 主应用入口
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 扩展爬虫来源

在 `app/crawler/crawler.py` 的 `SOURCES` 列表中添加新来源配置即可：

```python
{
    "name": "来源名称",
    "url": "https://example.com/news/",
    "category": "industry-news",    # 见 NewsCategory 类型
    "industries": ["steel"],         # 见 IndustryType 类型
    "list_selector": "ul.list li",
    "title_selector": "a.title",
    "link_selector": "a.title",
    "date_selector": "span.date",
},
```

## 许可

MIT License
