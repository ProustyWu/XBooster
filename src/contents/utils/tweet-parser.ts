/**
 * Tweet Parser Utility
 * Extracts tweet content and metadata from X DOM
 */

import type { TweetContext, TweetMetrics } from '~/providers/types'

/**
 * Parse a tweet element and extract context
 */
export function parseTweetElement(tweetElement: Element): TweetContext | null {
    try {
        // Find tweet text container
        const textElement = tweetElement.querySelector('[data-testid="tweetText"]')
        const text = textElement?.textContent?.trim() || ''

        if (!text) return null

        // Find author
        const authorElement = tweetElement.querySelector('[data-testid="User-Name"] a')
        const authorHref = authorElement?.getAttribute('href') || ''
        const author = authorHref.replace('/', '') || 'unknown'

        // Find tweet ID from link
        const tweetLink = tweetElement.querySelector('a[href*="/status/"]')
        const href = tweetLink?.getAttribute('href') || ''
        const idMatch = href.match(/\/status\/(\d+)/)
        const id = idMatch?.[1] || `temp-${Date.now()}`

        // Check for media
        const hasMedia = !!tweetElement.querySelector('[data-testid="tweetPhoto"], [data-testid="videoPlayer"]')

        // Detect language (basic heuristic, will be refined by AI)
        const language = detectLanguageHeuristic(text)

        // Parse metrics if available
        const metrics = parseMetrics(tweetElement)

        return {
            id,
            text,
            author,
            language,
            hasMedia,
            timestamp: new Date(),
            metrics
        }
    } catch (error) {
        console.error('[XBooster] Error parsing tweet:', error)
        return null
    }
}

/**
 * Parse engagement metrics from tweet element
 */
function parseMetrics(tweetElement: Element): TweetMetrics | undefined {
    try {
        const getMetricValue = (testId: string): number => {
            const element = tweetElement.querySelector(`[data-testid="${testId}"]`)
            const text = element?.getAttribute('aria-label') || ''
            const match = text.match(/(\d+)/)
            return match ? parseInt(match[1], 10) : 0
        }

        return {
            likes: getMetricValue('like'),
            retweets: getMetricValue('retweet'),
            replies: getMetricValue('reply'),
            views: undefined // Views sometimes not exposed
        }
    } catch {
        return undefined
    }
}

/**
 * Simple language detection heuristic
 * This is a fallback - primary detection will use AI
 */
function detectLanguageHeuristic(text: string): string {
    // Check for CJK characters
    if (/[\u4e00-\u9fff]/.test(text)) {
        // Chinese characters
        if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
            return 'ja' // Japanese (has hiragana/katakana)
        }
        return 'zh' // Chinese
    }

    // Check for Korean
    if (/[\uac00-\ud7af]/.test(text)) {
        return 'ko'
    }

    // Check for Arabic
    if (/[\u0600-\u06ff]/.test(text)) {
        return 'ar'
    }

    // Check for Cyrillic (Russian, etc)
    if (/[\u0400-\u04ff]/.test(text)) {
        return 'ru'
    }

    // Default to English
    return 'en'
}

/**
 * Find the closest tweet article element from a target element
 */
export function findTweetArticle(element: Element): Element | null {
    return element.closest('article[data-testid="tweet"]')
}

/**
 * Check if element is inside the tweet action bar
 */
export function isInTweetActions(element: Element): boolean {
    return !!element.closest('[role="group"]')
}
