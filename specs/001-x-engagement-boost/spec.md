# Feature Specification: X Engagement Boost (v2.0)

**Feature Branch**: `001-x-engagement-boost`  
**Created**: 2026-01-31  
**Updated**: 2026-01-31  
**Status**: Active  

## 产品概述

XBooster 是一个 AI 驱动的 X (Twitter) 内容创作与互动工具，采用**分阶段**策略：

- **扩展内评论模式**：内嵌网页，快速生成高质量回复
- **独立写作 Skill**：本地深度使用，完整的长文创作工作流

---

## 模式一：评论模式 (内嵌网页)

### User Story 1 - Smart Reply Generation (Priority: P1) ✅ 已实现

As a user browsing X (Twitter), I discover a tweet I want to engage with. I click the XBooster ✨ button near the tweet. The extension analyzes the tweet content, language, and tone, then generates 3 contextually relevant reply suggestions matching the original tweet's language. I select one, optionally edit it, and post.

**Acceptance Scenarios**:

1. Given a tweet in any language, When I click XBooster, Then I receive 3 replies in the same language
2. Given AI-generated replies, When I select one, Then it appears in the compose box ready to post
3. Given I've selected a reply, When I edit the text, Then my edits are preserved

---

### User Story 2 - AI Provider Selection (Priority: P2)

As a user, I want to choose which AI service powers my content generation. I open settings, select from available providers (Claude, GPT, Grok, Gemini), enter my API key, and save. The extension uses that provider for all AI operations.

**Acceptance Scenarios**:

1. Given I select a provider and enter a valid API key, Then AI features use that provider
2. Given I switch providers, Then subsequent generations use the new provider

---

### User Story 2.5 - 快速框架入口 (Priority: P2)

As a user, I want a lightweight “quick outline/short draft” entry in the extension. I input a topic and get 3 brief outlines or a short draft, then choose to continue in the independent Skill for deep writing.

**Acceptance Scenarios**:

1. Given I enter a topic in the extension, When I click Generate, Then I receive 3 outline options or a short draft
2. Given a generated outline, When I click “Continue”, Then the content is handed off to the Skill for deep editing

**Handoff Mechanism (Minimal Viable)**:

- Export selected outline/draft as a plain text bundle with metadata (topic, language, target platform, timestamp).
- Provide a “Copy for Skill” button that copies a preformatted block to clipboard.
- Skill accepts pasted block and continues the workflow from 4D analysis onward.

---

## 模式二：写作模式 (独立 Skill)

### User Story 3 - 4D 选题分析 (Priority: P1, 独立 Skill)

As a content creator with a topic idea, I open the XBooster Writer (独立窗口). I input my topic/idea, and the system performs 4D analysis:

- **哲学维度**：识别存在性问题，增加深度
- **心理学维度**：识别可触发的情绪/认知偏误，增加共鸣
- **传播学维度**：推荐信息组织框架，增加可读性
- **社会学维度**：识别身份认同/社会比较，增加传播性

The analysis guides content structure and hook design.

**Acceptance Scenarios**:

1. Given I input "如何在一天内开始赚钱", Then I see 4D analysis including philosophical depth (时间有限性), psychological triggers (损失厌恶), etc.
2. Given the 4D analysis, When I proceed to write, Then the suggested outline reflects the analysis insights

---

### User Story 4 - 长文结构化生成 (Priority: P1, 独立 Skill)

As a content creator, after 4D analysis, I click "Generate Draft". The system creates a structured long-form article (1000-10000 字) with:

- 引人入胜的开头（非模板化）
- 逻辑清晰的主体结构
- 有力的结尾（非说教式）

I can regenerate specific sections or the entire article.

**Acceptance Scenarios**:

1. Given 4D analysis is complete, When I click Generate, Then I receive a structured draft
2. Given a generated draft, When I click "Regenerate Section", Then only that section is rewritten
3. Given a draft, Then it does NOT contain AI clichés like "在当今社会" or "让我们共同努力"

---

### User Story 5 - 去 AI 味处理 (Priority: P1, 独立 Skill)

