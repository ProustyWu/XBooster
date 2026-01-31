/**
 * Anthropic Claude Provider Adapter
 */

import type {
    AIProvider,
    GeneratedContent,
    GenerationOptions,
    TweetContext
} from './types'

export class ClaudeProvider implements AIProvider {
    readonly name = 'Claude'
    readonly id = 'claude' as const

    private apiKey: string | null = null
    private model = 'claude-3-5-sonnet-latest'

    configure(apiKey: string): void {
        this.apiKey = apiKey
    }

    isConfigured(): boolean {
        return !!this.apiKey
    }

    async validateApiKey(key: string): Promise<boolean> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hi' }]
                })
            })
            return response.ok || response.status === 400 // 400 means valid key, bad request
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
        if (!this.apiKey) throw new Error('Claude API key not configured')

        const prompt = this.buildReplyPrompt(context, options)
        const response = await this.callAPI(prompt)
        return this.parseResponse(response, context.language)
    }

    async generateTweet(
        idea: string,
        options: GenerationOptions = { mode: 'engaging', count: 3 }
    ): Promise<GeneratedContent[]> {
        if (!this.apiKey) throw new Error('Claude API key not configured')

        const prompt = this.buildTweetPrompt(idea, options)
        const response = await this.callAPI(prompt)
        return this.parseResponse(response, 'en')
    }

    private buildReplyPrompt(context: TweetContext, options: GenerationOptions): string {
        return `Generate ${options.count || 3} reply suggestions for this tweet.

ORIGINAL TWEET:
Author: @${context.author}
Content: "${context.text}"
Language: ${context.language}

Mode: ${options.mode}
Max length: ${options.maxLength || 280} chars

Return JSON array: [{"text": "reply", "strategy": "approach"}]`
    }

    private buildTweetPrompt(idea: string, options: GenerationOptions): string {
        return `Create ${options.count || 3} viral tweet variations for this idea:

"${idea}"

Mode: ${options.mode}
Max length: 280 chars

Return JSON array: [{"text": "tweet", "strategy": "hook used"}]`
    }

    private async callAPI(prompt: string): Promise<string> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey!,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }]
            })
        })

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`)
        }

        const data = await response.json()
        return data.content[0]?.text || '[]'
    }

    private parseResponse(response: string, language: string): GeneratedContent[] {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/)
            const items = JSON.parse(jsonMatch?.[0] || '[]')

            return items.map((item: { text: string; strategy: string }, index: number) => ({
                id: `claude-${Date.now()}-${index}`,
                text: item.text,
                language,
                provider: 'claude' as const,
                strategy: item.strategy,
                confidence: 0.9,
                createdAt: new Date()
            }))
        } catch {
            return []
        }
    }
}

export const claudeProvider = new ClaudeProvider()
