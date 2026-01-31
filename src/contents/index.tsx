/**
 * Plasmo configuration for content script injection
 */

import type { PlasmoCSConfig } from 'plasmo'

export const config: PlasmoCSConfig = {
    matches: ['https://x.com/*', 'https://twitter.com/*'],
    css: ['../style.css']
}

// Placeholder - will be replaced with actual content script
export default function ContentScript() {
    return null
}
