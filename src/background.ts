const QUIZ_API_BASE = 'https://baxin-quiz-api-server.hf.space' // base endpoint

const QUIZ_FETCH_TIMEOUT_MS = 15000

interface GetQuizMessage {
  type: 'GET_QUIZ'
  difficulty?: string
  language?: string
}

interface QuizQuestion {
  question: string
  choices: string[]
  correctIndex: number
}

interface QuizData {
  questions: QuizQuestion[]
}

type QuizFetchError = 'http' | 'network' | 'timeout' | 'bad_shape'

interface QuizResponse {
  quiz?: QuizData
  error?: QuizFetchError
  status?: number
}

const DEFAULT_DIFFICULTY = 'medium'
const DEFAULT_LANGUAGE = 'en'

const isValidQuiz = (data: unknown): data is QuizData => {
  if (typeof data !== 'object' || data === null) return false
  const questions = (data as { questions?: unknown }).questions
  if (!Array.isArray(questions) || questions.length === 0) return false
  return questions.every((q) => {
    if (typeof q !== 'object' || q === null) return false
    const question = q as Partial<QuizQuestion>
    return (
      typeof question.question === 'string' &&
      Array.isArray(question.choices) &&
      question.choices.length >= 2 &&
      question.choices.every((c) => typeof c === 'string') &&
      typeof question.correctIndex === 'number' &&
      Number.isInteger(question.correctIndex) &&
      question.correctIndex >= 0 &&
      question.correctIndex < question.choices.length
    )
  })
}

chrome.runtime.onMessage.addListener(
  (
    message: GetQuizMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: QuizResponse) => void
  ) => {
    if (message.type !== 'GET_QUIZ') {
      return false
    }

    ;(async () => {
      const difficulty = message.difficulty ?? DEFAULT_DIFFICULTY
      const language = message.language ?? DEFAULT_LANGUAGE
      const url = `${QUIZ_API_BASE}/quiz?difficulty=${encodeURIComponent(
        difficulty
      )}&language=${encodeURIComponent(language)}`

      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        QUIZ_FETCH_TIMEOUT_MS
      )
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) {
          sendResponse({ error: 'http', status: res.status })
          return
        }
        const data: unknown = await res.json().catch(() => null)
        if (isValidQuiz(data)) {
          sendResponse({ quiz: data })
        } else {
          sendResponse({ error: 'bad_shape' })
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          sendResponse({ error: 'timeout' })
        } else {
          console.error('Quiz fetch error', error)
          sendResponse({ error: 'network' })
        }
      } finally {
        clearTimeout(timeoutId)
      }
    })()

    return true // async response
  }
)
