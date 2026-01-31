/**
 * Smart Reply Service
 * Analyzes tweet context and generates contextual, de-AI'd replies
 * with visible thinking process
 */

import type { TweetContext } from '~/providers/types'
import { getProviderContext } from '~/services/ai-client'
import type { ThinkingStep, SmartReplyResult } from '~/services/smart-reply-types'

// Re-export types for convenience
export type { ThinkingStep, SmartReplyResult } from '~/services/smart-reply-types'

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
        const { provider } = await getProviderContext()

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
        const draftReply = await callProviderForReply(provider, context)
        if (!draftReply) {
            throw new Error('Empty reply from provider')
        }
        updateStep('generate', 'done', `草稿: "${draftReply.slice(0, 50)}..."`)

        // Step 5: De-AI processing
        updateStep('deai', 'active')
        await delay(200)
        const deAIedReply = applyDeAIProcessing(draftReply)
        if (!deAIedReply) {
            throw new Error('Empty reply after processing')
        }
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
/**
 * Call provider for reply generation
 */
async function callProviderForReply(provider: any, context: TweetContext): Promise<string> {
    const results = await provider.generateReply(context, {
        mode: 'engaging',
        count: 1,
        maxLength: 150
    })
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
