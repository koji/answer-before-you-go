const QUIZ_API_BASE = 'https://baxin-quiz-api-server.hf.space' // base endpoint

interface GetQuizMessage {
  type: 'GET_QUIZ'
  difficulty?: string
  language?: string
}

interface QuizResponse {
  quiz?: unknown
  error?: boolean
}

const DEFAULT_DIFFICULTY = 'medium'
const DEFAULT_LANGUAGE = 'en'

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
      try {
        const difficulty = message.difficulty ?? DEFAULT_DIFFICULTY
        const language = message.language ?? DEFAULT_LANGUAGE
        const url = `${QUIZ_API_BASE}/quiz?difficulty=${encodeURIComponent(
          difficulty
        )}&language=${encodeURIComponent(language)}`
        // console.log('Quiz API URL:', url)

        const res = await fetch(url)
        const data = await res.json()

        if (data && 'questions' in data) {
          sendResponse({ quiz: data })
        } else {
          sendResponse({ error: true })
        }
      } catch (error) {
        console.error('Quiz fetch error', error)
        sendResponse({ error: true })
      }
    })()

    return true // async response
  }
)
