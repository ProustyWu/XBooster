export interface OutlineResult {
  id: string
  title: string
  points: string[]
  hook: string
  targetPlatform: string
}

export interface HandoffPayload {
  topic: string
  selectedOutline: OutlineResult
  language: string
  targetPlatform: string
  timestamp: string
  source: "xbooster-extension"
}

export interface OutlineGeneratorResult {
  success: boolean
  outlines: OutlineResult[]
  error?: string
}
