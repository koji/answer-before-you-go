document.addEventListener("DOMContentLoaded", () => {
  const radios = document.querySelectorAll('input[name="difficulty"]');
  const saveButton = document.getElementById("save");
  const status = document.getElementById("status");

  const powerToggle = document.getElementById("powerToggle");
  const powerText = document.getElementById("powerText");
  const languageSelect = document.getElementById("languageSelect");

  function renderEnabled(enabled) {
    powerToggle.classList.toggle("on", enabled);
    powerToggle.classList.toggle("off", !enabled);
    powerToggle.setAttribute("aria-pressed", String(enabled));
    powerText.textContent = enabled ? "ON" : "OFF";
  }

  // 現在の設定を読み込み（language のデフォルトを "en" にしておく）
  chrome.storage.sync.get(
    { difficulty: "medium", enabled: true, language: "en" },
    (data) => {
      // 難易度
      const currentDifficulty = data.difficulty;
      const target = document.querySelector(
        `input[name="difficulty"][value="${currentDifficulty}"]`
      );
      if (target) target.checked = true;

      // ON/OFF
      renderEnabled(data.enabled);

      // 言語
      languageSelect.value = data.language || "en";
    }
  );

  // 電源ボタン：即ON/OFF切り替え
  powerToggle.addEventListener("click", () => {
    chrome.storage.sync.get({ enabled: true }, (data) => {
      const next = !data.enabled;
      chrome.storage.sync.set({ enabled: next }, () => {
        renderEnabled(next);
        status.textContent = `Link blocker is now ${next ? "ON" : "OFF"}`;
        setTimeout(() => {
          status.textContent = "";
        }, 1500);
      });
    });
  });

  // Saveボタン：difficulty と language を保存
  saveButton.addEventListener("click", () => {
    const selectedDifficulty =
      [...radios].find((r) => r.checked)?.value || "medium";
    const selectedLanguage = languageSelect.value || "en";

    chrome.storage.sync.set(
      { difficulty: selectedDifficulty, language: selectedLanguage },
      () => {
        status.textContent = `Difficulty: "${selectedDifficulty}", Language: "${selectedLanguage}"`;
        setTimeout(() => {
          status.textContent = "";
        }, 1500);
      }
    );
  });
});
