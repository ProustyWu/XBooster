# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Background service worker for AI requests and message handling.
- Unified provider registration helper and AI client for centralized configuration.
- Quick Outline handoff flow to x-content-writer Skill.
- Privacy, security, and open-source checklist documents.
- Issue and PR templates for open-source contributions.

### Changed
- Moved AI requests out of content scripts into background.
- Smart reply now uses `generateReply` with strict length limits.
- Outline generation uses structured text parsing for stability.
- Content script injection is debounced to reduce overhead.
- README and Quickstart updated for new flow and manual posting.
- Host permissions expanded to include AI provider endpoints and media hosts.

### Security
- Removed sensitive logging in content scripts and popup.
- Escaped tweet content when rendering injected panels.

