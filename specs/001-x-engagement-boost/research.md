# Research: X Engagement Boost

**Feature**: 001-x-engagement-boost  
**Date**: 2026-01-31

## Technology Decisions

### 1. Browser Extension Framework

**Decision**: Plasmo Framework

**Rationale**:

- First-class Manifest V3 support (Chrome's current standard)
- React/TypeScript integration out-of-the-box
- Hot reload during development
- Cross-browser build support (Chrome, Firefox, Safari)
- Active community and documentation

**Alternatives Considered**:

| Option | Rejected Because |
|--------|------------------|
| Raw Manifest V3 | Too much boilerplate, no React integration |
| WXT | Newer, less mature ecosystem |
| Chrome Extension CLI | Limited React support |

### 2. AI Provider Integration Pattern

**Decision**: Adapter Pattern with Provider Registry

**Rationale**:

- Unified interface (`AIProvider`) for all providers
- Easy to add new providers without changing core logic
- Runtime provider switching via settings
- Each adapter handles its own API specifics (auth, rate limits, error handling)

**Interface Design**:

```typescript
interface AIProvider {
  name: string;
  id: ProviderType;
  
  // Core operations
  generateReply(context: TweetContext): Promise<GeneratedContent[]>;
  generateTweet(idea: string): Promise<GeneratedContent[]>;
  
  // Utilities
  detectLanguage(text: string): Promise<string>;
  validateApiKey(key: string): Promise<boolean>;
}
```

**Alternatives Considered**:

| Option | Rejected Because |
|--------|------------------|
| Single provider hardcoded | Violates Constitution Principle II |
| Backend proxy | Violates Constitution Principle IV (Privacy-First) |

### 3. Language Detection

**Decision**: AI Provider's Native Detection + Fallback

**Rationale**:

- Most AI providers can detect language in the prompt context
- No additional API calls needed
- Fallback to `franc` library for offline/quick detection

**Implementation**:

1. Primary: Include "detect and match language" in AI prompt
2. Fallback: Use `franc` npm package for quick local detection

### 4. Content Script Injection Strategy

**Decision**: MutationObserver + Targeted Injection

**Rationale**:

- X uses dynamic content loading (SPA architecture)
- MutationObserver watches for new tweets appearing
- Inject XBooster UI elements near reply buttons
- Minimal DOM manipulation to avoid X updates breaking the extension

**Injection Points**:

- Tweet action bar (near reply/retweet/like buttons)
- Reply compose box (for reply suggestions)

### 5. State Management

**Decision**: React Context + Chrome Storage API

**Rationale**:

- React Context for UI state (simple, no external deps)
- Chrome Storage API for persistent settings
- No need for Redux/Zustand complexity at this scale

**Storage Schema**:

```typescript
interface StoredSettings {
  selectedProvider: ProviderType;
  apiKeys: Record<ProviderType, string>;
  replyMode: 'engaging' | 'professional' | 'witty';
  uiPreferences: {
    showInlineButtons: boolean;
    autoDetectLanguage: boolean;
  };
}
```

### 6. Styling Approach

**Decision**: TailwindCSS with Shadow DOM

**Rationale**:

- TailwindCSS for rapid UI development
- Shadow DOM to isolate extension styles from X's CSS
- Prevents X's styles from affecting extension UI
- Prevents extension styles from breaking X's layout

## API Research

### OpenAI API

- Endpoint: `https://api.openai.com/v1/chat/completions`
- Model: `gpt-4o` for best quality, `gpt-4o-mini` for speed
- Rate limits: 500 RPM (requests per minute) on tier 1

### Anthropic Claude API

- Endpoint: `https://api.anthropic.com/v1/messages`
- Model: `claude-3-5-sonnet-latest` for balance
- Rate limits: 50 RPM on tier 1

### xAI Grok API

- Endpoint: `https://api.x.ai/v1/chat/completions`
- Model: `grok-2-latest`
- OpenAI-compatible format

### Google Gemini API

- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- Model: `gemini-2.0-flash`
- Different request format, needs adapter

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| X UI changes breaking injection | Use semantic selectors, implement fallback detection |
| API rate limits | Client-side rate limiting, caching recent generations |
| API key security | Never log keys, use Chrome's secure storage |
| Large bundle size | Tree-shaking, lazy load provider adapters |

## Open Questions (Resolved)

- ~~Which AI providers to support?~~ → OpenAI, Claude, Grok, Gemini (4 providers)
- ~~How to handle X's dynamic DOM?~~ → MutationObserver pattern
- ~~Where to store API keys?~~ → Chrome Storage API (local, encrypted)
