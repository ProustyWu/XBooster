# AI Provider Contract

**Feature**: 001-x-engagement-boost  
**Version**: 1.0.0

## AIProvider Interface

All AI providers MUST implement this interface to be registered in the extension.

```typescript
// src/providers/types.ts

export type ProviderType = 'openai' | 'claude' | 'grok' | 'gemini';

export type ReplyMode = 'engaging' | 'professional' | 'witty';

export interface TweetContext {
  id: string;
  text: string;
  author: string;
  language: string;
  hasMedia: boolean;
  timestamp: Date;
  metrics?: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };
}

export interface GeneratedContent {
  id: string;
  text: string;
  language: string;
  provider: ProviderType;
  strategy: string;
  confidence: number;
  createdAt: Date;
}

export interface GenerationOptions {
  mode: ReplyMode;
  count?: number; // Default: 3
  maxLength?: number; // Default: 280 for tweets, 10000 for replies
}

export interface AIProvider {
  // Provider identification
  readonly name: string;
  readonly id: ProviderType;
  
  // Core generation methods
  generateReply(
    context: TweetContext,
    options?: GenerationOptions
  ): Promise<GeneratedContent[]>;
  
  generateTweet(
    idea: string,
    options?: GenerationOptions
  ): Promise<GeneratedContent[]>;
  
  // Utility methods
  detectLanguage(text: string): Promise<string>;
  validateApiKey(key: string): Promise<boolean>;
  
  // Configuration
  configure(apiKey: string): void;
  isConfigured(): boolean;
}
```

## Provider Registry Contract

```typescript
// src/providers/index.ts

export interface ProviderRegistry {
  register(provider: AIProvider): void;
  get(id: ProviderType): AIProvider | undefined;
  getAll(): AIProvider[];
  getConfigured(): AIProvider[];
}
```

## Error Contract

```typescript
// src/providers/errors.ts

export class ProviderError extends Error {
  constructor(
    public readonly provider: ProviderType,
    public readonly code: ProviderErrorCode,
    message: string
  ) {
    super(message);
  }
}

export type ProviderErrorCode =
  | 'INVALID_API_KEY'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'CONTENT_FILTERED'
  | 'QUOTA_EXCEEDED'
  | 'UNKNOWN';
```

## Prompt Templates

Each provider adapter MUST use these prompt templates (adapted for provider's format):

### Reply Generation Prompt

```text
You are helping a user engage on X (Twitter). Generate {count} reply suggestions.

ORIGINAL TWEET:
Author: @{author}
Content: "{text}"
Language: {language}

REQUIREMENTS:
- Match the language of the original tweet ({language})
- Mode: {mode} (engaging=maximize likes, professional=formal, witty=humorous)
- Each reply must be unique in approach
- Maximum length: {maxLength} characters

OUTPUT FORMAT:
Return exactly {count} replies as JSON array:
[
  {"text": "reply text", "strategy": "brief description of approach"}
]
```

### Tweet Composition Prompt

```text
You are helping a user create viral content on X (Twitter).

USER'S IDEA:
"{idea}"

REQUIREMENTS:
- Generate {count} tweet variations
- Each uses a different engagement strategy
- Optimize for maximum reach and engagement
- Maximum length: 280 characters

OUTPUT FORMAT:
Return exactly {count} tweets as JSON array:
[
  {"text": "tweet text", "strategy": "engagement hook used"}
]
```
