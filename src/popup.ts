document.addEventListener('DOMContentLoaded', () => {
  const powerToggle = document.getElementById('powerToggle') as HTMLInputElement | null;
  const difficultyButtons = document.querySelectorAll<HTMLButtonElement>('.difficulty-options .button');
  const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement | null;
  const statusDiv = document.getElementById('status') as HTMLDivElement | null;

  let statusTimeout: number;

  function showStatus(message: string, duration: number = 1500) {
    if (!statusDiv) return;
    clearTimeout(statusTimeout);
    statusDiv.textContent = message;
    statusTimeout = window.setTimeout(() => {
      statusDiv.textContent = '';
    }, duration);
  }

  function saveOption(key: string, value: string | boolean, message: string) {
    chrome.storage.sync.set({ [key]: value }, () => {
      showStatus(message);
    });
  }

  function updateDifficultyUI(selectedDifficulty: string) {
    difficultyButtons.forEach(button => {
      button.classList.toggle('selected', button.dataset.difficulty === selectedDifficulty);
    });
  }

  // Load initial settings from storage
  chrome.storage.sync.get({ difficulty: 'medium', enabled: true, language: 'en' }, (data) => {
    if (powerToggle) {
      powerToggle.checked = data.enabled;
    }
    if (languageSelect) {
      languageSelect.value = data.language;
    }
    updateDifficultyUI(data.difficulty);
  });

  // Event listener for the power toggle
  powerToggle?.addEventListener('change', (e) => {
    const isEnabled = (e.target as HTMLInputElement).checked;
    saveOption('enabled', isEnabled, `Link blocker is now ${isEnabled ? 'ON' : 'OFF'}`);
  });

  // Event listeners for difficulty buttons
  difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedDifficulty = button.dataset.difficulty;
      if (selectedDifficulty) {
        updateDifficultyUI(selectedDifficulty);
        saveOption('difficulty', selectedDifficulty, `Difficulty set to "${selectedDifficulty}"`);
      }
    });
  });

  // Event listener for the language select dropdown
  languageSelect?.addEventListener('change', () => {
    const selectedLanguage = languageSelect.value;
    saveOption('language', selectedLanguage, `Language set to "${selectedLanguage}"`);
  });
});
