let isExtensionEnabled = true // toggle by storage or something

interface QuizQuestion {
  question: string
  choices: string[]
  correctIndex: number
}

interface QuizData {
  questions: QuizQuestion[]
}

type QuizError = 'http' | 'network' | 'timeout' | 'bad_shape'

interface GetQuizResponse {
  quiz?: QuizData
  error?: QuizError
  status?: number
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
  const overlay = document.createElement('div');
  overlay.id = 'quiz-gate-overlay';

  const modal = document.createElement('div');
  modal.id = 'quiz-gate-modal';

  const title = document.createElement('h2');
  title.textContent = "Hold on! Just a quick brain teaser before you go.";
  modal.appendChild(title);

  const form = document.createElement('form');

  quiz.questions.forEach((q, i) => {
    const qWrapper = document.createElement('div');
    qWrapper.className = 'question-wrapper';

    const qTitle = document.createElement('p');
    qTitle.className = 'question-title';
    qTitle.textContent = `Q${i + 1}. ${q.question}`;
    qWrapper.appendChild(qTitle);

    const choicesWrapper = document.createElement('div');
    choicesWrapper.className = 'choices-wrapper';
    q.choices.forEach((choice, idx) => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `q${i}`;
      radio.value = String(idx);

      const choiceText = document.createElement('span');
      choiceText.textContent = choice;

      label.appendChild(radio);
      label.appendChild(choiceText);
      choicesWrapper.appendChild(label);
    });
    qWrapper.appendChild(choicesWrapper);
    form.appendChild(qWrapper);
  });

  const errorStatus = document.createElement('div');
  errorStatus.className = 'error-status';

  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'button-wrapper';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = 'Close';
  closeBtn.className = 'button';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Submit';
  submitBtn.className = 'button button-primary';

  buttonWrapper.appendChild(closeBtn);
  buttonWrapper.appendChild(submitBtn);
  form.appendChild(errorStatus);
  form.appendChild(buttonWrapper);

  modal.appendChild(form);
  overlay.appendChild(modal);

  const style = document.createElement('style');
  style.textContent = `
    #quiz-gate-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #quiz-gate-modal {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 8px;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #343a40;
    }
    #quiz-gate-modal h2 {
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 20px;
      color: #7c5cbf;
    }
    .question-wrapper { margin-bottom: 20px; }
    .question-title { font-weight: bold; margin-bottom: 12px; }
    .choices-wrapper label {
      display: block;
      margin-bottom: 8px;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .choices-wrapper label:hover { background-color: #e9ecef; }
    .choices-wrapper input[type="radio"] { margin-right: 10px; }
    .button-wrapper {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
    }
    .button {
      padding: 10px 20px;
      border: 1px solid #7c5cbf;
      border-radius: 5px;
      background-color: transparent;
      color: #7c5cbf;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s, color 0.3s;
    }
    .button:hover { background-color: #e3d7ff; }
    .button-primary {
      background-color: #7c5cbf;
      color: white;
    }
    .button-primary:hover { background-color: #6a4fa8; }
    .error-status {
      margin-top: 15px;
      color: #dc3545;
      text-align: center;
      min-height: 18px;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  let errorTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

  closeBtn.onclick = () => {
    if (errorTimeoutId) {
      clearTimeout(errorTimeoutId);
    }
    document.head.removeChild(style);
    document.body.removeChild(overlay);
    onResult(false);
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    let allCorrect = true;
    quiz.questions.forEach((q, i) => {
      const selected = form.querySelector<HTMLInputElement>(`input[name="q${i}"]:checked`);
      if (!selected || Number(selected.value) !== q.correctIndex) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      document.head.removeChild(style);
      document.body.removeChild(overlay);
      onResult(true);
    } else {
      errorStatus.textContent = "Oops, try again! Some answers are incorrect.";
      if (errorTimeoutId) {
        clearTimeout(errorTimeoutId);
      }
      errorTimeoutId = setTimeout(() => {
        errorStatus.textContent = ""
      }, 2000);
    }
  }
}

const QUIZ_ERROR_MESSAGES: Record<string, string> = {
  http: 'The quiz server returned an error. It may be temporarily unavailable.',
  timeout:
    'The quiz server took too long to respond. It may be waking up, so please retry.',
  network: 'Could not reach the quiz server. Check your connection and retry.',
  bad_shape: 'The quiz server returned an unexpected response.',
}

const createQuizErrorModal = (
  targetHref: string,
  error: string,
  status: number | undefined,
  onRetry: () => void
) => {
  const overlay = document.createElement('div')
  overlay.id = 'quiz-gate-overlay'

  const modal = document.createElement('div')
  modal.id = 'quiz-gate-modal'

  const title = document.createElement('h2')
  title.textContent = "Couldn't load the quiz"
  modal.appendChild(title)

  const message = document.createElement('p')
  const baseMessage =
    QUIZ_ERROR_MESSAGES[error] ?? QUIZ_ERROR_MESSAGES.network
  message.textContent =
    error === 'http' && status
      ? `${baseMessage} (HTTP ${status})`
      : baseMessage
  modal.appendChild(message)

  const buttonWrapper = document.createElement('div')
  buttonWrapper.className = 'button-wrapper'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.textContent = 'Close'
  closeBtn.className = 'button'

  const proceedBtn = document.createElement('button')
  proceedBtn.type = 'button'
  proceedBtn.textContent = 'Proceed anyway'
  proceedBtn.className = 'button'

  const retryBtn = document.createElement('button')
  retryBtn.type = 'button'
  retryBtn.textContent = 'Retry'
  retryBtn.className = 'button button-primary'

  buttonWrapper.appendChild(closeBtn)
  buttonWrapper.appendChild(proceedBtn)
  buttonWrapper.appendChild(retryBtn)
  modal.appendChild(buttonWrapper)
  overlay.appendChild(modal)

  const style = document.createElement('style')
  style.textContent = `
    #quiz-gate-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #quiz-gate-modal {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 8px;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #343a40;
    }
    #quiz-gate-modal h2 {
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 20px;
      color: #7c5cbf;
    }
    .button-wrapper {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
    }
    .button {
      padding: 10px 20px;
      border: 1px solid #7c5cbf;
      border-radius: 5px;
      background-color: transparent;
      color: #7c5cbf;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s, color 0.3s;
    }
    .button:hover { background-color: #e3d7ff; }
    .button-primary {
      background-color: #7c5cbf;
      color: white;
    }
    .button-primary:hover { background-color: #6a4fa8; }
  `

  document.head.appendChild(style)
  document.body.appendChild(overlay)

  const cleanup = () => {
    style.remove()
    overlay.remove()
  }

  closeBtn.onclick = () => {
    cleanup()
  }

  proceedBtn.onclick = () => {
    cleanup()
    window.location.href = targetHref
  }

  retryBtn.onclick = () => {
    cleanup()
    onRetry()
  }
}

const requestQuiz = (targetHref: string) => {
  // load saved setting and request quiz from background
  chrome.storage.sync.get(
    { difficulty: 'medium', language: 'en' },
    ({ difficulty, language }) => {
      chrome.runtime.sendMessage(
        { type: 'GET_QUIZ', difficulty, language },
        (response: GetQuizResponse | undefined) => {
          if (!response || !response.quiz) {
            const error = response?.error ?? 'network'
            createQuizErrorModal(targetHref, error, response?.status, () =>
              requestQuiz(targetHref)
            )
            return
          }

          createQuizModal(response.quiz, (passed) => {
            if (passed) {
              window.location.href = targetHref
            }
          })
        }
      )
    }
  )
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

    requestQuiz(href)
  },
  true
)
