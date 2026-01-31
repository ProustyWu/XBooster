/**
 * Chrome Storage wrapper for user settings
 * Provides type-safe access to extension storage
 */

import type { ProviderType, ReplyMode } from '~/providers/types'

export interface UIPreferences {
    showInlineButtons: boolean
    autoDetectLanguage: boolean
    darkMode: 'auto' | 'light' | 'dark'
}

export interface StoredSettings {
    selectedProvider: ProviderType
    apiKeys: Partial<Record<ProviderType, string>>
    replyMode: ReplyMode
    uiPreferences: UIPreferences
    lastUpdated: string
}

const DEFAULT_SETTINGS: StoredSettings = {
    selectedProvider: 'openai',
    apiKeys: {},
    replyMode: 'engaging',
    uiPreferences: {
        showInlineButtons: true,
        autoDetectLanguage: true,
        darkMode: 'auto'
    },
    lastUpdated: new Date().toISOString()
}

/**
 * Get all settings from Chrome storage
 */
export async function getSettings(): Promise<StoredSettings> {
    try {
        const result = await chrome.storage.local.get('xbooster_settings')
        return result.xbooster_settings || DEFAULT_SETTINGS
    } catch {
        return DEFAULT_SETTINGS
    }
}

/**
 * Save settings to Chrome storage
 */
export async function saveSettings(settings: Partial<StoredSettings>): Promise<void> {
    const current = await getSettings()
    const updated: StoredSettings = {
        ...current,
        ...settings,
        lastUpdated: new Date().toISOString()
    }
    await chrome.storage.local.set({ xbooster_settings: updated })
}

/**
 * Get API key for a specific provider
 */
export async function getApiKey(provider: ProviderType): Promise<string | undefined> {
    const settings = await getSettings()
    return settings.apiKeys[provider]
}

/**
 * Save API key for a specific provider
 */
export async function saveApiKey(provider: ProviderType, key: string): Promise<void> {
    const settings = await getSettings()
    await saveSettings({
        apiKeys: {
            ...settings.apiKeys,
            [provider]: key
        }
    })
}

/**
 * Get the currently selected provider
 */
export async function getSelectedProvider(): Promise<ProviderType> {
    const settings = await getSettings()
    return settings.selectedProvider
}

/**
 * Set the selected provider
 */
export async function setSelectedProvider(provider: ProviderType): Promise<void> {
    await saveSettings({ selectedProvider: provider })
}
