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
import { getProviderContext } from '~/services/ai-client'
import { getSelectedProvider, getSettings } from '~/storage/settings'

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
        const settings = await getSettings()
        const { provider } = await getProviderContext()

        // Generate replies
        const genOptions: GenerationOptions = {
            mode: settings.replyMode,
            count: options?.count || 3,
            maxLength: options?.maxLength || 280
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
