# Implementation Plan: X Engagement Boost (v2.0)

**Branch**: `001-x-engagement-boost` | **Date**: 2026-01-31 | **Spec**: [spec.md](./spec.md)

## Summary

Build a Chrome browser extension (XBooster) with **dual-mode architecture**:

1. **评论模式** (Comment Mode): Inline UI for quick AI-powered replies (✅ MVP complete)
2. **写作模式** (Writer Mode): Standalone window for long-form content creation with 4D analysis

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Plasmo, React 18, TailwindCSS  
**Storage**: Chrome Storage API (local), IndexedDB (for RLHF data)  
**Testing**: Vitest, Playwright (E2E)  
**Target Platform**: Chrome (Manifest V3)

## Constitution Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. 双模式协同 | ✅ PASS | 评论模式已实现，写作模式本计划 |
| II. 4D 内容框架 | 🔄 TODO | US3 待实现 |
| III. 去 AI 味 | 🔄 TODO | US5 待实现 |
| IV. 质量稳定性 | 🔄 TODO | US7 待实现 |
| V. 自进化能力 | 🔄 TODO | US8 待实现 |
| VI. 多 Provider | ✅ PASS | 4 providers 已实现 |
| VII. 隐私优先 | ✅ PASS | 仅本地存储 |

## Project Structure

```text
src/
├── tabs/                    # 独立标签页 (写作模式)
│   └── writer.tsx           # 写作模式主页面
├── popup/                   # 扩展弹窗
│   └── index.tsx
├── contents/                # 内容脚本 (评论模式)
│   └── reply-injector.tsx   # ✅ 已实现
├── components/
│   ├── writer/              # 写作模式组件
│   │   ├── TopicAnalyzer.tsx      # 4D 分析
│   │   ├── DraftEditor.tsx        # 草稿编辑器
│   │   ├── DeAIProcessor.tsx      # 去 AI 味
│   │   ├── PlatformAdapter.tsx    # 多平台适配
│   │   └── QualityReview.tsx      # 质量评审
│   ├── ReplyCard.tsx        # ✅ 已实现
│   └── LoadingSpinner.tsx   # ✅ 已实现
├── services/
│   ├── topic-analyzer.ts    # 4D 选题分析
│   ├── content-generator.ts # 长文生成
│   ├── de-ai-processor.ts   # 去 AI 味处理
│   ├── platform-adapter.ts  # 多平台适配
│   ├── quality-reviewer.ts  # 6 维度评审
│   ├── rlhf-learner.ts      # 偏好学习
│   └── reply-generator.ts   # ✅ 已实现
└── providers/               # ✅ 已实现
```

## 版本规划

### MVP (当前完成)

- ✅ 评论模式：智能回复生成
- ✅ 4 个 AI Provider 适配器
- ✅ 基础 UI 组件

### V1.1 (本次目标)

- 写作模式基础窗口
- 4D 选题分析
- 长文结构化生成

### V2.0

- 去 AI 味处理
- 多平台适配

### V3.0

- 6 维度质量评审
- RLHF 偏好学习

## Verification Plan

### 自动化测试

```bash
# TypeScript 编译检查
npx tsc --noEmit

# 单元测试
pnpm test

# 构建测试
pnpm build
```

### 手动验证

1. **评论模式**: 打开 x.com，点击推文旁 ✨ 按钮，验证回复生成
2. **写作模式**: 点击扩展图标，打开写作窗口，输入选题，验证 4D 分析输出
