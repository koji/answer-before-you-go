document.addEventListener('DOMContentLoaded', () => {
  const powerToggle = document.getElementById(
    'powerToggle'
  ) as HTMLInputElement | null
  const radios: NodeListOf<HTMLInputElement> = document.querySelectorAll(
    'input[name="difficulty"]'
  )
  const languageSelect = document.getElementById(
    'languageSelect'
  ) as HTMLSelectElement | null
  const statusDiv = document.getElementById('status') as HTMLDivElement | null

  let statusTimeout: number

  function showStatus(message: string, duration: number = 1500) {
    if (!statusDiv) return
    clearTimeout(statusTimeout)
    statusDiv.textContent = message
    statusTimeout = window.setTimeout(() => {
      statusDiv.textContent = ''
    }, duration)
  }

  function saveOption(key: string, value: string | boolean, message: string) {
    chrome.storage.sync.set({ [key]: value }, () => {
      showStatus(message)
    })
  }

  // Load all settings (same keys and defaults as the popup)
  chrome.storage.sync.get(
    { difficulty: 'medium', enabled: true, language: 'en' },
    (data) => {
      const difficulty =
        typeof data.difficulty === 'string' ? data.difficulty : 'medium'
      const target = document.querySelector<HTMLInputElement>(
        `input[name="difficulty"][value="${difficulty}"]`
      )
      if (target) target.checked = true
      if (powerToggle) {
        powerToggle.checked =
          typeof data.enabled === 'boolean' ? data.enabled : true
      }
      if (languageSelect) {
        languageSelect.value =
          typeof data.language === 'string' ? data.language : 'en'
      }
    }
  )

  powerToggle?.addEventListener('change', () => {
    const isEnabled = powerToggle.checked
    saveOption(
      'enabled',
      isEnabled,
      `Link blocker is now ${isEnabled ? 'ON' : 'OFF'}`
    )
  })

  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        saveOption(
          'difficulty',
          radio.value,
          `Difficulty set to "${radio.value}"`
        )
      }
    })
  })

  languageSelect?.addEventListener('change', () => {
    saveOption(
      'language',
      languageSelect.value,
      `Language set to "${languageSelect.value}"`
    )
  })
})
