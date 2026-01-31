/**
 * Google Gemini Provider Adapter
 */

import type {
    AIProvider,
    GeneratedContent,
    GenerationOptions,
    TweetContext
} from './types'

export class GeminiProvider implements AIProvider {
    readonly name = 'Gemini'
    readonly id = 'gemini' as const

    private apiKey: string | null = null
    private model = 'gemini-2.0-flash'
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

    configure(apiKey: string): void {
        this.apiKey = apiKey
    }

    isConfigured(): boolean {
        return !!this.apiKey
    }

    async validateApiKey(key: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/models?key=${key}`
            )
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
        if (!this.apiKey) throw new Error('Gemini API key not configured')

        const prompt = this.buildReplyPrompt(context, options)
        const response = await this.callAPI(prompt)
        return this.parseResponse(response, context.language)
    }

    async generateTweet(
        idea: string,
        options: GenerationOptions = { mode: 'engaging', count: 3 }
    ): Promise<GeneratedContent[]> {
        if (!this.apiKey) throw new Error('Gemini API key not configured')

        const prompt = this.buildTweetPrompt(idea, options)
        const response = await this.callAPI(prompt)
        return this.parseResponse(response, 'en')
    }

    private buildReplyPrompt(context: TweetContext, options: GenerationOptions): string {
        return `Generate ${options.count || 3} reply suggestions for this X tweet.

Tweet by @${context.author}: "${context.text}"
Language: ${context.language}, Mode: ${options.mode}

Return only JSON array: [{"text": "reply", "strategy": "approach"}]`
    }

    private buildTweetPrompt(idea: string, options: GenerationOptions): string {
        return `Create ${options.count || 3} viral tweet variations for: "${idea}"
Mode: ${options.mode}

Return only JSON array: [{"text": "tweet", "strategy": "hook"}]`
    }

    private async callAPI(prompt: string): Promise<string> {
        const response = await fetch(
            `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.8 }
                })
            }
        )

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`)
        }

        const data = await response.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    }

    private parseResponse(response: string, language: string): GeneratedContent[] {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/)
            const items = JSON.parse(jsonMatch?.[0] || '[]')

            return items.map((item: { text: string; strategy: string }, index: number) => ({
                id: `gemini-${Date.now()}-${index}`,
                text: item.text,
                language,
                provider: 'gemini' as const,
                strategy: item.strategy,
                confidence: 0.85,
                createdAt: new Date()
            }))
        } catch {
            return []
        }
    }
}

export const geminiProvider = new GeminiProvider()
