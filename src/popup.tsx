import { useState, useEffect } from 'react'

import { QuickOutline } from '~/components/QuickOutline'
import type { ProviderType } from '~/providers/types'

import './style.css'

type View = 'main' | 'quick-outline' | 'settings'

interface Settings {
    selectedProvider: ProviderType
    apiKeys: Partial<Record<ProviderType, string>>
}

const DEFAULT_SETTINGS: Settings = {
    selectedProvider: 'gemini',
    apiKeys: {}
}

const PROVIDERS = [
    { id: 'gemini' as const, name: 'Gemini', vision: true, free: true },
    { id: 'openai' as const, name: 'OpenAI', vision: true, free: false },
    { id: 'claude' as const, name: 'Claude', vision: false, free: false },
    { id: 'grok' as const, name: 'Grok', vision: false, free: false }
]

function IndexPopup() {
    const [view, setView] = useState<View>('main')
    const [idea, setIdea] = useState('')

    if (view === 'quick-outline') {
        return (
            <div className="w-96 bg-white">
                <QuickOutline onClose={() => setView('main')} />
            </div>
        )
    }

    if (view === 'settings') {
        return <SettingsView onClose={() => setView('main')} />
    }

    return (
        <div className="w-80 p-4 bg-white">
            <h1 className="text-xl font-bold text-x-dark mb-2">✨ XBooster</h1>
            <p className="text-sm text-x-gray mb-4">AI-powered engagement for X</p>

            {/* Quick Tweet Composer */}
            <textarea
                className="w-full p-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-x-blue focus:outline-none"
                rows={3}
                placeholder="Enter your tweet idea..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
            />

            <button className="w-full mt-3 py-2 bg-x-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors">
                Generate Tweets
            </button>

            {/* Quick Outline Entry - T026 */}
            <button
                onClick={() => setView('quick-outline')}
                className="w-full mt-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
                <span>📝</span>
                <span>快速框架 → Skill</span>
            </button>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <button
                    onClick={() => setView('settings')}
                    className="text-sm text-x-gray hover:text-x-blue transition-colors cursor-pointer bg-transparent border-none"
                >
                    ⚙️ Settings
                </button>
                <span className="text-xs text-gray-300">v1.0</span>
            </div>
        </div>
    )
}

function SettingsView({ onClose }: { onClose: () => void }) {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const result = await chrome.storage.local.get('xbooster_settings')
            if (result.xbooster_settings) {
                setSettings(result.xbooster_settings)
            }
        } catch (e) {
            console.error('Failed to load settings:', e)
        }
        setLoading(false)
    }

    async function saveSettings() {
        try {
            await chrome.storage.local.set({
                xbooster_settings: {
                    ...settings,
                    lastUpdated: new Date().toISOString()
                }
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (e) {
            console.error('Failed to save settings:', e)
        }
    }

    function updateApiKey(provider: ProviderType, key: string) {
        setSettings(prev => ({
            ...prev,
            apiKeys: { ...prev.apiKeys, [provider]: key }
        }))
    }

    if (loading) {
        return (
            <div className="w-80 p-4 bg-white">
                <div className="text-center text-gray-500">Loading...</div>
            </div>
        )
    }

    return (
        <div className="w-80 p-4 bg-white max-h-[500px] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-x-dark">⚙️ Settings</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 text-xl bg-transparent border-none cursor-pointer"
                >
                    ×
                </button>
            </div>

            {/* Provider Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Provider
                </label>
                <select
                    value={settings.selectedProvider}
                    onChange={(e) => setSettings(prev => ({ ...prev, selectedProvider: e.target.value as ProviderType }))}
                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-x-blue focus:outline-none"
                >
                    {PROVIDERS.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} {p.vision ? '👁️' : ''} {p.free ? '(Free)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* API Keys */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Keys
                </label>

                {PROVIDERS.map(provider => (
                    <div key={provider.id} className="mb-3">
                        <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs text-gray-500">{provider.name}</span>
                            {provider.vision && <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">Vision</span>}
                            {provider.free && <span className="text-xs bg-green-100 text-green-600 px-1 rounded">Free</span>}
                        </div>
                        <input
                            type="password"
                            placeholder={`${provider.name} API Key`}
                            value={settings.apiKeys[provider.id] || ''}
                            onChange={(e) => updateApiKey(provider.id, e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-x-blue focus:outline-none"
                        />
                    </div>
                ))}
            </div>

            {/* Get API Key Links */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-xs font-medium text-blue-700 mb-2">🔑 Get API Keys:</div>
                <div className="flex flex-col gap-1">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-xs text-blue-600 hover:underline">
                        → Gemini (Free)
                    </a>
                    <a href="https://platform.openai.com/api-keys" target="_blank" className="text-xs text-blue-600 hover:underline">
                        → OpenAI
                    </a>
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" className="text-xs text-blue-600 hover:underline">
                        → Claude
                    </a>
                    <a href="https://console.x.ai" target="_blank" className="text-xs text-blue-600 hover:underline">
                        → Grok
                    </a>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={saveSettings}
                className={`w-full py-2 rounded-full font-medium transition-colors ${saved
                        ? 'bg-green-500 text-white'
                        : 'bg-x-blue text-white hover:bg-blue-600'
                    }`}
            >
                {saved ? '✓ Saved!' : 'Save Settings'}
            </button>

            {/* Back Button */}
            <button
                onClick={onClose}
                className="w-full mt-2 py-2 text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none cursor-pointer text-sm"
            >
                ← Back
            </button>
        </div>
    )
}

export default IndexPopup
