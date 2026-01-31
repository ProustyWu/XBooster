/**
 * XBooster Reply Injector - v6
 * Injects button into reply composer toolbar (not floating)
 */

import type { PlasmoCSConfig } from 'plasmo'

import { requestSmartReply } from '~/services/background-client'
import type { TweetContext as ProviderTweetContext } from '~/providers/types'
import { detectLanguageHeuristic } from '~/services/language-detector'
import { escapeHtml, insertTextIntoComposer } from '~/contents/utils/dom-utils'

export const config: PlasmoCSConfig = {
    matches: ['https://twitter.com/*', 'https://x.com/*'],
    all_frames: true,
    run_at: 'document_idle'
}

const DEBUG = false
if (DEBUG) console.log('🚀 XBooster: Content script loaded!')

interface TweetContext {
    text: string
    author: string
    language: string
    mediaUrls: string[]
    mediaType: 'none' | 'image' | 'video' | 'mixed'
}

init()

function init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startInjection)
    } else {
        startInjection()
    }
}

function startInjection() {
    const scheduleInject = createDebouncedInjector(200)
    setTimeout(() => scheduleInject(), 800)
    const observer = new MutationObserver(() => scheduleInject())
    observer.observe(document.body, { childList: true, subtree: true })
}

function injectButtons() {
    // 策略1: 找到 Reply 按钮并在旁边注入
    const replyButtons = document.querySelectorAll('[data-testid="tweetButtonInline"]')

    if (replyButtons.length > 0) {
        replyButtons.forEach(btn => {
            const parent = btn.parentElement
            if (parent && !parent.querySelector('.xbooster-inline-btn')) {
                const trigger = createInlineButton()
                parent.insertBefore(trigger, btn)
                if (DEBUG) console.log('🎉 XBooster: Injected button next to Reply button')
            }
        })
        return
    }

    // 策略2: 找到回复框底部的图标行
    const toolbars = document.querySelectorAll('[data-testid="toolBar"]')
    if (toolbars.length > 0) {
        toolbars.forEach(toolbar => {
            if (!toolbar.querySelector('.xbooster-inline-btn')) {
                const trigger = createInlineButton()
                // 插入到最后一个图标后面
                toolbar.appendChild(trigger)
                if (DEBUG) console.log('🎉 XBooster: Injected button into toolbar')
            }
        })
        return
    }

    // 策略3: 查找回复框中的媒体按钮区域
    const tweetTextareas = document.querySelectorAll('[data-testid="tweetTextarea_0"]')
    tweetTextareas.forEach(textarea => {
        // 向上查找包含按钮的区域
        let parent = textarea.parentElement
        for (let i = 0; i < 10 && parent; i++) {
            // 找到包含 SVG 图标按钮的行
            const buttons = parent.querySelectorAll('button[aria-label], [role="button"][aria-label]')
            if (buttons.length >= 3) {
                const lastButton = buttons[buttons.length - 1]
                const buttonContainer = lastButton.parentElement
                if (buttonContainer && !buttonContainer.querySelector('.xbooster-inline-btn')) {
                    const trigger = createInlineButton()
                    buttonContainer.appendChild(trigger)
                    if (DEBUG) console.log('🎉 XBooster: Injected button into button row')
                    return
                }
            }
            parent = parent.parentElement
        }
    })

    // 策略4: 作为最后手段，在回复框右侧创建一个紧贴的按钮
    const replyComposers = document.querySelectorAll('[data-testid="tweetTextarea_0RichTextInputContainer"]')
    replyComposers.forEach(composer => {
        const parent = composer.parentElement
        if (parent && !parent.querySelector('.xbooster-inline-btn')) {
            // 找到最近的 flex 容器
            let flexParent = parent
            for (let i = 0; i < 5; i++) {
                if (flexParent.parentElement) {
                    flexParent = flexParent.parentElement
                    const style = getComputedStyle(flexParent)
                    if (style.display === 'flex' || style.display === 'inline-flex') {
                        if (!flexParent.querySelector('.xbooster-inline-btn')) {
                            const trigger = createInlineButton()
                            trigger.style.marginLeft = '8px'
                            flexParent.appendChild(trigger)
                            if (DEBUG) console.log('🎉 XBooster: Injected button near composer')
                            return
                        }
                    }
                }
            }
        }
    })
}

function createDebouncedInjector(delayMs: number) {
    let timer: number | null = null
    return () => {
        if (timer) return
        timer = window.setTimeout(() => {
            timer = null
            injectButtons()
        }, delayMs)
    }
}