As a content creator, I want my content to sound human. After generating a draft, I click "De-AI". The system processes the content to remove:

- 空洞过渡词
- 模板化开头
- 说教式结尾
- 连接词过密
- 爹味和老登味
- 破折号滥用

I can preview before/after comparison.

**Acceptance Scenarios**:

1. Given a generated draft, When I click De-AI, Then I see a before/after comparison
2. Given De-AI processing, Then phrases like "在当今社会" are removed or replaced
3. Given De-AI processing, Then the content reads more naturally

---

### User Story 6 - 多平台适配 (Priority: P2, 独立 Skill)

As a content creator, I want to repurpose my content for different platforms. From the Writer, I select target platforms (X、公众号、小红书、LinkedIn). The system generates platform-specific versions:

- **X**: 精炼观点，280字以内或长文格式
- **公众号**: 深度长文，支持小标题
- **小红书**: 轻松短文，emoji 友好
- **LinkedIn**: 英文商务风格

**Acceptance Scenarios**:

1. Given a long-form draft, When I select "X Long Post", Then I get an X-optimized version
2. Given a draft, When I select "公众号", Then I get a version with proper sections
3. Given a draft, When I select "LinkedIn", Then I get an English business-style version

---

### User Story 7 - 6 维度质量评审 (Priority: P2, 独立 Skill)

As a content creator, before finalizing, I click "Quality Review". The system evaluates the content across 6 dimensions and provides a score (1-10):

- 深度 (Depth)
- 共鸣 (Resonance)
- 可读性 (Readability)
- 传播性 (Shareability)
- 原创性 (Originality)
- AI 味程度 (AI Detectability)

If any dimension scores below 7, the system suggests improvements.

**Acceptance Scenarios**:

1. Given a draft, When I click Review, Then I see scores for all 6 dimensions
2. Given a dimension scores below 7, Then I see specific improvement suggestions
3. Given all dimensions score 7+, Then the content is marked "Ready to Publish"

---

### User Story 8 - RLHF 偏好学习 (Priority: P3, 独立 Skill)

As a long-term user, the system learns my writing preferences. Every time I edit AI-generated content, the system records the modification pattern. Over time, generated content increasingly matches my style.

**Acceptance Scenarios**:

1. Given I consistently remove certain phrases, Then future generations avoid those phrases
2. Given I prefer certain structures, Then future outlines follow similar patterns
3. Given a month of usage, Then initial draft quality should require fewer edits

---

## 边缘情况处理

| 场景 | 处理方式 |
|------|---------|
| AI API 不可用 | 显示错误，提供重试选项 |
| API Key 无效 | 提示检查设置 |
| 生成内容质量低 | 自动触发重新生成 |
| 超长内容 | 分段处理，保持一致性 |
| 网络中断 | 保存草稿到本地 |

---

## 功能需求

### 评论模式

- **FR-001**: 内嵌 UI 不破坏 X 原生界面
- **FR-002**: 自动检测推文语言
- **FR-003**: 生成同语言回复
- **FR-004**: 提供 3 个回复选项
- **FR-005**: 提供“快速框架/短草稿”入口，并支持交接到独立 Skill

### 写作模式（独立 Skill）

- **FR-101**: 写作模式以独立 Skill 运行（本地深度使用）
- **FR-102**: 4D 选题分析框架
- **FR-103**: 长文结构化生成 (1000-10000 字)
- **FR-104**: 去 AI 味处理
- **FR-105**: 多平台适配输出
- **FR-106**: 6 维度质量评审
- **FR-107**: RLHF 偏好学习

### 共享基础设施

- **FR-201**: 多 AI Provider 支持
- **FR-202**: 本地存储 API Key 和偏好
- **FR-203**: 无服务器架构（仅调用 AI API）

---

## 成功指标

| 指标 | 目标 |
|------|------|
| 回复生成时间 | < 30 秒 |
| 长文生成时间 | < 2 分钟（独立 Skill） |
| 质量评审通过率 | > 90% |
| De-AI 后 AI 检测率 | < 20% |
| 用户编辑率随时间下降 | > 30% (RLHF 效果) |
