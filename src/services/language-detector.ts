/**
 * Language Detection Service
 * Detects the language of tweet content
 */

import { providerRegistry } from '~/providers'

import { getSelectedProvider } from '~/storage/settings'

/**
 * Detect language of text using AI provider or fallback heuristics
 */
export async function detectLanguage(text: string): Promise<string> {
    // Try AI provider first
    try {
        const providerType = await getSelectedProvider()
        const provider = providerRegistry.get(providerType)

        if (provider?.isConfigured()) {
            return await provider.detectLanguage(text)
        }
    } catch {
        // Fall through to heuristic
    }

    // Fallback: heuristic detection
    return detectLanguageHeuristic(text)
}

/**
 * Fast heuristic-based language detection
 */
export function detectLanguageHeuristic(text: string): string {
    // CJK check
    if (/[\u4e00-\u9fff]/.test(text)) {
        // Check for Japanese-specific characters
        if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
            return 'ja'
        }
        return 'zh'
    }

    // Korean
    if (/[\uac00-\ud7af]/.test(text)) {
        return 'ko'
    }

    // Arabic
    if (/[\u0600-\u06ff]/.test(text)) {
        return 'ar'
    }

    // Russian/Cyrillic
    if (/[\u0400-\u04ff]/.test(text)) {
        return 'ru'
    }

    // Thai
    if (/[\u0e00-\u0e7f]/.test(text)) {
        return 'th'
    }

    // Default to English
    return 'en'
}

/**
 * Get language display name
 */
export function getLanguageName(code: string): string {
    const names: Record<string, string> = {
        en: 'English',
        zh: '中文',
        ja: '日本語',
        ko: '한국어',
        ar: 'العربية',
        ru: 'Русский',
        th: 'ไทย',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch',
        pt: 'Português'
    }
    return names[code] || code.toUpperCase()
}