function createInlineButton(): HTMLButtonElement {
    const trigger = document.createElement('button')
    trigger.className = 'xbooster-inline-btn'
    trigger.innerHTML = '✨'
    trigger.title = 'XBooster 智能回复'
    trigger.setAttribute('type', 'button')

    Object.assign(trigger.style, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        minWidth: '32px',
        minHeight: '32px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1da1f2 0%, #9b59b6 100%)',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        marginLeft: '4px',
        marginRight: '4px',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 6px rgba(29, 161, 242, 0.3)',
        flexShrink: '0'
    })

    trigger.addEventListener('mouseover', () => {
        trigger.style.transform = 'scale(1.1)'
        trigger.style.boxShadow = '0 3px 10px rgba(29, 161, 242, 0.5)'
    })
    trigger.addEventListener('mouseout', () => {
        trigger.style.transform = 'scale(1)'
        trigger.style.boxShadow = '0 2px 6px rgba(29, 161, 242, 0.3)'
    })
    trigger.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        handleTriggerClick()
    })

    return trigger
}

function handleTriggerClick() {
    if (DEBUG) console.log('👆 XBooster: Button clicked!')

    const existingPanel = document.querySelector('.xbooster-panel')
    if (existingPanel) {
        document.querySelector('.xbooster-backdrop')?.remove()
        existingPanel.remove()
        return
    }

    const context = extractTweetContext()
    if (DEBUG) console.log('📝 XBooster: Context:', context)
    showPanel(context)
}

function extractTweetContext(): TweetContext {
    const article = document.querySelector('article[data-testid="tweet"]')

    if (!article) {
        return { text: '', author: 'unknown', language: 'zh', mediaUrls: [], mediaType: 'none' }
    }

    const tweetTextEl = article.querySelector('[data-testid="tweetText"]')
    const text = tweetTextEl?.textContent || ''

    const authorEl = article.querySelector('[data-testid="User-Name"] a[href^="/"]')
    const author = authorEl?.getAttribute('href')?.split('/')[1] || 'unknown'

    // 获取 display name 用于辅助语言检测
    const displayNameEl = article.querySelector('[data-testid="User-Name"]')
    const displayName = displayNameEl?.textContent?.split('@')[0]?.trim() || ''

    // 综合检测语言：推文文字 > display name > 默认
    const language = detectLanguageEnhanced(text, displayName)
    const { mediaUrls, mediaType } = extractMediaUrls(article as HTMLElement)

    if (DEBUG) console.log('🌐 XBooster: Language detection - text:', text.slice(0, 50), 'displayName:', displayName, 'result:', language)

    return { text, author, language, mediaUrls, mediaType }
}

function extractMediaUrls(article: HTMLElement): { mediaUrls: string[], mediaType: 'none' | 'image' | 'video' | 'mixed' } {
    const mediaUrls: string[] = []
    let hasImage = false
    let hasVideo = false

    const images = article.querySelectorAll('[data-testid="tweetPhoto"] img')
    images.forEach(img => {
        const src = img.getAttribute('src')
        if (src && src.includes('pbs.twimg.com/media')) {
            mediaUrls.push(src.replace(/\?.*$/, '?format=jpg&name=medium'))
            hasImage = true
        }
    })

    const video = article.querySelector('[data-testid="videoPlayer"], video')
    if (video) {
        hasVideo = true
        const poster = (video as HTMLVideoElement).poster || video.querySelector('video')?.getAttribute('poster')
        if (poster) mediaUrls.push(poster)
    }

    let mediaType: 'none' | 'image' | 'video' | 'mixed' = 'none'
    if (hasImage && hasVideo) mediaType = 'mixed'
    else if (hasImage) mediaType = 'image'
    else if (hasVideo) mediaType = 'video'

    return { mediaUrls, mediaType }
}

function detectLanguageEnhanced(text: string, displayName: string): string {
    const textLang = detectLanguageHeuristic(text)
    if (textLang !== 'en') return textLang
    const nameLang = detectLanguageHeuristic(displayName)
    if (nameLang !== 'en') return nameLang
    return 'en'
}

