/**
 * Smart Reply Service
 * Analyzes tweet context and generates contextual, de-AI'd replies
 * with visible thinking process
 */

import { providerRegistry } from '~/providers'
import type { TweetContext } from '~/providers/types'
import { getApiKey, getSettings } from '~/storage/settings'

// Import and register providers
import { openaiProvider } from '~/providers/openai'
import { claudeProvider } from '~/providers/claude'
import { grokProvider } from '~/providers/grok'
import { geminiProvider } from '~/providers/gemini'

providerRegistry.register(openaiProvider)
providerRegistry.register(claudeProvider)
providerRegistry.register(grokProvider)
providerRegistry.register(geminiProvider)

export interface ThinkingStep {
    id: string
    label: string
    status: 'pending' | 'active' | 'done'
    content?: string
}

export interface SmartReplyResult {
    success: boolean
    reply: string
    thinking: ThinkingStep[]
    error?: string
}

/**
 * Generate a smart reply with visible thinking process
 */
export async function generateSmartReply(
    context: TweetContext,
    onThinkingUpdate: (steps: ThinkingStep[]) => void
): Promise<SmartReplyResult> {
    const steps: ThinkingStep[] = [
        { id: 'parse', label: '📖 解析推文内容', status: 'pending' },
        { id: 'analyze', label: '🔍 理解语境与情感', status: 'pending' },
        { id: 'strategy', label: '💡 选择回复策略', status: 'pending' },
        { id: 'generate', label: '✍️ 生成回复草稿', status: 'pending' },
        { id: 'deai', label: '🎭 去 AI 味处理', status: 'pending' },
        { id: 'output', label: '✨ 输出最终回复', status: 'pending' }
    ]

    const updateStep = (id: string, status: ThinkingStep['status'], content?: string) => {
        const step = steps.find(s => s.id === id)
        if (step) {
            step.status = status
            if (content) step.content = content
        }
        onThinkingUpdate([...steps])
    }

    try {
        // Get provider
        const settings = await getSettings()
        const provider = providerRegistry.get(settings.selectedProvider)
        if (!provider) {
            return { success: false, reply: '', thinking: steps, error: 'Provider not found' }
        }

        const apiKey = await getApiKey(settings.selectedProvider)
        if (!apiKey) {
            return { success: false, reply: '', thinking: steps, error: 'API key not configured' }
        }

        provider.configure(apiKey)

        // Step 1: Parse tweet
        updateStep('parse', 'active')
        await delay(300)
        const parsedInfo = {
            author: context.author,
            language: context.language,
            hasMedia: context.hasMedia,
            textLength: context.text.length,
            keywords: extractKeywords(context.text)
        }
        updateStep('parse', 'done', `作者: @${parsedInfo.author} | 语言: ${parsedInfo.language} | 关键词: ${parsedInfo.keywords.slice(0, 3).join(', ')}`)

        // Step 2: Analyze context
        updateStep('analyze', 'active')
        await delay(300)
        const sentiment = analyzeSentiment(context.text)
        const topic = detectTopic(context.text)
        updateStep('analyze', 'done', `情感: ${sentiment} | 主题: ${topic}`)

        // Step 3: Choose strategy
        updateStep('strategy', 'active')
        await delay(200)
        const strategies = ['共鸣回应', '补充观点', '提问互动', '幽默调侃', '真诚赞同']
        const selectedStrategy = strategies[Math.floor(Math.random() * strategies.length)]
        updateStep('strategy', 'done', `策略: ${selectedStrategy}`)

        // Step 4: Generate draft
        updateStep('generate', 'active')
        const prompt = buildSmartReplyPrompt(context, sentiment, topic, selectedStrategy)
        const draftReply = await callProviderForReply(provider, prompt)
        updateStep('generate', 'done', `草稿: "${draftReply.slice(0, 50)}..."`)

        // Step 5: De-AI processing
        updateStep('deai', 'active')
        await delay(200)
        const deAIedReply = applyDeAIProcessing(draftReply)
        updateStep('deai', 'done', '已移除 AI 特征词汇和模板句式')

        // Step 6: Final output
        updateStep('output', 'active')
        await delay(100)
        updateStep('output', 'done', deAIedReply)

        return {
            success: true,
            reply: deAIedReply,
            thinking: steps
        }
    } catch (error) {
        return {
            success: false,
            reply: '',
            thinking: steps,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Build smart reply prompt with context
 */
function buildSmartReplyPrompt(
    context: TweetContext,
    sentiment: string,
    topic: string,
    strategy: string
): string {
    return `你是一个社交媒体互动专家。请根据以下推文生成一条自然、有趣的回复。

原推文: "${context.text}"
作者: @${context.author}
语言: ${context.language}
情感倾向: ${sentiment}
主题: ${topic}
回复策略: ${strategy}

要求:
1. 回复必须用 ${context.language === 'zh' ? '中文' : context.language === 'ja' ? '日语' : context.language === 'en' ? '英语' : '原推文语言'}
2. 长度控制在 50-150 字符
3. 语气自然口语化，像真人在聊天
4. 禁止使用: "确实"、"非常"、"真的很"、"不得不说"、"希望"、表情符号过多
5. 可以适当使用: 1-2个表情、口语词汇、反问句
6. 要有独特观点或个人体验感

只输出回复内容本身，不要任何解释。`
}

/**
 * Call provider for reply generation
 */
async function callProviderForReply(provider: any, prompt: string): Promise<string> {
    const results = await provider.generateTweet(prompt, { mode: 'engaging', count: 1 })
    return results[0]?.text || ''
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const words = text.replace(/[^\w\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(w => w.length > 1)
    return [...new Set(words)].slice(0, 5)
}

/**
 * Analyze sentiment of text
 */
function analyzeSentiment(text: string): string {
    const positive = /[😊🎉👍❤️喜欢好棒赞美妙开心]/
    const negative = /[😢😭😠💔难过伤心失望痛苦]/
    const question = /[？?吗呢]/

    if (question.test(text)) return '疑问探讨'
    if (positive.test(text)) return '积极正面'
    if (negative.test(text)) return '消极负面'
    return '中性客观'
}

/**
 * Detect topic from text
 */
function detectTopic(text: string): string {
    const topics: [RegExp, string][] = [
        [/技术|代码|编程|开发|AI|人工智能/, '技术'],
        [/赚钱|收入|财务|投资|工作/, '财经'],
        [/生活|日常|吃|玩|旅游/, '生活'],
        [/观点|看法|认为|觉得/, '观点'],
        [/学习|读书|知识|成长/, '学习'],
    ]

    for (const [pattern, topic] of topics) {
        if (pattern.test(text)) return topic
    }
    return '综合'
}

/**
 * Apply De-AI processing to remove AI-like patterns
 */
function applyDeAIProcessing(text: string): string {
    let result = text

    // Remove AI signature phrases
    const aiPatterns = [
        [/^确实[，,]?/, ''],
        [/不得不说[，,]?/, ''],
        [/真的很/, '挺'],
        [/非常/, '很'],
        [/希望大家/, ''],
        [/！！+/g, '！'],
        [/。。+/g, '。'],
        [/[😀😁😃😄😅😆😉😊😋😎😍😘]{2,}/g, (m: string) => m[0]], // Reduce emoji spam
    ]

    for (const [pattern, replacement] of aiPatterns) {
        result = result.replace(pattern as RegExp, replacement as string)
    }

    // Trim and clean
    result = result.trim()

    // Ensure it doesn't start with empty or generic opener
    if (/^[，,。.！!？?]/.test(result)) {
        result = result.slice(1).trim()
    }

    return result
}

/**
 * Delay utility
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
