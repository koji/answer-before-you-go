![logo](https://github.com/koji/answer-before-you-go/blob/edge/public/icon-128.png)

# Answer Before You Go 
## Overview

A Chrome extension that blocks navigation to “guarded” sites (YouTube, TikTok, Netflix, X, etc.) until the user passes a short quiz. A content script intercepts left-clicks on those domains, requests quiz data from the background service worker, shows the quiz modal, and only releases the navigation when all answers are correct.

## Features

- Guarded domain detection for major social/video platforms (@src/content.ts#18-210).
- Quiz fetching via the background worker from `https://baxin-quiz-api-server.hf.space` with default difficulty `medium` and language `en` (@src/background.ts#1-50).
- Popup UI to toggle the blocker, choose quiz difficulty, and select quiz language; values are persisted in `chrome.storage.sync` (@public/popup.html#119-158, @src/popup.ts#1-87).
- Options page for managing default difficulty outside the popup (@src/options.ts#1-27).

## Prerequisites

- Bun v1.3+ (@README.md#5-13)

## Install & Build

```bash
bun install
bun run build      # production bundle into dist/
bun run build:dev  # dev build
bun run release    # build + zip (uses bun run zip)
```

## screenshots
<img width="299" height="293" alt="2025-11-26 19_15_56-answer-before-you-go - Antigravity -  gitignore" src="https://github.com/user-attachments/assets/6ba12099-319e-42b4-8557-9b39fd1562c1" />
<br/>
<img width="517" height="660" alt="2025-11-26 19_17_24-answer-before-you-go - Antigravity -  gitignore" src="https://github.com/user-attachments/assets/b8689dcb-6140-47c7-8bfb-5df2ffc789de" />

## demo
https://github.com/user-attachments/assets/c9cc538b-17a0-46ed-8096-6b40f31d5e41

