/**
 * xAI Grok Provider Adapter
 * Uses OpenAI-compatible API format
 */

import type {
    AIProvider,
    GeneratedContent,
    GenerationOptions,
    TweetContext
} from './types'

export class GrokProvider implements AIProvider {
    readonly name = 'Grok'
    readonly id = 'grok' as const

    private apiKey: string | null = null
    private model = 'grok-2-latest'
    private baseUrl = 'https://api.x.ai/v1'

    configure(apiKey: string): void {
        this.apiKey = apiKey
    }

    isConfigured(): boolean {
        return !!this.apiKey
    }

    async validateApiKey(key: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: { Authorization: `Bearer ${key}` }
            })
            return response.ok
        } catch {
            return false
        }
    }

    async detectLanguage(text: string): Promise<string> {
        if (/[\u4e00-\u9fff]/.test(text)) return 'zh'
        if (/[\u3040-\u30ff]/.test(text)) return 'ja'
        if (/[\uac00-\ud7af]/.test(text)) return 'ko'
        return 'en'
    }

    async generateReply(
        context: TweetContext,
        options: GenerationOptions = { mode: 'engaging', count: 3 }
    ): Promise<GeneratedContent[]> {
        if (!this.apiKey) throw new Error('Grok API key not configured')

        const prompt = this.buildReplyPrompt(context, options)
        const response = await this.callAPI(prompt)
        return this.parseResponse(response, context.language)
    }

    async generateTweet(
        idea: string,
        options: GenerationOptions = { mode: 'engaging', count: 3 }
    ): Promise<GeneratedContent[]> {
        if (!this.apiKey) throw new Error('Grok API key not configured')

        const prompt = this.buildTweetPrompt(idea, options)
        const response = await this.callAPI(prompt)
        return this.parseResponse(response, 'en')
    }

    private buildReplyPrompt(context: TweetContext, options: GenerationOptions): string {
        return `Generate ${options.count || 3} witty reply suggestions for X.

TWEET: @${context.author}: "${context.text}"
Language: ${context.language}
Mode: ${options.mode}

Return JSON: [{"text": "reply", "strategy": "approach"}]`
    }

    private buildTweetPrompt(idea: string, options: GenerationOptions): string {
        return `Create ${options.count || 3} viral tweets for: "${idea}"
Mode: ${options.mode}

Return JSON: [{"text": "tweet", "strategy": "hook"}]`
    }

    private async callAPI(prompt: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.9
            })
        })

        if (!response.ok) {
            throw new Error(`Grok API error: ${response.status}`)
        }

        const data = await response.json()
        return data.choices[0]?.message?.content || '[]'
    }

    private parseResponse(response: string, language: string): GeneratedContent[] {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/)
            const items = JSON.parse(jsonMatch?.[0] || '[]')

            return items.map((item: { text: string; strategy: string }, index: number) => ({
                id: `grok-${Date.now()}-${index}`,
                text: item.text,
                language,
                provider: 'grok' as const,
                strategy: item.strategy,
                confidence: 0.85,
                createdAt: new Date()
            }))
        } catch {
            return []
        }
    }
}

export const grokProvider = new GrokProvider()
