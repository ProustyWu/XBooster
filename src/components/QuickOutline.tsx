/**
 * QuickOutline Component
 * Provides quick outline/draft generation with handoff to x-content-writer Skill
 */

import { useState } from 'react'

import { LoadingSpinner } from '~/components/LoadingSpinner'
import {
    createHandoffPayload,
    formatHandoffForClipboard,
    generateOutlines,
    type OutlineResult
} from '~/services/outline-generator'

interface QuickOutlineProps {
    onClose: () => void
}

export function QuickOutline({ onClose }: QuickOutlineProps) {
    const [topic, setTopic] = useState('')
    const [platform, setPlatform] = useState('x-long')
    const [outlines, setOutlines] = useState<OutlineResult[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const platforms = [
        { id: 'x-long', label: 'X 长文' },
        { id: 'wechat', label: '公众号' },
        { id: 'xiaohongshu', label: '小红书' },
        { id: 'linkedin', label: 'LinkedIn' }
    ]

    async function handleGenerate() {
        if (!topic.trim()) return

        setLoading(true)
        setError(null)
        setOutlines([])
        setSelectedId(null)

        const result = await generateOutlines(topic, platform)

        if (result.success) {
            setOutlines(result.outlines)
        } else {
            setError(result.error || 'Failed to generate outlines')
        }

        setLoading(false)
    }

    async function handleCopyForSkill() {
        const selected = outlines.find((o) => o.id === selectedId)
        if (!selected) return

        const payload = createHandoffPayload(topic, selected)
        const text = formatHandoffForClipboard(payload)

        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-x-dark flex items-center gap-2">
                    <span>📝</span>
                    <span>快速框架</span>
                </h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>

            {/* Topic Input */}
            <div className="space-y-2">
                <label className="text-sm text-x-gray">输入主题/想法</label>
                <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="例如：如何在一天内开始赚钱"
                    className="w-full p-3 border rounded-xl text-sm resize-none focus:ring-2 focus:ring-x-blue focus:outline-none"
                    rows={2}
                />
            </div>

            {/* Platform Select */}
            <div className="space-y-2">
                <label className="text-sm text-x-gray">目标平台</label>
                <div className="flex flex-wrap gap-2">
                    {platforms.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPlatform(p.id)}
                            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${platform === p.id
                                    ? 'bg-x-blue text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={!topic.trim() || loading}
                className="w-full py-2.5 bg-x-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        生成中...
                    </span>
                ) : (
                    '生成 3 个大纲'
                )}
            </button>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Outlines List */}
            {outlines.length > 0 && (
                <div className="space-y-3">
                    <label className="text-sm text-x-gray">选择一个大纲</label>
                    {outlines.map((outline) => (
                        <div
                            key={outline.id}
                            onClick={() => setSelectedId(outline.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedId === outline.id
                                    ? 'border-x-blue bg-blue-50 ring-2 ring-x-blue/20'
                                    : 'border-gray-200 hover:border-x-blue/50'
                                }`}
                        >
                            <h3 className="font-medium text-x-dark">{outline.title}</h3>
                            <p className="text-sm text-x-gray mt-1 italic">
                                "{outline.hook}"
                            </p>
                            <ul className="mt-2 space-y-1">
                                {outline.points.map((point, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                        <span className="text-x-blue">•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* Copy for Skill Button */}
            {selectedId && (
                <button
                    onClick={handleCopyForSkill}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                    {copied ? (
                        <>
                            <span>✓</span>
                            <span>已复制！使用 x-content-writer Skill 继续</span>
                        </>
                    ) : (
                        <>
                            <span>📋</span>
                            <span>Copy for Skill</span>
                        </>
                    )}
                </button>
            )}

            {/* Skill Hint */}
            {selectedId && !copied && (
                <p className="text-xs text-center text-x-gray">
                    复制后，在 Claude Code 中使用 x-content-writer skill 继续深度写作
                </p>
            )}
        </div>
    )
}

export default QuickOutline
