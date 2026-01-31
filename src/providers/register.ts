import { providerRegistry } from "~/providers"
import { openaiProvider } from "~/providers/openai"
import { claudeProvider } from "~/providers/claude"
import { grokProvider } from "~/providers/grok"
import { geminiProvider } from "~/providers/gemini"

let registered = false

export function ensureProvidersRegistered() {
  if (registered) return
  providerRegistry.register(openaiProvider)
  providerRegistry.register(claudeProvider)
  providerRegistry.register(grokProvider)
  providerRegistry.register(geminiProvider)
  registered = true
}
