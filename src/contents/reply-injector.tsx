/**
 * XBooster Reply Injector - v6
 * Injects button into reply composer toolbar (not floating)
 */

import type { PlasmoCSConfig } from 'plasmo'

export const config: PlasmoCSConfig = {
    matches: ['https://twitter.com/*', 'https://x.com/*'],
    all_frames: true,
    run_at: 'document_idle'
}

console.log('🚀 XBooster: Content script loaded!')

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
    setTimeout(() => injectButtons(), 1500)
    const observer = new MutationObserver(() => injectButtons())
    observer.observe(document.body, { childList: true, subtree: true })
    setInterval(() => injectButtons(), 2000)
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
                console.log('🎉 XBooster: Injected button next to Reply button')
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
                console.log('🎉 XBooster: Injected button into toolbar')
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
                    console.log('🎉 XBooster: Injected button into button row')
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
                            console.log('🎉 XBooster: Injected button near composer')
                            return
                        }
                    }
                }
            }
        }
    })
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
    console.log('👆 XBooster: Button clicked!')

    const existingPanel = document.querySelector('.xbooster-panel')
    if (existingPanel) {
        document.querySelector('.xbooster-backdrop')?.remove()
        existingPanel.remove()
        return
    }

    const context = extractTweetContext()
    console.log('📝 XBooster: Context:', context)
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

    console.log('🌐 XBooster: Language detection - text:', text.slice(0, 50), 'displayName:', displayName, 'result:', language)

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
    // 优先检测推文文字
    const textLang = detectLangFromChars(text)
    if (textLang !== 'en') return textLang

    // 如果推文是英文或空，检测 display name
    const nameLang = detectLangFromChars(displayName)
    if (nameLang !== 'en') return nameLang

    // 默认返回英文
    return 'en'
}

function detectLangFromChars(text: string): string {
    // 检测日文（平假名、片假名）- 优先级最高
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
    // 检测韩文
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
    // 检测中文（汉字，排除日文中的汉字）
    // 如果有汉字但没有日文假名，判断为中文
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'
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

    panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <span style="font-size: 16px; font-weight: bold; color: #1da1f2;">✨ XBooster 智能回复</span>
      <button id="xbooster-close" style="background: none; border: none; color: #8899a6; font-size: 24px; cursor: pointer;">×</button>
    </div>
    
    <div style="background: #192734; border-radius: 12px; padding: 12px; margin-bottom: 16px;">
      <div style="font-size: 12px; color: #8899a6; margin-bottom: 4px;">
        回复给 @${context.author} 
        <span style="background: #1da1f2; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">${langLabel}</span>
        ${mediaLabel}
      </div>
      <div style="font-size: 13px; color: #e1e8ed; line-height: 1.4;">${context.text.slice(0, 150)}${context.text.length > 150 ? '...' : ''}</div>
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
        const rawResponse = await callAI(context)

        // 尝试解析 JSON
        let postType = '', analysis = '', strategy = '', reply = ''
        try {
            // 提取 JSON（处理可能的 markdown 包裹）
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                postType = parsed.postType || ''
                analysis = parsed.analysis || ''
                strategy = parsed.strategy || ''
                reply = parsed.reply || rawResponse
            } else {
                reply = rawResponse
            }
        } catch {
            // JSON 解析失败，直接使用原始回复
            reply = rawResponse
        }

        updateThinkingStep(step2, '🤖 AI 思考中', '完成!')

        // 步骤3: 展示帖子类型（如果有）
        if (postType) {
            const step2b = createThinkingStep('📑 帖子类型', postType)
            stepsContainer.appendChild(step2b)
            await delay(80)
        }

        // 步骤4: 展示分析（如果有）
        if (analysis) {
            const step3 = createThinkingStep('🔍 内容分析', analysis)
            stepsContainer.appendChild(step3)
            await delay(100)
        }

        // 步骤5: 展示策略（如果有）
        if (strategy) {
            const step4 = createThinkingStep('💡 回复策略', strategy)
            stepsContainer.appendChild(step4)
            await delay(100)
        }

        // 步骤5: 最终回复
        const step5 = createThinkingStep('✨ 生成回复', '完成!')
        stepsContainer.appendChild(step5)

        replyEl.textContent = reply
        resultContainer.style.display = 'block'
        setupButtons(panel, backdrop, reply, context)

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



