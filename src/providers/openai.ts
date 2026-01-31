/**
 * OpenAI Provider Adapter
 */

import type {
    AIProvider,
    GeneratedContent,
    GenerationOptions,
    TweetContext
} from './types'

export class OpenAIProvider implements AIProvider {
    readonly name = 'OpenAI'
    readonly id = 'openai' as const

    private apiKey: string | null = null
    private model = 'gpt-4o-mini'

    configure(apiKey: string): void {
        this.apiKey = apiKey
    }

    isConfigured(): boolean {
        return !!this.apiKey
    }

    async validateApiKey(key: string): Promise<boolean> {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${key}` }
            })
            return response.ok
        } catch {
            return false
        }
    }

    async detectLanguage(text: string): Promise<string> {
        // Use simple heuristic for speed, actual detection in generation
        if (/[\u4e00-\u9fff]/.test(text)) return 'zh'
        if (/[\u3040-\u30ff]/.test(text)) return 'ja'
        if (/[\uac00-\ud7af]/.test(text)) return 'ko'
        return 'en'
    }

    async generateReply(
        context: TweetContext,
        options: GenerationOptions = { mode: 'engaging', count: 3 }
    ): Promise<GeneratedContent[]> {
        if (!this.apiKey) throw new Error('OpenAI API key not configured')

        const prompt = this.buildReplyPrompt(context, options)
        const response = await this.callAPI(prompt)
        return this.parseResponse(response, context.language)
    }

    async generateTweet(
        idea: string,
        options: GenerationOptions = { mode: 'engaging', count: 3 }
    ): Promise<GeneratedContent[]> {
        if (!this.apiKey) throw new Error('OpenAI API key not configured')

        const prompt = this.buildTweetPrompt(idea, options)
        const response = await this.callAPI(prompt)
        return this.parseResponse(response, 'en')
    }

    private buildReplyPrompt(context: TweetContext, options: GenerationOptions): string {
        return `You are helping a user engage on X (Twitter). Generate ${options.count || 3} reply suggestions.

ORIGINAL TWEET:
Author: @${context.author}
Content: "${context.text}"
Language: ${context.language}

REQUIREMENTS:
- Match the language of the original tweet (${context.language})
- Mode: ${options.mode} (engaging=maximize likes, professional=formal, witty=humorous)
- Each reply must be unique in approach
- Maximum length: ${options.maxLength || 280} characters

OUTPUT FORMAT:
Return exactly ${options.count || 3} replies as JSON array:
[{"text": "reply text", "strategy": "brief description"}]`
    }

    private buildTweetPrompt(idea: string, options: GenerationOptions): string {
        return `You are helping a user create viral content on X (Twitter).

USER'S IDEA:
"${idea}"

REQUIREMENTS:
- Generate ${options.count || 3} tweet variations
- Mode: ${options.mode}
- Each uses a different engagement strategy
- Maximum length: 280 characters

OUTPUT FORMAT:
Return exactly ${options.count || 3} tweets as JSON array:
[{"text": "tweet text", "strategy": "engagement hook used"}]`
    }

    private async callAPI(prompt: string): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8
            })
        })

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`)
        }

        const data = await response.json()
        return data.choices[0]?.message?.content || '[]'
    }

    private parseResponse(response: string, language: string): GeneratedContent[] {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/)
            const items = JSON.parse(jsonMatch?.[0] || '[]')

            return items.map((item: { text: string; strategy: string }, index: number) => ({
                id: `openai-${Date.now()}-${index}`,
                text: item.text,
                language,
                provider: 'openai' as const,
                strategy: item.strategy,
                confidence: 0.85,
                createdAt: new Date()
            }))
        } catch {
            return []
        }
    }
}

export const openaiProvider = new OpenAIProvider()
