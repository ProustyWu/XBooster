/**
 * Smart Reply Types
 * Pure type definitions with no AI dependencies
 * Safe to import in popup/content scripts
 */

export interface ThinkingStep {
    id: string
    label: string
    status: 'pending' | 'active' | 'done'
    content?: string
}

export interface SmartReplyResult {
    success: boolean
    reply: string
    thinking: ThinkingStep[]
    error?: string
}
