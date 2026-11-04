import { DEFAULT_DIFFICULTY } from './settings'

document.addEventListener('DOMContentLoaded', () => {
  const radios: NodeListOf<HTMLInputElement> = document.querySelectorAll(
    'input[name="difficulty"]'
  )
  const saveButton = document.getElementById('save') as HTMLButtonElement | null

  if (!saveButton) {
    console.error('save button not found')
    return
  }

  // load saved setting
  chrome.storage.sync.get(['difficulty'], (data: { difficulty: string }) => {
    const difficulty = data.difficulty ?? DEFAULT_DIFFICULTY
    const target = document.querySelector<HTMLInputElement>(
      `input[name="difficulty"][value="${difficulty}"]`
    )
    if (target) target.checked = true
  })

  saveButton.addEventListener('click', () => {
    const selected =
      [...radios].find((r) => r.checked)?.value ?? DEFAULT_DIFFICULTY

    chrome.storage.sync.set({ difficulty: selected }, () => {
      alert(`Difficulty「${selected}」saved.`)
    })
  })
})
