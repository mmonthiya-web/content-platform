# 内容平台 · Content Platform

小红书内容运营工作台 — 素材管理、AI 文案生成、内容排期一站式工具。

支持桌面端与移动端，同一个网址自动适配。

## 页面说明

| 文件 | 页面 | 功能 |
|------|------|------|
| `index.html` | 首页 | 今日工作台、内容流水线、AI 推荐选题、排期日历预览 |
| `suzaiku.html` | 素材库 | 灵感/Hook/标题/CTA 管理、爆款拆解详情 |
| `postcraft.html` | 创作页 | Brand Context 设置、AI 文案生成、语气版本切换 |
| `drafts.html` | 草稿库 | 草稿编辑、封面上传、完成度检查、定时发布设置 |
| `calendar.html` | 排期日历 | 月历/周历视图、内容排期管理 |
| `guide.html` | 使用说明 | 快速上手、功能介绍、常见问题 |

## 部署到 GitHub Pages

1. 将所有文件上传到 GitHub 仓库
2. 进入仓库 Settings → Pages
3. Source 选择 `main` branch，folder 选择 `/ (root)`
4. 保存后访问 `https://你的用户名.github.io/仓库名/`

桌面浏览器和手机浏览器访问同一个网址即可，无需单独的移动端版本。

## 使用说明

### AI 文案生成
创作页需要 Anthropic API Key 才能使用 AI 生成功能（Brand Context 和文案生成）。API Key 在 `postcraft.html` 页面内填入，仅存储在浏览器本地 localStorage，不会上传到任何服务器。

### 数据存储

数据采用**双层架构**：

- **主存储：Supabase 云端数据库** — 草稿、素材、爆款拆解、排期等所有业务数据均同步到 Supabase，支持跨设备访问。
- **本地缓存：localStorage** — 每次操作后同步写入本地缓存，页面加载时优先使用缓存快速渲染，Supabase 响应后自动刷新为最新数据。

> 注意：清除浏览器数据只会清空本地缓存，云端数据不受影响，重新加载页面后会自动从 Supabase 恢复。

### Brand Context 和语气设置
Brand Context、自定义语气标签、生成历史这三项存储在 Supabase 的 `user_settings` 表，同样支持跨设备同步。

## 技术栈

- 纯 HTML/CSS/JavaScript，无需构建工具
- 响应式设计，≤768px 自动切换为移动端底部导航栏布局
- 字体：Poppins + DM Serif Display（Google Fonts）
- 图标：Tabler Icons
- AI：Anthropic Claude API（claude-sonnet-4）
- 数据库：Supabase（PostgreSQL + REST API）
