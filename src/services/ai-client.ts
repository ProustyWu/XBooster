import { providerRegistry } from "~/providers"
import type { AIProvider, ProviderType } from "~/providers/types"
import { ensureProvidersRegistered } from "~/providers/register"
import { getApiKey, getSettings } from "~/storage/settings"

export type ProviderContext = {
  provider: AIProvider
  providerType: ProviderType
}

export async function getProviderContext(): Promise<ProviderContext> {
  ensureProvidersRegistered()
  const settings = await getSettings()
  const providerType = settings.selectedProvider
  const provider = providerRegistry.get(providerType)
  if (!provider) {
    throw new Error(`Provider ${providerType} not found`)
  }

  const apiKey = await getApiKey(providerType)
  if (!apiKey) {
    throw new Error(`API key not configured for ${provider.name}`)
  }

  provider.configure(apiKey)
  return { provider, providerType }
}
