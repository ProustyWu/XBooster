/**
 * Background service worker
 * Handles AI requests from content scripts and popup
 */

import type { TweetContext } from "~/providers/types"
import { ensureProvidersRegistered } from "~/providers/register"
import { generateSmartReply } from "~/services/smart-reply"
import { generateOutlines } from "~/services/outline-generator"

ensureProvidersRegistered()

type SmartReplyRequest = {
  type: "XBOOSTER_SMART_REPLY"
  payload: TweetContext
}

type OutlineRequest = {
  type: "XBOOSTER_OUTLINES"
  payload: {
    topic: string
    targetPlatform: string
  }
}

type XBoosterRequest = SmartReplyRequest | OutlineRequest

chrome.runtime.onMessage.addListener((message: XBoosterRequest, _sender, sendResponse) => {
  if (!message || typeof message !== "object" || !("type" in message)) {
    return false
  }

  if (message.type === "XBOOSTER_SMART_REPLY") {
    void (async () => {
      try {
        const result = await generateSmartReply(message.payload, () => {})
        sendResponse(result)
      } catch (error) {
        sendResponse({
          success: false,
          reply: "",
          thinking: [],
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    })()
    return true
  }

  if (message.type === "XBOOSTER_OUTLINES") {
    void (async () => {
      try {
        const result = await generateOutlines(
          message.payload.topic,
          message.payload.targetPlatform
        )
        sendResponse(result)
      } catch (error) {
        sendResponse({
          success: false,
          outlines: [],
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    })()
    return true
  }

  return false
})
