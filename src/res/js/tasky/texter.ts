export function startTexter(phrases: string[]) {
  let currentPhraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingDelay = 100;
  let deletingDelay = 50;
  let pauseDelay = 2000;

  function texter() {
    const typingText = document.getElementById("typing-text");
    if (!typingText) return;

    const currentPhrase = phrases[currentPhraseIndex];

    if (isDeleting) {
      typingText.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        setTimeout(texter, pauseDelay);
        return;
      }

      setTimeout(texter, deletingDelay);
    } else {
      typingText.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;

      if (charIndex === currentPhrase.length) {
        isDeleting = true;
        setTimeout(texter, pauseDelay);
        return;
      }

      setTimeout(texter, typingDelay);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(texter, 1000);
  });
}
