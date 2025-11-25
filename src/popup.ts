document.addEventListener('DOMContentLoaded', () => {
  const radios = document.querySelectorAll<HTMLInputElement>(
    'input[name="difficulty"]'
  )
  const saveButton = document.getElementById('save') as HTMLButtonElement | null
  const status = document.getElementById('status') as HTMLDivElement | null

  const powerToggle = document.getElementById(
    'powerToggle'
  ) as HTMLButtonElement | null
  const powerText = document.getElementById(
    'powerText'
  ) as HTMLSpanElement | null
  const languageSelect = document.getElementById(
    'languageSelect'
  ) as HTMLSelectElement | null

  function renderEnabled(enabled: boolean): void {
    if (powerToggle) {
      powerToggle.classList.toggle('on', enabled)
      powerToggle.classList.toggle('off', !enabled)
      powerToggle.setAttribute('aria-pressed', String(enabled))
    }

    if (powerText) {
      powerText.textContent = enabled ? 'ON' : 'OFF'
    }
  }

  // 現在の設定を読み込み（language のデフォルトを "en" にしておく）
  chrome.storage.sync.get(
    { difficulty: 'easy', enabled: true, language: 'en' },
    (data: { difficulty: string; enabled: boolean; language: string }) => {
      // 難易度
      // const currentDifficulty = data.difficulty
      const target = document.querySelector<HTMLInputElement>(
        `input[name="difficulty"][value="${data.difficulty}"]`
      )
      if (target) {
        target.checked = true
      }

      // ON/OFF
      renderEnabled(data.enabled)

      // 言語
      // languageSelect.value = data.language || 'en'
      const languageSelect = document.getElementById(
        'languageSelect'
      ) as HTMLSelectElement | null

      if (!languageSelect) {
        console.error('popup: #languageSelect not found')
        return
      }
    }
  )

  // 電源ボタン：即ON/OFF切り替え
  powerToggle?.addEventListener('click', () => {
    chrome.storage.sync.get({ enabled: true }, (data: { enabled: boolean }) => {
      const next = !data.enabled
      chrome.storage.sync.set({ enabled: next }, () => {
        renderEnabled(next)
        if (status) {
          status.textContent = `Link blocker is now ${next ? 'ON' : 'OFF'}`
          setTimeout(() => {
            status.textContent = ''
          }, 1500)
        }
      })
    })
  })

  // Saveボタン：difficulty と language を保存
  saveButton?.addEventListener('click', () => {
    const selectedDifficulty =
      [...radios].find((r) => r.checked)?.value || 'easy'
    const selectedLanguage = languageSelect?.value || 'en'

    chrome.storage.sync.set(
      { difficulty: selectedDifficulty, language: selectedLanguage },
      () => {
        if (status) {
          status.textContent = `Difficulty: "${selectedDifficulty}", Language: "${selectedLanguage}"`
          setTimeout(() => {
            status.textContent = ''
          }, 1500)
        }
      }
    )
  })
})
