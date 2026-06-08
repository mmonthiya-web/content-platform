# 内容平台 · Content Platform

小红书内容运营工作台 — 素材管理、AI 文案生成、内容排期一站式工具。

## 页面说明

| 文件 | 页面 | 功能 |
|------|------|------|
| `index.html` | 首页 | 今日工作台、内容流水线、AI 创作入口 |
| `suzaiku.html` | 素材库 | 灵感/Hook/标题/CTA 管理、爆款拆解 |
| `postcraft.html` | 创作页 | Brand Context 设置、AI 文案生成 |
| `drafts.html` | 草稿库 | 草稿编辑、封面上传、完成度检查 |
| `calendar.html` | 排期日历 | 月历/周历视图、内容排期管理 |

## 部署到 GitHub Pages

1. 将所有文件上传到 GitHub 仓库
2. 进入仓库 Settings → Pages
3. Source 选择 `main` branch，folder 选择 `/ (root)`
4. 保存后访问 `https://你的用户名.github.io/仓库名/`

## 使用说明

- **创作页** 需要 Anthropic API Key 才能使用 AI 生成功能（Brand Context 和文案生成）
- API Key 在 postcraft.html 页面内填入，仅存在本地 localStorage
- 所有数据存储在浏览器本地，刷新页面不会丢失 Brand Context 设置

## 技术栈

- 纯 HTML/CSS/JavaScript，无需构建工具
- 字体：Poppins + DM Serif Display（Google Fonts）
- 图标：Tabler Icons
- AI：Anthropic Claude API (claude-sonnet-4)
