/**
 * ReplyCard Component
 * Displays a generated reply option for user selection
 */

import type { GeneratedContent } from '~/providers/types'

interface ReplyCardProps {
    reply: GeneratedContent
    onSelect: (reply: GeneratedContent) => void
    onEdit: (reply: GeneratedContent) => void
    isSelected?: boolean
}

export function ReplyCard({ reply, onSelect, onEdit, isSelected }: ReplyCardProps) {
    return (
        <div
            className={`
        p-3 rounded-xl border transition-all cursor-pointer
        ${isSelected
                    ? 'border-x-blue bg-blue-50 ring-2 ring-x-blue/20'
                    : 'border-gray-200 hover:border-x-blue/50 hover:bg-gray-50'
                }
      `}
            onClick={() => onSelect(reply)}
        >
            {/* Reply text */}
            <p className="text-sm text-x-dark leading-relaxed">
                {reply.text}
            </p>

            {/* Strategy badge */}
            <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-x-gray bg-gray-100 px-2 py-0.5 rounded-full">
                    {reply.strategy}
                </span>

                <div className="flex items-center gap-2">
                    {/* Edit button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(reply)
                        }}
                        className="text-xs text-x-gray hover:text-x-blue transition-colors"
                    >
                        ✏️ Edit
                    </button>

                    {/* Confidence indicator */}
                    <span className="text-xs text-x-gray">
                        {Math.round(reply.confidence * 100)}%
                    </span>
                </div>
            </div>
        </div>
    )
}

interface ReplyListProps {
    replies: GeneratedContent[]
    selectedId?: string
    onSelect: (reply: GeneratedContent) => void
    onEdit: (reply: GeneratedContent) => void
}

export function ReplyList({ replies, selectedId, onSelect, onEdit }: ReplyListProps) {
    if (replies.length === 0) {
        return (
            <div className="text-center py-4 text-x-gray text-sm">
                No replies generated yet
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {replies.map((reply) => (
                <ReplyCard
                    key={reply.id}
                    reply={reply}
                    onSelect={onSelect}
                    onEdit={onEdit}
                    isSelected={reply.id === selectedId}
                />
            ))}
        </div>
    )
}

export default ReplyCard
