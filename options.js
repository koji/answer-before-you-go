document.addEventListener("DOMContentLoaded", () => {
  const radios = document.querySelectorAll('input[name="difficulty"]');
  const saveButton = document.getElementById("save");

  // load saved setting
  chrome.storage.sync.get(["difficulty"], (data) => {
    if (data.difficulty) {
      const target = document.querySelector(
        `input[name="difficulty"][value="${data.difficulty}"]`
      );
      if (target) target.checked = true;
    } else {
      // default
      document.querySelector('input[name="difficulty"][value="medium"]').checked =
        true;
    }
  });

  saveButton.addEventListener("click", () => {
    const selected = [...radios].find((r) => r.checked)?.value;
    if (!selected) return;

    chrome.storage.sync.set({ difficulty: selected }, () => {
      alert(`Difficulty「${selected}」saved.`);
    });
  });
});
