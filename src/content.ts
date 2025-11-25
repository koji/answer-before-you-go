let isExtensionEnabled = true // toggle by storage or something

interface QuizQuestion {
  question: string
  choices: string[]
  correctIndex: number
}

interface QuizData {
  questions: QuizQuestion[]
}

interface GetQuizResponse {
  quiz?: QuizData
  error?: boolean
}

const GUARDED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'tiktok.com',
  'netflix.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
] as const

type GuardedDomain = (typeof GUARDED_DOMAINS)[number]

chrome.storage.sync.get(
  { enabled: true },
  ({ enabled }: { enabled: boolean }) => {
    isExtensionEnabled = enabled
  }
)

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.enabled) {
    const change = changes.enabled
    const newValue = change.newValue as boolean
    isExtensionEnabled = newValue
    console.log(`focus mode ${isExtensionEnabled ? 'on' : 'off'}`)
  }
})

const isGuardedTarget = (href: string): boolean => {
  try {
    const targetUrl = new URL(href, location.href)
    const host = targetUrl.hostname.toLowerCase()

    // including subdomain (www.youtube.com, m.youtube.com etc)
    return GUARDED_DOMAINS.some(
      (domain) => host === domain || host.endsWith('.' + domain)
    )
  } catch (e) {
    return false
  }
}

const createQuizModal = (
  quiz: QuizData,
  onResult: (passed: boolean) => void
) => {
  // quiz: { questions: [ { question, choices, correctIndex } ] }

  const overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.inset = '0'
  overlay.style.background = 'rgba(0,0,0,0.5)'
  overlay.style.zIndex = '999999'

  const modal = document.createElement('div')
  modal.style.position = 'absolute'
  modal.style.top = '50%'
  modal.style.left = '50%'
  modal.style.transform = 'translate(-50%, -50%)'
  modal.style.background = '#fff'
  modal.style.padding = '20px'
  modal.style.borderRadius = '8px'
  modal.style.maxWidth = '600px'
  modal.style.width = '90%'
  modal.style.maxHeight = '80%'
  modal.style.overflowY = 'auto'
  modal.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'

  const title = document.createElement('h2')
  title.textContent = 'Quiz if you answer all correctly, you can move.'
  modal.appendChild(title)

  const form = document.createElement('form')

  quiz.questions.forEach((q, i) => {
    const qWrapper = document.createElement('div')
    qWrapper.style.margin = '16px 0'

    const qTitle = document.createElement('p')
    qTitle.textContent = `Q${i + 1}. ${q.question}`
    qWrapper.appendChild(qTitle)

    q.choices.forEach((choice, idx) => {
      const label = document.createElement('label')
      label.style.display = 'block'
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = `q${i}`
      radio.value = String(idx)
      label.appendChild(radio)
      label.appendChild(document.createTextNode(' ' + choice))
      qWrapper.appendChild(label)
    })

    form.appendChild(qWrapper)
  })

  const buttonWrapper = document.createElement('div')
  buttonWrapper.style.textAlign = 'right'
  buttonWrapper.style.marginTop = '16px'

  const cancelBtn = document.createElement('button')
  cancelBtn.type = 'button'
  cancelBtn.textContent = 'Cancel'

  const submitBtn = document.createElement('button')
  submitBtn.type = 'submit'
  submitBtn.textContent = 'Submit'
  submitBtn.style.marginLeft = '8px'

  buttonWrapper.appendChild(cancelBtn)
  buttonWrapper.appendChild(submitBtn)
  form.appendChild(buttonWrapper)

  modal.appendChild(form)
  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  cancelBtn.onclick = () => {
    document.body.removeChild(overlay)
    onResult(false)
  }

  form.onsubmit = (e) => {
    e.preventDefault()
    // check answer
    let allCorrect = true
    quiz.questions.forEach((q, i) => {
      const selected = form.querySelector<HTMLInputElement>(
        `input[name="q${i}"]:checked`
      )
      if (!selected || Number(selected.value) !== q.correctIndex) {
        allCorrect = false
      }
    })

    if (allCorrect) {
      alert('All correct! You can move.')
      document.body.removeChild(overlay)
      onResult(true)
    } else {
      alert("You have incorrect answers…. You can't move.")
      document.body.removeChild(overlay)
      onResult(false)
    }
  }
}

document.addEventListener(
  'click',
  (event) => {
    if (!isExtensionEnabled) return // disabled / off by user

    if (event.button !== 0) return // left click
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const target = event.target as HTMLElement

    const anchor = target.closest<HTMLAnchorElement>('a[href]')
    if (!anchor) return

    const href = anchor.getAttribute('href')
    if (!href) return

    if (!isGuardedTarget(href)) return

    event.preventDefault()
    event.stopPropagation()

    // load saved setting and request quiz from background
    chrome.storage.sync.get(
      { difficulty: 'medium', language: 'en' },
      ({ difficulty, language }) => {
        chrome.runtime.sendMessage(
          { type: 'GET_QUIZ', difficulty, language },
          (response) => {
            if (!response || !response.quiz) {
              alert("Quiz not found. You can't move.")
              return
            }

            const quiz = response.quiz
            createQuizModal(quiz, (passed) => {
              if (passed) {
                window.location.href = href
              }
            })
          }
        )
      }
    )
  },
  true
)
