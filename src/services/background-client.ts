import type { TweetContext } from "~/providers/types"
import type { OutlineGeneratorResult } from "~/services/outline-types"
import type { SmartReplyResult } from "~/services/smart-reply-types"

type SmartReplyMessage = {
  type: "XBOOSTER_SMART_REPLY"
  payload: TweetContext
}

type OutlineMessage = {
  type: "XBOOSTER_OUTLINES"
  payload: {
    topic: string
    targetPlatform: string
  }
}

function sendMessage<T>(message: SmartReplyMessage | OutlineMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(err)
        return
      }
      resolve(response as T)
    })
  })
}

export function requestSmartReply(context: TweetContext): Promise<SmartReplyResult> {
  return sendMessage<SmartReplyResult>({
    type: "XBOOSTER_SMART_REPLY",
    payload: context
  })
}

export function requestOutlines(
  topic: string,
  targetPlatform: string
): Promise<OutlineGeneratorResult> {
  return sendMessage<OutlineGeneratorResult>({
    type: "XBOOSTER_OUTLINES",
    payload: { topic, targetPlatform }
  })
}
