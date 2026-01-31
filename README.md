# 🚀 XBooster - X (Twitter) 智能回复助手

XBooster 是一个 Chrome 扩展，使用 AI 为 X (Twitter) 帖子生成高质量、自然的回复。

## ✨ 功能特性

### 🎯 智能帖子分类

自动识别帖子类型，使用针对性策略生成回复：

| 类型 | 策略 |
|-----|------|
| 🗞️ 新闻/热点 | 制造共鸣或争议，问题结尾引发讨论 |
| 😂 幽默/Meme | 延续梗点，添加个人 twist |
| ❓ 问题/求助 | 共鸣 + 实用 tips + 邀请分享 |
| 🛒 产品/推广 | 赞同 + 比较补充 |
| 📝 通用 | 情感连接 + 价值输出 + 互动引导 |

### 🎨 核心功能

- **多 AI 支持**：Gemini、OpenAI、Claude、Grok
- **Vision 分析**：自动分析图片/视频内容
- **智能语言检测**：根据推文和作者名自动选择回复语言
- **思考过程可视化**：展示 AI 的分析和策略
- **去 AI 味**：生成自然、口语化的回复
- **安全隔离**：AI 请求在扩展后台执行，避免页面脚本干扰

## 📦 安装

### 开发模式

```bash
# 克隆仓库
git clone https://github.com/ProustyWu/XBooster.git
cd XBooster

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 加载扩展

1. 打开 `chrome://extensions`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `build/chrome-mv3-dev` 目录

## ⚙️ 配置

1. 点击扩展图标 → Settings
2. 选择 AI 提供商（推荐 Gemini）
3. 输入对应的 API Key
4. 保存设置

## 🔐 权限说明

本扩展需要以下权限：

- `storage`：本地保存 API Key 与设置
- `activeTab`：与当前 X 页面交互
- `host_permissions`：仅访问 X 站点与所选 AI Provider 的官方 API 域名

## 🧭 架构简述

```
UI (Content Script / Popup)
        |
        v
Background Service Worker
        |
        v
AI Provider APIs
```

说明：AI 请求在后台执行，页面脚本无法直接访问 API Key。

## 🔒 安全与隐私

- API Key 仅存储在本地浏览器存储中
- AI 请求由扩展后台处理，页面脚本无法直接访问 API Key
- 扩展仅访问 X 站点与所选 AI Provider 的官方 API 域名

### 获取 API Key

- **Gemini**: [Google AI Studio](https://aistudio.google.com/apikey)
- **OpenAI**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Claude**: [Anthropic Console](https://console.anthropic.com/)
- **Grok**: [xAI Console](https://console.x.ai/)

## 🎮 使用方法

1. 打开 X.com 任意帖子
2. 点击回复按钮展开回复框
3. 点击 **✨ 智能回复** 按钮
4. 等待 AI 分析并生成回复
5. 点击 **插入回复** 或 **复制**

## 🛠️ 技术栈

- **框架**: Plasmo (Chrome Extension Framework)
- **语言**: TypeScript + React
- **样式**: TailwindCSS
- **AI**: Gemini / OpenAI / Claude / Grok API

## 📁 项目结构

```
src/
├── contents/           # Content Scripts
│   └── reply-injector.tsx  # 主要逻辑
├── components/         # React 组件
├── providers/          # AI 提供商
├── services/           # 业务逻辑
├── storage/            # 本地存储
└── popup.tsx           # 弹窗页面
```

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源文件

- `LICENSE`
- `PRIVACY.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
