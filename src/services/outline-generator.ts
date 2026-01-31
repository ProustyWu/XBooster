/**
 * Outline Generator Service
 * Generates quick outlines/short drafts for handoff to x-content-writer Skill
 */

import { getProviderContext } from '~/services/ai-client'

export interface OutlineResult {
    id: string
    title: string
    points: string[]
    hook: string
    targetPlatform: string
}

export interface OutlineGeneratorResult {
    success: boolean
    outlines: OutlineResult[]
    error?: string
}

export interface HandoffPayload {
    topic: string
    selectedOutline: OutlineResult
    language: string
    targetPlatform: string
    timestamp: string
    source: 'xbooster-extension'
}

/**
 * Generate quick outlines for a topic
 */
export async function generateOutlines(
    topic: string,
    targetPlatform: string = 'x-long'
): Promise<OutlineGeneratorResult> {
    try {
        const { provider } = await getProviderContext()

        // Generate outlines using the provider
        const prompt = buildOutlinePrompt(topic, targetPlatform)
        const outlines = await callProviderForOutlines(provider, prompt, targetPlatform)

        return {
            success: true,
            outlines
        }
    } catch (error) {
        return {
            success: false,
            outlines: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Build prompt for outline generation
 */
function buildOutlinePrompt(topic: string, platform: string): string {
    return `你是一个内容策划专家。请为以下主题生成 3 个不同角度的内容大纲：

主题：${topic}
目标平台：${platform}

要求：
1. 每个大纲包含：标题、3-5个要点、开头钩子
2. 三个大纲使用不同策略：
   - 大纲1：争议性/反直觉角度
   - 大纲2：实用性/方法论角度  
   - 大纲3：故事/案例角度
3. 开头钩子要抓人，禁止使用"在当今社会"等空洞开头

请以如下严格格式返回 3 个对象的 JSON 数组（不要额外文本）：
[
  {
    "text": "TITLE: ...\\nHOOK: ...\\nPOINTS:\\n- ...\\n- ...\\n- ...",
    "strategy": "controversy|practical|story"
  }
]
`
}

/**
 * Call provider API for outline generation
 */
async function callProviderForOutlines(
    provider: any,
    prompt: string,
    platform: string
): Promise<OutlineResult[]> {
    const results = await provider.generateTweet(prompt, { mode: 'engaging', count: 3 })
    if (!results?.length) {
        return fallbackOutlines(platform)
    }

    const outlines = results.map((item: { text?: string }, index: number) => {
        const parsed = parseOutlineText(item.text || '')
        return {
            id: `outline-${Date.now()}-${index}`,
            title: parsed.title || `大纲 ${index + 1}`,
            points: parsed.points.length ? parsed.points : ['要点 1', '要点 2', '要点 3'],
            hook: parsed.hook || '',
            targetPlatform: platform
        }
    })

    return outlines
}

function parseOutlineText(text: string): { title: string; hook: string; points: string[] } {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
    let title = ''
    let hook = ''
    const points: string[] = []

    for (const line of lines) {
        if (line.startsWith('TITLE:')) {
            title = line.replace('TITLE:', '').trim()
            continue
        }
        if (line.startsWith('HOOK:')) {
            hook = line.replace('HOOK:', '').trim()
            continue
        }
        if (line.startsWith('-')) {
            points.push(line.replace(/^-\s*/, '').trim())
        }
    }

    return { title, hook, points }
}

function fallbackOutlines(platform: string): OutlineResult[] {
    return [{
        id: `outline-${Date.now()}-0`,
        title: '默认大纲',
        points: ['要点 1', '要点 2', '要点 3'],
        hook: '',
        targetPlatform: platform
    }]
}

/**
 * Create handoff payload for x-content-writer Skill
 */
export function createHandoffPayload(
    topic: string,
    outline: OutlineResult,
    language: string = 'zh'
): HandoffPayload {
    return {
        topic,
        selectedOutline: outline,
        language,
        targetPlatform: outline.targetPlatform,
        timestamp: new Date().toISOString(),
        source: 'xbooster-extension'
    }
}

/**
 * Format handoff payload as copyable text for Skill
 */
export function formatHandoffForClipboard(payload: HandoffPayload): string {
    return `---
# XBooster Handoff
topic: ${payload.topic}
platform: ${payload.targetPlatform}
language: ${payload.language}
timestamp: ${payload.timestamp}
source: ${payload.source}
---

## 选定大纲

### ${payload.selectedOutline.title}

**开头钩子**：${payload.selectedOutline.hook}

**要点**：
${payload.selectedOutline.points.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---
请使用 x-content-writer skill 继续深度写作。
`
}
