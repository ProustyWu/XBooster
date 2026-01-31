# Tasks: X Engagement Boost (v2.0)

**Input**: Design documents from `/specs/001-x-engagement-boost/`  
**Architecture**: 分阶段 (扩展评论模式 + 独立写作 Skill)

---

## Phase 1-3: 评论模式 MVP ✅ 已完成

- [x] T001-T021: 评论模式核心功能已实现
- 包括：项目结构、4 个 AI Provider、语言检测、回复生成、UI 组件

**Checkpoint**: 评论模式 MVP 完成 ✅

---

## Phase 4: 快速框架入口 (Priority: P2)

**Goal**: 扩展内提供“快速框架/短草稿”，并交接到独立 Skill

- [ ] T022 创建 QuickOutline 面板（popup 内最小 UI）
- [ ] T023 创建 outline 生成服务 `src/services/outline-generator.ts`
- [ ] T024 定义交接 payload（文本块 + 元数据）
- [ ] T025 实现 “Copy for Skill” 剪贴板交接
- [ ] T026 添加入口按钮（popup → QuickOutline）

---

## 写作模式 (独立 Skill)

写作模式功能（4D 分析、长文生成、去 AI 味、多平台适配、质量评审、RLHF）移至独立 Skill 仓库/配置，不在本扩展任务范围内。

---

## Progress Summary

| Phase | 功能 | 状态 | 任务数 |
|-------|------|------|--------|
| 1-3 | 评论模式 MVP | ✅ | 21/21 |
| 4 | 快速框架入口 | ⏳ | 0/5 |
| **Total** | | **81%** | **21/26** |

---

## 版本对应

- **V1.0 (当前)**: Phase 1-3 评论模式 MVP ✅
- **V1.1**: + Phase 4 快速框架入口
- **写作模式**: 由独立 `x-content-writer` Skill 提供
