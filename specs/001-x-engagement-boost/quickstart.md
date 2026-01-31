# XBooster Quickstart Guide

**Feature**: 001-x-engagement-boost  
**Date**: 2026-01-31

## Prerequisites

- Node.js 18+ and pnpm
- Chrome browser (for development)
- API key from at least one provider: OpenAI, Anthropic, xAI, or Google

## Quick Setup

```bash
# Clone and install
cd XBooster
pnpm install

# Start development server
pnpm dev
```

This opens Chrome with the extension loaded. Changes hot-reload automatically.

## Load in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `build/chrome-mv3-dev` folder

## Configure API Key

1. Click XBooster icon in toolbar
2. Go to Settings (gear icon)
3. Select your AI provider
4. Enter API key
5. Click "Save"

## Usage

### Smart Reply

1. Browse to any tweet on x.com
2. Click the XBooster ✨ button near the reply button
3. Select from 3 AI-generated replies
4. Edit if needed, then post

### Tweet Composer

1. Click XBooster icon in toolbar
2. Type your idea in the text box
3. Click "Generate"
4. Select your favorite variation
5. Click "Post to X"

## Project Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Build production extension |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm lint` | Lint code |

## File Structure

```
src/
├── contents/       # Injected into X pages
├── popup/          # Extension popup UI
├── providers/      # AI provider adapters
├── services/       # Business logic
└── storage/        # Chrome storage wrapper
```

## Adding a New AI Provider

1. Create `src/providers/{name}.ts` implementing `AIProvider`
2. Register in `src/providers/index.ts`
3. Add UI option in `SettingsPanel.tsx`
4. Test with `pnpm test -- providers/{name}`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not loading | Check console in chrome://extensions |
| API errors | Verify API key in settings |
| Buttons not showing | Refresh X page, check for DOM changes |
