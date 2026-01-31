# Data Model: X Engagement Boost

**Feature**: 001-x-engagement-boost  
**Date**: 2026-01-31

## Core Entities

### TweetContext

Represents the context of a tweet being replied to or analyzed.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Tweet ID from X |
| text | string | Full tweet text content |
| author | string | Author's username |
| language | string | Detected language (ISO 639-1) |
| hasMedia | boolean | Whether tweet contains media |
| timestamp | Date | When tweet was posted |
| metrics | TweetMetrics | Engagement metrics (optional) |

**Validation Rules**:

- `text` must not be empty
- `language` must be valid ISO 639-1 code

### TweetMetrics

| Field | Type | Description |
|-------|------|-------------|
| likes | number | Like count |
| retweets | number | Retweet count |
| replies | number | Reply count |
| views | number | View count (if available) |

### GeneratedContent

Result from AI content generation.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique ID for this generation |
| text | string | Generated text content |
| language | string | Language of generated content |
| provider | ProviderType | Which AI generated this |
| strategy | string | Engagement strategy used |
| confidence | number | AI confidence score (0-1) |
| createdAt | Date | Generation timestamp |

**Validation Rules**:

- `text` length must be ≤ 280 for tweets, ≤ 10000 for replies
- `confidence` must be between 0 and 1

### UserSettings

Persistent user preferences.

| Field | Type | Description |
|-------|------|-------------|
| selectedProvider | ProviderType | Active AI provider |
| apiKeys | Record<ProviderType, string> | Encrypted API keys |
| replyMode | ReplyMode | Default reply style |
| uiPreferences | UIPreferences | UI customization |
| lastUpdated | Date | Settings modification time |

### UIPreferences

| Field | Type | Description |
|-------|------|-------------|
| showInlineButtons | boolean | Show buttons in tweet feed |
| autoDetectLanguage | boolean | Auto-detect vs manual language |
| darkMode | 'auto' \| 'light' \| 'dark' | Theme preference |

## Enums

### ProviderType

```
openai | claude | grok | gemini
```

### ReplyMode

```
engaging | professional | witty
```

## State Transitions

### Generation Flow

```
IDLE → LOADING → SUCCESS | ERROR
  ↑__________________________|
```

| State | Trigger | Actions |
|-------|---------|---------|
| IDLE | User clicks generate | Show loading UI |
| LOADING | API call started | Display spinner, disable buttons |
| SUCCESS | API returns content | Display 3 options, enable selection |
| ERROR | API fails | Show error message, enable retry |

## Relationships

```
UserSettings
    ├── selectedProvider → ProviderType
    └── apiKeys → [ProviderType: encrypted_key]

TweetContext
    └── GeneratedContent[] (1:many, generated replies)

GeneratedContent
    └── provider → ProviderType
```
