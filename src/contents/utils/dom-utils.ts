export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;"
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case '"':
        return "&quot;"
      case "'":
        return "&#39;"
      default:
        return char
    }
  })
}

export function insertTextIntoComposer(text: string): boolean {
  const selectors = [
    '[data-testid="tweetTextarea_0"] [contenteditable="true"]',
    '[data-testid="tweetTextarea_0RichTextInputContainer"] [contenteditable="true"]',
    '[role="textbox"][contenteditable="true"]',
    'div[contenteditable="true"][data-block="true"]',
    '.public-DraftEditor-content[contenteditable="true"]',
    '[contenteditable="true"][spellcheck]'
  ]

  let editableDiv: HTMLElement | null = null
  for (const selector of selectors) {
    editableDiv = document.querySelector(selector) as HTMLElement
    if (editableDiv) {
      break
    }
  }

  if (!editableDiv) return false

  try {
    editableDiv.focus()

    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(editableDiv)
    selection?.removeAllRanges()
    selection?.addRange(range)

    const canExec = typeof document.execCommand === "function"
    if (canExec) {
      document.execCommand("insertText", false, text)
    } else {
      editableDiv.textContent = text
    }

    editableDiv.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: text
      })
    )

    editableDiv.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }))
    return true
  } catch {
    return false
  }
}