async function callAI(context: TweetContext): Promise<string> {
    const settings = await chrome.storage.local.get('xbooster_settings')
    console.log('🔑 XBooster: Settings from storage:', settings)

    const apiKeys = settings.xbooster_settings?.apiKeys || {}
    const provider = settings.xbooster_settings?.selectedProvider || 'gemini'
    const apiKey = apiKeys[provider]

    console.log('🔑 XBooster: Provider:', provider, 'API Key (first 10 chars):', apiKey?.slice(0, 10) || 'NOT SET')

    if (!apiKey) {
        throw new Error(`未配置 ${provider.toUpperCase()} API Key`)
    }

    const langName = { zh: '中文', ja: '日语', ko: '韩语', en: '英语' }[context.language] || '中文'

    if (context.mediaUrls.length > 0 && (provider === 'gemini' || provider === 'openai')) {
        return await callVisionAI(provider, apiKey, context, langName)
    }

    const prompt = buildPrompt(context, langName)

    if (provider === 'gemini') return await callGemini(apiKey, prompt)
    if (provider === 'openai') return await callOpenAI(apiKey, prompt)
    if (provider === 'claude') return await callClaude(apiKey, prompt)
    if (provider === 'grok') return await callGrok(apiKey, prompt)

    throw new Error('Unsupported provider')
}

// 帖子类型
type PostType = 'news' | 'humor' | 'question' | 'product' | 'general'

// 检测帖子类型
function detectPostType(text: string): PostType {
    const lowerText = text.toLowerCase()

    // 问题/求助检测
    if (/[?？]/.test(text) ||
        /怎么|如何|什么|为什么|有谁|求助|请问|咋|啥/.test(text) ||
        /how|what|why|anyone|help|recommend/.test(lowerText)) {
        return 'question'
    }

    // 幽默/meme 检测
    if (/😂|🤣|笑|哈哈|lol|lmao|梗|meme|太搞了|笑死/.test(text) ||
        /ワロタ|草|www|笑う/.test(text)) {
        return 'humor'
    }

    // 新闻/热点检测
    if (/突发|刚刚|速报|最新|重磅|官方|发布|宣布|报道|breaking|just in|announce/.test(lowerText) ||
        /#[^\s]+/.test(text)) {  // 含 hashtag 通常是热点
        return 'news'
    }

    // 产品/推广检测
    if (/推荐|安利|好用|测评|review|产品|服务|购买|优惠|链接|link/.test(lowerText)) {
        return 'product'
    }

    return 'general'
}