function showPanel(context: TweetContext) {
    const backdrop = document.createElement('div')
    backdrop.className = 'xbooster-backdrop'
    Object.assign(backdrop.style, {
        position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
        background: 'rgba(0,0,0,0.6)', zIndex: '10000'
    })
    backdrop.addEventListener('click', () => {
        backdrop.remove()
        document.querySelector('.xbooster-panel')?.remove()
    })
    document.body.appendChild(backdrop)

    const panel = document.createElement('div')
    panel.className = 'xbooster-panel'
    Object.assign(panel.style, {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#15202b', border: '1px solid #38444d',
        borderRadius: '16px', padding: '20px',
        width: '420px', maxWidth: '90vw', maxHeight: '80vh',
        overflow: 'auto', zIndex: '10001',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
    })

    const langLabel = { zh: '中文', ja: '日本語', ko: '한국어', en: 'English' }[context.language] || context.language
    const mediaLabel = context.mediaType !== 'none'
        ? `<span style="background: #9b59b6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 4px;">
        ${context.mediaType === 'image' ? '🖼️' : context.mediaType === 'video' ? '🎬' : '📷'}
       </span>`
        : ''

    const safeAuthor = escapeHtml(context.author)
    const safeText = escapeHtml(context.text)

    panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <span style="font-size: 16px; font-weight: bold; color: #1da1f2;">✨ XBooster 智能回复</span>
      <button id="xbooster-close" style="background: none; border: none; color: #8899a6; font-size: 24px; cursor: pointer;">×</button>
    </div>
    
    <div style="background: #192734; border-radius: 12px; padding: 12px; margin-bottom: 16px;">
      <div style="font-size: 12px; color: #8899a6; margin-bottom: 4px;">
        回复给 @${safeAuthor} 
        <span style="background: #1da1f2; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">${langLabel}</span>
        ${mediaLabel}
      </div>
      <div style="font-size: 13px; color: #e1e8ed; line-height: 1.4;">${safeText.slice(0, 150)}${context.text.length > 150 ? '...' : ''}</div>
      ${context.mediaUrls.length > 0 ? `
        <div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">
          ${context.mediaUrls.slice(0, 4).map(url => `
            <img src="${url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" />
          `).join('')}
        </div>
      ` : ''}
    </div>
    
    <div id="xbooster-thinking" style="margin-bottom: 16px;">
      <div style="font-size: 13px; color: #8899a6; margin-bottom: 8px;">🧠 思考过程</div>
      <div id="xbooster-steps" style="display: flex; flex-direction: column; gap: 6px;"></div>
    </div>
    
    <div id="xbooster-result" style="display: none;">
      <div style="font-size: 12px; color: #8899a6; margin-bottom: 8px;">📝 生成的回复</div>
      <div id="xbooster-reply" style="font-size: 15px; color: #fff; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 12px; line-height: 1.5;"></div>
      <div style="display: flex; gap: 8px;">
        <button id="xbooster-insert" style="background: #1da1f2; color: white; border: none; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1;">插入回复</button>
        <button id="xbooster-copy" style="background: transparent; color: #1da1f2; border: 1px solid #1da1f2; padding: 10px 16px; border-radius: 20px; cursor: pointer; font-size: 13px;">复制</button>
        <button id="xbooster-regen" style="background: transparent; color: #1da1f2; border: 1px solid #1da1f2; padding: 10px 16px; border-radius: 20px; cursor: pointer; font-size: 13px;">重新生成</button>
      </div>
    </div>
    
    <div id="xbooster-error" style="display: none; background: #3d1f1f; color: #f4212e; padding: 12px; border-radius: 8px; margin-top: 12px;">
      <span id="xbooster-error-text"></span>
      <div style="margin-top: 8px; font-size: 12px; color: #8899a6;">请点击扩展图标 → Settings 配置 API Key</div>
    </div>
  `

    document.body.appendChild(panel)

    panel.querySelector('#xbooster-close')?.addEventListener('click', () => {
        backdrop.remove()
        panel.remove()
    })

    generateReply(context, panel, backdrop)
}

async function generateReply(context: TweetContext, panel: HTMLElement, backdrop: HTMLElement) {
    const stepsContainer = panel.querySelector('#xbooster-steps')!
    const resultContainer = panel.querySelector('#xbooster-result') as HTMLElement
    const replyEl = panel.querySelector('#xbooster-reply')!
    const errorContainer = panel.querySelector('#xbooster-error') as HTMLElement
    const errorText = panel.querySelector('#xbooster-error-text')!

    // 步骤1: 解析推文
    const step1 = createThinkingStep('📖 解析推文内容', '正在分析...')
    stepsContainer.appendChild(step1)
    await delay(300)
    updateThinkingStep(step1, '📖 解析推文内容', `作者: @${context.author}, 语言: ${context.language}, ${context.mediaUrls.length > 0 ? '含媒体' : '纯文字'}`)

    // 步骤2: 调用 AI
    const step2 = createThinkingStep('🤖 AI 思考中', '正在生成...')
    stepsContainer.appendChild(step2)

    try {
        const providerContext = toProviderContext(context)
        const result = await requestSmartReply(providerContext)

        if (!result.success || !result.reply) {
            throw new Error(result.error || 'AI 调用失败')
        }

        if (result.thinking?.length) {
            stepsContainer.innerHTML = ''
            result.thinking.forEach((step) => {
                const content = step.content || (step.status === 'done' ? '完成' : '')
                const stepEl = createThinkingStep(step.label, content)
                stepsContainer.appendChild(stepEl)
            })
        } else {
            updateThinkingStep(step2, '🤖 AI 思考中', '完成!')
        }

        replyEl.textContent = result.reply
        resultContainer.style.display = 'block'
        setupButtons(panel, backdrop, result.reply, context)

    } catch (error) {
        updateThinkingStep(step2, '❌ AI 调用失败', error instanceof Error ? error.message : '未知错误')
        errorText.textContent = error instanceof Error ? error.message : 'AI 调用失败'
        errorContainer.style.display = 'block'

        const fallback = getTemplateReply(context.language)
        replyEl.textContent = fallback
        resultContainer.style.display = 'block'
        setupButtons(panel, backdrop, fallback, context)
    }
}

function createThinkingStep(title: string, content: string): HTMLDivElement {
    const el = document.createElement('div')
    el.style.cssText = 'padding: 10px 12px; background: #192734; border-radius: 8px; margin-bottom: 6px; border-left: 3px solid #1da1f2;'
    el.innerHTML = `
        <div style="font-size: 12px; color: #1da1f2; font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 13px; color: #e1e8ed; line-height: 1.4;" class="step-content">${content}</div>
    `
    return el
}

function updateThinkingStep(el: HTMLDivElement, title: string, content: string) {
    el.innerHTML = `
        <div style="font-size: 12px; color: #17bf63; font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 13px; color: #e1e8ed; line-height: 1.4;" class="step-content">${content}</div>
    `
}

function getTemplateReply(lang: string): string {
    const replies: Record<string, string[]> = {
        zh: ['说得太对了', '这个观点很有意思', '深有同感'],
        ja: ['なるほど', '確かに', '面白いですね'],
        ko: ['정말 그렇네요', '좋은 관점이에요'],
        en: ['Great point', 'Totally agree', 'Interesting']
    }
    return (replies[lang] || replies.en)[Math.floor(Math.random() * 3)]
}

function toProviderContext(context: TweetContext): ProviderTweetContext {
    return {
        id: '',
        text: context.text,
        author: context.author,
        language: context.language,
        hasMedia: context.mediaUrls.length > 0,
        timestamp: new Date()
    }
}

function setupButtons(panel: HTMLElement, backdrop: HTMLElement, reply: string, context: TweetContext) {
    panel.querySelector('#xbooster-insert')?.addEventListener('click', () => {
        insertReply(reply)
        backdrop.remove()
        panel.remove()
    })

    panel.querySelector('#xbooster-copy')?.addEventListener('click', async () => {
        await navigator.clipboard.writeText(reply)
        const btn = panel.querySelector('#xbooster-copy') as HTMLElement
        btn.textContent = '已复制'
        setTimeout(() => btn.textContent = '复制', 1500)
    })

    panel.querySelector('#xbooster-regen')?.addEventListener('click', () => {
        panel.querySelector('#xbooster-steps')!.innerHTML = ''
            ; (panel.querySelector('#xbooster-result') as HTMLElement).style.display = 'none'
            ; (panel.querySelector('#xbooster-error') as HTMLElement).style.display = 'none'
        generateReply(context, panel, backdrop)
    })
}

function insertReply(text: string) {
    const inserted = insertTextIntoComposer(text)
    if (inserted) {
        if (DEBUG) console.log('✅ XBooster: Reply inserted successfully')
        return
    }

    // 如果找不到输入框，复制到剪贴板
    if (DEBUG) {
        console.log('⚠️ XBooster: No input found, copying to clipboard. Available contenteditable elements:')
        document.querySelectorAll('[contenteditable="true"]').forEach((el, i) => {
            console.log(`  ${i}:`, el.className, el.getAttribute('data-testid'))
        })
    }
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板，请手动粘贴')
}

function delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
}

export default function PlasmoContent() { return null }
