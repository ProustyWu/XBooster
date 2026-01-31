/**
 * AI Provider Registry
 * Manages registration and retrieval of AI providers
 */

import type { AIProvider, ProviderRegistry, ProviderType } from './types'

class ProviderRegistryImpl implements ProviderRegistry {
    private providers: Map<ProviderType, AIProvider> = new Map()

    register(provider: AIProvider): void {
        this.providers.set(provider.id, provider)
    }

    get(id: ProviderType): AIProvider | undefined {
        return this.providers.get(id)
    }

    getAll(): AIProvider[] {
        return Array.from(this.providers.values())
    }

    getConfigured(): AIProvider[] {
        return this.getAll().filter((p) => p.isConfigured())
    }
}

// Singleton instance
export const providerRegistry = new ProviderRegistryImpl()

// Re-export types
export * from './types'