// 根据帖子类型生成提示词
function buildPrompt(context: TweetContext, langName: string): string {
    const postType = detectPostType(context.text)

    const baseRules = `模仿真人回复规则：
- 使用口语化、自然表达，像朋友聊天
- 去AI味：避免完美句式、重复模式
- 去老登味：用现代俚语，避免正式古板
- 整体自然和谐`

    const prompts: Record<PostType, string> = {
        news: `你是 X 平台流量专家。有一个高流量新闻/热点帖子。

推文: "${context.text}"  
作者: @${context.author}

先即时分析原帖：提取核心主题、语气（积极/争议）、关键数据或观点，潜在互动点。

生成 JSON 回复：
{
  "postType": "新闻/热点",
  "analysis": "核心主题、语气、互动点分析（30-50字）",
  "strategy": "以个人观点或数据开头，制造共鸣或争议",
  "reply": "回复（${langName}，不超280字符）"
}

回复策略：
- 以个人观点或数据开头，制造共鸣或争议
- 加入 emoji 增强视觉吸引力
- 以问题或呼吁结束（如"你们怎么看？"）
- 确保积极专业，避免负面攻击
${baseRules}

只输出 JSON。`,

        humor: `你是 X 上的幽默互动专家。有一个高流量 meme/幽默帖子。

推文: "${context.text}"
作者: @${context.author}

先分析原帖：提取梗点、幽默类型（自嘲/讽刺）、潜在延续方式。

生成 JSON：
{
  "postType": "幽默/Meme",
  "analysis": "梗点和幽默类型分析（20-40字）",
  "strategy": "延续梗点，添加个人twist或自嘲",
  "reply": "风趣回复（${langName}，140字符内）"
}

回复策略：
- 延续原帖梗点，添加个人 twist 或自嘲元素
- 使用 emoji
- 以开放式问题结束（如"谁有更惨的经历？"）
- 保持轻松，避免敏感话题
${baseRules}

只输出 JSON。`,

        question: `你是 X 流量增长专家。有一个高流量问题/求助帖子。

推文: "${context.text}"
作者: @${context.author}

先分析：提取问题核心、用户痛点、潜在价值提供点。

生成 JSON：
{
  "postType": "问题/求助",
  "analysis": "问题核心和痛点分析（20-40字）",
  "strategy": "先共鸣再提供实用建议",
  "reply": "有价值回复（${langName}，200字符内）"
}

回复策略：
- 先认可问题，显示共鸣（如"很多人都有这个困扰"）
- 提供 2-3 条实用 tips 或个人经验
- 以问题反问或邀请分享结束（如"试试看，效果如何？"）
- 语气专业、鼓励，避免推销感
${baseRules}

只输出 JSON。`,

        product: `你是 X 营销专家。有一个高流量产品/推广帖子。

推文: "${context.text}"
作者: @${context.author}

先分析：提取产品亮点、比较点、潜在转化机会。

生成 JSON：
{
  "postType": "产品/推广",
  "analysis": "产品亮点和比较点分析（20-40字）",
  "strategy": "赞同但提供比较或补充",
  "reply": "吸引人回复（${langName}，180字符内）"
}

回复策略：
- 赞同原帖，但提供比较或补充
- 分享简短案例或数据
- 使用 emoji 提升吸引力
- 避免硬广，保持自然
${baseRules}

只输出 JSON。`,

        general: `你是 X 高互动回复生成器。

推文: "${context.text}"
作者: @${context.author}

先分析：提取主题、语气、关键元素、互动潜力。

生成 JSON：
{
  "postType": "通用",
  "analysis": "主题、语气和互动潜力分析（20-40字）",
  "strategy": "情感连接 + 价值输出 + 互动引导",
  "reply": "优化回复（${langName}，不超280字符）"
}

核心策略：
- 开头制造情感连接（同意/惊讶/幽默）
- 中间添加价值（观点/数据/故事）
- 结尾用问题或 CTA 激发互动
- 融入 1-2 emoji
- 优先情感驱动，避免平淡
${baseRules}

只输出 JSON。`
    }

    console.log('📊 XBooster: Detected post type:', postType)
    return prompts[postType]
}

async function callVisionAI(provider: string, apiKey: string, context: TweetContext, langName: string): Promise<string> {
    const postType = detectPostType(context.text)
    const postTypeLabel = {
        news: '新闻/热点',
        humor: '幽默/Meme',
        question: '问题/求助',
        product: '产品/推广',
        general: '通用'
    }[postType]

    const prompt = `你是 X 高互动回复专家。分析这条带图片/视频的推文并生成回复。

推文: "${context.text}"
作者: @${context.author}
帖子类型: ${postTypeLabel}
(包含图片/视频，请仔细分析图片内容)

生成 JSON：
{
  "postType": "${postTypeLabel}",
  "analysis": "对推文文字+图片内容的综合分析（30-50字，务必描述图片亮点）",
  "strategy": "回复策略，可评论图片细节（15-25字）",
  "reply": "自然回复（${langName}，150-280字符，融入对图片的评论）"
}

模仿真人回复规则：
- 使用口语化、自然表达，像朋友聊天
- 去AI味：避免完美句式、重复模式
- 去老登味：用现代俚语，避免正式古板
- 可以对图片的具体内容发表评论
- 加入 emoji 增强表达

只输出 JSON。`

    console.log('📊 XBooster Vision: Detected post type:', postType)

    if (provider === 'gemini') return await callGeminiVision(apiKey, prompt, context.mediaUrls)
    if (provider === 'openai') return await callOpenAIVision(apiKey, prompt, context.mediaUrls)
    throw new Error('Provider does not support Vision')
}

