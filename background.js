const QUIZ_API_BASE = "https://baxin-quiz-api-server.hf.space"; // base endpoint

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_QUIZ") {
    const difficulty = message.difficulty || "medium";
    const language = message.language || "en";
    // const language = "en";

    const url =
      `${QUIZ_API_BASE}/quiz` +
      `?difficulty=${encodeURIComponent(difficulty)}` +
      `&language=${encodeURIComponent(language)}`;

    console.log("Quiz API URL:", url);

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.questions) {
          sendResponse({ quiz: data });
        } else {
          sendResponse({ error: true });
        }
      })
      .catch((err) => {
        console.error("Quiz fetch error", err);
        sendResponse({ error: true });
      });

    return true; // async response
  }
});