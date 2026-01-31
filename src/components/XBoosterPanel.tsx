/**
 * XBooster Reply Panel
 * Shows visible thinking process and generates contextual replies
 */

import { useEffect, useState } from 'react'

import { LoadingSpinner } from '~/components/LoadingSpinner'
import type { SmartReplyResult, ThinkingStep } from '~/services/smart-reply'
import { requestSmartReply } from '~/services/background-client'
import type { TweetContext } from '~/providers/types'

interface XBoosterPanelProps {
    context: TweetContext
    onInsertReply: (text: string) => void
    onClose: () => void
}

export function XBoosterPanel({ context, onInsertReply, onClose }: XBoosterPanelProps) {
    const [thinking, setThinking] = useState<ThinkingStep[]>([])
    const [result, setResult] = useState<SmartReplyResult | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        startGeneration()
    }, [])

    async function startGeneration() {
        setIsGenerating(true)
        setThinking([])
        setResult(null)

        const res = await requestSmartReply(context)
        if (res.thinking?.length) {
            setThinking([...res.thinking])
        }

        setResult(res)
        setIsGenerating(false)
    }

    async function handleInsert() {
        if (result?.reply) {
            onInsertReply(result.reply)
            onClose()
        }
    }

    async function handleCopy() {
        if (result?.reply) {
            await navigator.clipboard.writeText(result.reply)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        }
    }

    function handleRegenerate() {
        startGeneration()
    }

    const getStepIcon = (status: ThinkingStep['status']) => {
        switch (status) {
            case 'done': return '✅'
            case 'active': return '⏳'
            default: return '⏸️'
        }
    }

    return (
        <div className="xbooster-panel">
            {/* Header */}
            <div className="xbooster-header">
                <span className="xbooster-title">✨ XBooster 智能回复</span>
                <button onClick={onClose} className="xbooster-close">×</button>
            </div>

            {/* Original Tweet Preview */}
            <div className="xbooster-tweet-preview">
                <span className="xbooster-preview-label">回复给 @{context.author}</span>
                <p className="xbooster-preview-text">{context.text.slice(0, 100)}{context.text.length > 100 ? '...' : ''}</p>
            </div>

            {/* Thinking Process */}
            <div className="xbooster-thinking">
                <div className="xbooster-thinking-title">🧠 思考过程</div>
                <div className="xbooster-steps">
                    {thinking.map((step) => (
                        <div
                            key={step.id}
                            className={`xbooster-step xbooster-step-${step.status}`}
                        >
                            <span className="xbooster-step-icon">{getStepIcon(step.status)}</span>
                            <div className="xbooster-step-content">
                                <span className="xbooster-step-label">{step.label}</span>
                                {step.content && (
                                    <span className="xbooster-step-detail">{step.content}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Result */}
            {result?.success && (
                <div className="xbooster-result">
                    <div className="xbooster-result-label">📝 生成的回复</div>
                    <div className="xbooster-result-text">{result.reply}</div>

                    <div className="xbooster-actions">
                        <button onClick={handleInsert} className="xbooster-btn-primary">
                            📤 插入回复框
                        </button>
                        <button onClick={handleCopy} className="xbooster-btn-secondary">
                            {copied ? '✓ 已复制' : '📋 复制'}
                        </button>
                        <button onClick={handleRegenerate} className="xbooster-btn-secondary">
                            🔄 重新生成
                        </button>
                    </div>
                </div>
            )}

            {/* Error */}
            {result?.error && (
                <div className="xbooster-error">
                    ❌ {result.error}
                    <button onClick={handleRegenerate} className="xbooster-retry">重试</button>
                </div>
            )}

            {/* Loading */}
            {isGenerating && thinking.length === 0 && (
                <div className="xbooster-loading">
                    <LoadingSpinner size="md" />
                    <span>正在分析推文...</span>
                </div>
            )}

            <style>{`
        .xbooster-panel {
          background: #15202b;
          border: 1px solid #38444d;
          border-radius: 16px;
          padding: 16px;
          margin: 12px 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 500px;
        }
        
        .xbooster-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .xbooster-title {
          font-size: 15px;
          font-weight: 700;
          color: #1da1f2;
        }
        
        .xbooster-close {
          background: none;
          border: none;
          color: #8899a6;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 50%;
        }
        .xbooster-close:hover {
          background: #38444d;
          color: #fff;
        }
        
        .xbooster-tweet-preview {
          background: #192734;
          border-radius: 12px;
          padding: 10px 12px;
          margin-bottom: 12px;
        }
        
        .xbooster-preview-label {
          font-size: 12px;
          color: #8899a6;
        }
        
        .xbooster-preview-text {
          font-size: 13px;
          color: #e1e8ed;
          margin: 4px 0 0 0;
          line-height: 1.4;
        }
        
        .xbooster-thinking {
          margin-bottom: 12px;
        }
        
        .xbooster-thinking-title {
          font-size: 13px;
          font-weight: 600;
          color: #8899a6;
          margin-bottom: 8px;
        }
        
        .xbooster-steps {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .xbooster-step {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 6px 10px;
          background: #192734;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .xbooster-step-pending {
          opacity: 0.5;
        }
        
        .xbooster-step-active {
          background: #1a3a5c;
          border-left: 3px solid #1da1f2;
        }
        
        .xbooster-step-done {
          opacity: 1;
        }
        
        .xbooster-step-icon {
          font-size: 14px;
        }
        
        .xbooster-step-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .xbooster-step-label {
          font-size: 13px;
          color: #e1e8ed;
        }
        
        .xbooster-step-detail {
          font-size: 11px;
          color: #8899a6;
        }
        
        .xbooster-result {
          background: linear-gradient(135deg, #1a3a5c 0%, #192734 100%);
          border-radius: 12px;
          padding: 12px;
          margin-top: 12px;
        }
        
        .xbooster-result-label {
          font-size: 12px;
          color: #8899a6;
          margin-bottom: 8px;
        }
        
        .xbooster-result-text {
          font-size: 14px;
          color: #fff;
          line-height: 1.5;
          padding: 10px;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          margin-bottom: 12px;
        }
        
        .xbooster-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .xbooster-btn-primary {
          background: #1da1f2;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .xbooster-btn-primary:hover {
          background: #1a91da;
        }
        
        .xbooster-btn-secondary {
          background: transparent;
          color: #1da1f2;
          border: 1px solid #1da1f2;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .xbooster-btn-secondary:hover {
          background: rgba(29, 161, 242, 0.1);
        }
        
        .xbooster-error {
          background: #3d1f1f;
          color: #f4212e;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .xbooster-retry {
          background: #f4212e;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          cursor: pointer;
          margin-left: auto;
        }
        
        .xbooster-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px;
          color: #8899a6;
          font-size: 13px;
        }
      `}</style>
        </div>
    )
}

export default XBoosterPanel
