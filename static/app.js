const API_BASE = "http://localhost:8000";

const languageSelect = document.getElementById("language");
const inputText = document.getElementById("inputText");
const translateBtn = document.getElementById("translateBtn");
const micBtn = document.getElementById("micBtn");
const resultText = document.getElementById("resultText");
const resultSequence = document.getElementById("resultSequence");
const warningBox = document.getElementById("warningBox");
const speechStatus = document.getElementById("speechStatus");
const avatar = document.getElementById("avatar");

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const replayBtn = document.getElementById("replayBtn");
const stopBtn = document.getElementById("stopBtn");

let currentSequence = [];
let playingTimer = null;
let currentlyPlaying = false;

function setStatus(message) {
  speechStatus.textContent = message;
}

function showWarning(message) {
  warningBox.textContent = message;
  warningBox.classList.add("visible");
}

function hideWarning() {
  warningBox.classList.remove("visible");
  warningBox.textContent = "";
}

async function translateText() {
  const text = inputText.value.trim();
  const language = languageSelect.value;

  if (!text) {
    resultText.textContent = "Please type a sentence first.";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Translation failed.");
    }

    resultText.textContent = `${data.text} (${data.language})`;
    currentSequence = data.sequence || [];

    if (data.sequence && data.sequence.length) {
      resultSequence.textContent = data.sequence.join(" • ");
    } else {
      resultSequence.textContent = "No sequence returned.";
    }

    if (data.message) {
      if (data.missing_words && data.missing_words.length) {
        showWarning(
          `${data.message} Missing words: ${data.missing_words.join(", ")}`
        );
      } else {
        hideWarning();
      }
    }

    stopPlayback();
  } catch (error) {
    resultText.textContent = "Translation error.";
    resultSequence.textContent = "";
    showWarning(error.message || "Unexpected error.");
  }
}

function stopPlayback() {
  currentlyPlaying = false;
  avatar.classList.remove("playing");
  if (playingTimer) {
    clearInterval(playingTimer);
    playingTimer = null;
  }
}

function playSequence() {
  if (!currentSequence.length) {
    showWarning("No sign sequence to play yet.");
    return;
  }

  stopPlayback();
  currentlyPlaying = true;
  avatar.classList.add("playing");

  let index = 0;

  playingTimer = setInterval(() => {
    if (!currentlyPlaying) return;

    const token = currentSequence[index];
    if (!token) {
      stopPlayback();
      return;
    }

    resultSequence.textContent = currentSequence.slice(index).join(" • ");
    index += 1;
  }, 900);
}

function pausePlayback() {
  if (!currentlyPlaying) return;
  currentlyPlaying = false;
  avatar.classList.remove("playing");
  if (playingTimer) {
    clearInterval(playingTimer);
    playingTimer = null;
  }
}

function replaySequence() {
  if (!currentSequence.length) return;
  stopPlayback();
  playSequence();
}

translateBtn.addEventListener("click", translateText);
playBtn.addEventListener("click", playSequence);
pauseBtn.addEventListener("click", pausePlayback);
replayBtn.addEventListener("click", replaySequence);
stopBtn.addEventListener("click", () => {
  stopPlayback();
  resultSequence.textContent = currentSequence.join(" • ");
});

function setupSpeechRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setStatus("Speech recognition unavailable in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setStatus("Listening... speak now.");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputText.value = transcript;
    setStatus(`Recognized speech: ${transcript}`);
  };

  recognition.onerror = (event) => {
    setStatus(`Speech error: ${event.error}`);
  };

  recognition.onend = () => {
    setStatus("Microphone ready.");
  };

  return recognition;
}

const recognition = setupSpeechRecognition();

micBtn.addEventListener("click", async () => {
  if (!recognition) {
    showWarning("Speech recognition is not supported in this browser.");
    return;
  }

  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    recognition.start();
  } catch (error) {
    showWarning("Microphone access was denied or unavailable.");
    setStatus("Microphone permission denied.");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  inputText.value = "Hello friend";
  resultText.textContent = "Waiting for input...";
  resultSequence.textContent = "No sequence yet.";
  hideWarning();
});
