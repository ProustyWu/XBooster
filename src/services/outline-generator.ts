/**
 * Outline Generator Service
 * Generates quick outlines/short drafts for handoff to x-content-writer Skill
 */

import { providerRegistry } from '~/providers'
import { getApiKey, getSettings } from '~/storage/settings'

// Import providers
import { openaiProvider } from '~/providers/openai'
import { claudeProvider } from '~/providers/claude'
import { grokProvider } from '~/providers/grok'
import { geminiProvider } from '~/providers/gemini'

// Register providers
providerRegistry.register(openaiProvider)
providerRegistry.register(claudeProvider)
providerRegistry.register(grokProvider)
providerRegistry.register(geminiProvider)

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
        const settings = await getSettings()
        const providerType = settings.selectedProvider
        const provider = providerRegistry.get(providerType)

        if (!provider) {
            return {
                success: false,
                outlines: [],
                error: `Provider ${providerType} not found`
            }
        }

        const apiKey = await getApiKey(providerType)
        if (!apiKey) {
            return {
                success: false,
                outlines: [],
                error: `API key not configured for ${provider.name}`
            }
        }

        provider.configure(apiKey)

        // Generate outlines using the provider
        const prompt = buildOutlinePrompt(topic, targetPlatform)
        const response = await callProviderForOutlines(provider, prompt)
        const outlines = parseOutlinesResponse(response, targetPlatform)

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

请以 JSON 格式返回：
{
  "outlines": [
    {
      "title": "标题",
      "points": ["要点1", "要点2", "要点3"],
      "hook": "开头钩子"
    }
  ]
}`
}

/**
 * Call provider API for outline generation
 */
async function callProviderForOutlines(provider: any, prompt: string): Promise<string> {
    // Use the provider's generateTweet method
    const results = await provider.generateTweet(prompt, { mode: 'engaging', count: 1 })
    return results[0]?.text || ''
}

/**
 * Parse outlines from AI response
 */
function parseOutlinesResponse(response: string, platform: string): OutlineResult[] {
    try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.outlines && Array.isArray(parsed.outlines)) {
                return parsed.outlines.map((o: any, i: number) => ({
                    id: `outline-${Date.now()}-${i}`,
                    title: o.title || `大纲 ${i + 1}`,
                    points: o.points || [],
                    hook: o.hook || '',
                    targetPlatform: platform
                }))
            }
        }
    } catch {
        // Fallback: create simple outline from text
    }

    // Fallback outline
    return [{
        id: `outline-${Date.now()}-0`,
        title: '默认大纲',
        points: ['要点 1', '要点 2', '要点 3'],
        hook: response.slice(0, 100),
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
