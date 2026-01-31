/**
 * Core type definitions for XBooster
 * Based on data-model.md specification
 */

// ============ Enums ============

export type ProviderType = 'openai' | 'claude' | 'grok' | 'gemini'

export type ReplyMode = 'engaging' | 'professional' | 'witty'

// ============ Core Entities ============

export interface TweetMetrics {
    likes: number
    retweets: number
    replies: number
    views?: number
}

export interface TweetContext {
    id: string
    text: string
    author: string
    language: string
    hasMedia: boolean
    timestamp: Date
    metrics?: TweetMetrics
}

export interface GeneratedContent {
    id: string
    text: string
    language: string
    provider: ProviderType
    strategy: string
    confidence: number
    createdAt: Date
}

export interface GenerationOptions {
    mode: ReplyMode
    count?: number // Default: 3
    maxLength?: number // Default: 280 for tweets, 10000 for replies
}

// ============ AI Provider Interface ============

export interface AIProvider {
    readonly name: string
    readonly id: ProviderType

    // Core generation methods
    generateReply(context: TweetContext, options?: GenerationOptions): Promise<GeneratedContent[]>

    generateTweet(idea: string, options?: GenerationOptions): Promise<GeneratedContent[]>

    // Utility methods
    detectLanguage(text: string): Promise<string>
    validateApiKey(key: string): Promise<boolean>

    // Configuration
    configure(apiKey: string): void
    isConfigured(): boolean
}

// ============ Provider Registry Interface ============

export interface ProviderRegistry {
    register(provider: AIProvider): void
    get(id: ProviderType): AIProvider | undefined
    getAll(): AIProvider[]
    getConfigured(): AIProvider[]
}

// ============ Error Types ============

export type ProviderErrorCode =
    | 'INVALID_API_KEY'
    | 'RATE_LIMITED'
    | 'NETWORK_ERROR'
    | 'CONTENT_FILTERED'
    | 'QUOTA_EXCEEDED'
    | 'UNKNOWN'

export class ProviderError extends Error {
    constructor(
        public readonly provider: ProviderType,
        public readonly code: ProviderErrorCode,
        message: string
    ) {
        super(message)
        this.name = 'ProviderError'
    }
}

// ============ Generation State ============

export type GenerationState = 'idle' | 'loading' | 'success' | 'error'

export interface GenerationResult {
    state: GenerationState
    contents: GeneratedContent[]
    error?: string
}
