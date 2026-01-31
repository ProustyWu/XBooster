import type { HandoffPayload, OutlineResult } from "~/services/outline-types"

export function createHandoffPayload(
  topic: string,
  outline: OutlineResult,
  language: string = "zh"
): HandoffPayload {
  return {
    topic,
    selectedOutline: outline,
    language,
    targetPlatform: outline.targetPlatform,
    timestamp: new Date().toISOString(),
    source: "xbooster-extension"
  }
}

export function formatHandoffForClipboard(payload: HandoffPayload): string {
  return `---
# XBooster Handoff
topic: ${payload.topic}
platform: ${payload.targetPlatform}
language: ${payload.language}
timestamp: ${payload.timestamp}
source: ${payload.source}
---

## 选定大纲

### ${payload.selectedOutline.title}

**开头钩子**：${payload.selectedOutline.hook}

**要点**：
${payload.selectedOutline.points.map((p, i) => `${i + 1}. ${p}`).join("\n")}

---
请使用 x-content-writer skill 继续深度写作。
`
}