async function callGeminiVision(apiKey: string, prompt: string, imageUrls: string[]): Promise<string> {
    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [{ text: prompt }]

    for (const url of imageUrls.slice(0, 2)) {
        try {
            const data = await fetchImageBase64(url)
            if (data) parts.push({ inline_data: { mime_type: 'image/jpeg', data } })
        } catch { }
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.9 } })
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Gemini Vision API error:', errorData)
        throw new Error(errorData.error?.message || `Gemini error: ${res.status}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

async function callOpenAIVision(apiKey: string, prompt: string, imageUrls: string[]): Promise<string> {
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [{ type: 'text', text: prompt }]
    imageUrls.slice(0, 2).forEach(url => content.push({ type: 'image_url', image_url: { url } }))

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content }], temperature: 0.9 })
    })

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
}

async function fetchImageBase64(url: string): Promise<string | null> {
    try {
        const res = await fetch(url)
        const blob = await res.blob()
        return new Promise(resolve => {
            const reader = new FileReader()
            reader.onloadend = () => resolve((reader.result as string).split(',')[1])
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
        })
    } catch { return null }
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9 } })
    })
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Gemini API error:', errorData)
        throw new Error(errorData.error?.message || `Gemini error: ${res.status}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.9 })
    })
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
}

async function callClaude(apiKey: string, prompt: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 200, messages: [{ role: 'user', content: prompt }] })
    })
    if (!res.ok) throw new Error(`Claude error: ${res.status}`)
    const data = await res.json()
    return data.content?.[0]?.text?.trim() || ''
}

async function callGrok(apiKey: string, prompt: string): Promise<string> {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'grok-2-latest', messages: [{ role: 'user', content: prompt }], temperature: 0.9 })
    })
    if (!res.ok) throw new Error(`Grok error: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
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
    // 尝试多种选择器找到 X.com 的回复输入框
    const selectors = [
        '[data-testid="tweetTextarea_0"] [contenteditable="true"]',
        '[data-testid="tweetTextarea_0RichTextInputContainer"] [contenteditable="true"]',
        '[role="textbox"][contenteditable="true"]',
        'div[contenteditable="true"][data-block="true"]',
        '.public-DraftEditor-content[contenteditable="true"]',
        '[contenteditable="true"][spellcheck]'
    ]

    let editableDiv: HTMLElement | null = null
    for (const selector of selectors) {
        editableDiv = document.querySelector(selector) as HTMLElement
        if (editableDiv) {
            console.log('📝 XBooster: Found input with selector:', selector)
            break
        }
    }

    if (editableDiv) {
        try {
            editableDiv.focus()

            // 选中所有内容然后删除
            const selection = window.getSelection()
            const range = document.createRange()
            range.selectNodeContents(editableDiv)
            selection?.removeAllRanges()
            selection?.addRange(range)

            // 使用 execCommand 插入文本 - 这会触发 React 状态更新
            document.execCommand('insertText', false, text)

            // 再次触发各种事件确保状态更新
            editableDiv.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: text
            }))

            // 模拟 keyup 事件
            editableDiv.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))

            console.log('✅ XBooster: Reply inserted successfully')
            return
        } catch (e) {
            console.error('❌ XBooster: Insert failed:', e)
        }
    }

    // 如果找不到输入框，复制到剪贴板
    console.log('⚠️ XBooster: No input found, copying to clipboard. Available contenteditable elements:')
    document.querySelectorAll('[contenteditable="true"]').forEach((el, i) => {
        console.log(`  ${i}:`, el.className, el.getAttribute('data-testid'))
    })
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板，请手动粘贴')
}

function delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
}

export default function PlasmoContent() { return null }
