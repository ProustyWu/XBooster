/**
 * Reply Generator Service
 * Generates AI-powered replies using configured provider
 */

import { providerRegistry } from '~/providers'
import type {
    GeneratedContent,
    GenerationOptions,
    ProviderType,

    TweetContext
} from '~/providers/types'
import { getApiKey, getSelectedProvider, getSettings } from '~/storage/settings'

// Import and register all providers
import { openaiProvider } from '~/providers/openai'
import { claudeProvider } from '~/providers/claude'
import { grokProvider } from '~/providers/grok'
import { geminiProvider } from '~/providers/gemini'

// Register providers on module load
providerRegistry.register(openaiProvider)
providerRegistry.register(claudeProvider)
providerRegistry.register(grokProvider)
providerRegistry.register(geminiProvider)

export interface ReplyGeneratorResult {
    success: boolean
    replies: GeneratedContent[]
    error?: string
}

/**
 * Generate AI-powered replies for a tweet
 */
export async function generateReplies(
    context: TweetContext,
    options?: Partial<GenerationOptions>
): Promise<ReplyGeneratorResult> {
    try {
        // Get settings
        const settings = await getSettings()
        const providerType = settings.selectedProvider
        const provider = providerRegistry.get(providerType)

        if (!provider) {
            return {
                success: false,
                replies: [],
                error: `Provider ${providerType} not found`
            }
        }

        // Configure provider with API key
        const apiKey = await getApiKey(providerType)
        if (!apiKey) {
            return {
                success: false,
                replies: [],
                error: `API key not configured for ${provider.name}`
            }
        }

        provider.configure(apiKey)

        // Generate replies
        const genOptions: GenerationOptions = {
            mode: settings.replyMode,
            count: options?.count || 3,
            maxLength: options?.maxLength || 10000
        }

        const replies = await provider.generateReply(context, genOptions)

        return {
            success: true,
            replies
        }
    } catch (error) {
        return {
            success: false,
            replies: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Get the currently configured provider
 */
export async function getConfiguredProvider(): Promise<{
    provider: ProviderType
    isConfigured: boolean
    name: string
}> {
    const providerType = await getSelectedProvider()
    const provider = providerRegistry.get(providerType)
    const apiKey = await getApiKey(providerType)

    return {
        provider: providerType,
        isConfigured: !!apiKey,
        name: provider?.name || providerType
    }
}

/**
 * Get all available providers with their configuration status
 */
export async function getAllProviders() {
    const settings = await getSettings()

    return providerRegistry.getAll().map((p) => ({
        id: p.id,
        name: p.name,
        isConfigured: !!settings.apiKeys[p.id],
        isSelected: settings.selectedProvider === p.id
    }))
}
