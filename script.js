const difficultyEl = document.getElementById("difficulty");
const timerEl = document.getElementById("timer");
const bestEl = document.getElementById("best");
const attemptsEl = document.getElementById("attempts");
const statusEl = document.getElementById("status");
const guessEl = document.getElementById("guess");
const submitBtn = document.getElementById("submit");
const restartBtn = document.getElementById("restart");
const historyList = document.getElementById("historyList");
const emptyEl = document.getElementById("empty");
const gamePanel = document.getElementById("gamePanel");

let max = Number(difficultyEl.value);
let answer = 0;
let attempts = 0;
let guesses = [];
let timerId = null;
let startTime = 0;
let isPlaying = true;

function getBestKey() {
  return `number-game-best-${max}`;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateBestDisplay() {
  const bestMs = Number(localStorage.getItem(getBestKey()));
  if (Number.isFinite(bestMs) && bestMs > 0) {
    bestEl.textContent = formatTime(bestMs);
    return;
  }
  bestEl.textContent = "--";
}

function startTimer() {
  stopTimer();
  startTime = Date.now();
  timerId = setInterval(() => {
    timerEl.textContent = formatTime(Date.now() - startTime);
  }, 250);
}

function stopTimer() {
  if (!timerId) {
    return;
  }
  clearInterval(timerId);
  timerId = null;
}

function resetTimer() {
  timerEl.textContent = "00:00";
}

function setStatus(text, variant = "default") {
  statusEl.textContent = text;
  statusEl.classList.toggle("success", variant === "success");
}

function setAnswer() {
  answer = Math.floor(Math.random() * max) + 1;
}

function renderHistory() {
  historyList.innerHTML = "";
  if (guesses.length === 0) {
    emptyEl.style.display = "block";
    return;
  }
  emptyEl.style.display = "none";
  guesses.forEach((guess) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const meta = document.createElement("div");
    meta.className = "history-meta";

    const count = document.createElement("span");
    count.textContent = `#${guess.attempt}`;

    const value = document.createElement("span");
    value.className = "history-value";
    value.textContent = String(guess.value);

    const hint = document.createElement("span");
    hint.textContent = guess.message;

    meta.append(count, value, hint);

    const bar = document.createElement("div");
    bar.className = "history-bar";

    const fill = document.createElement("span");
    fill.className = `history-fill ${guess.result}`;
    fill.style.width = `${Math.max(4, Math.round((guess.value / max) * 100))}%`;

    bar.appendChild(fill);
    item.append(meta, bar);
    historyList.appendChild(item);
  });
}

function resetGame() {
  attempts = 0;
  guesses = [];
  isPlaying = true;
  attemptsEl.textContent = "0";
  setAnswer();
  setStatus(`1~${max} 사이의 숫자를 맞춰보세요.`);
  guessEl.value = "";
  guessEl.disabled = false;
  submitBtn.disabled = false;
  gamePanel.classList.remove("app-win");
  resetTimer();
  startTimer();
  updateBestDisplay();
  renderHistory();
  guessEl.focus();
}

function finishGame(elapsedMs) {
  isPlaying = false;
  stopTimer();
  guessEl.disabled = true;
  submitBtn.disabled = true;
  gamePanel.classList.add("app-win");
  setStatus(`정답입니다! 시도 횟수: ${attempts}`, "success");

  const key = getBestKey();
  const bestMs = Number(localStorage.getItem(key));
  if (!Number.isFinite(bestMs) || bestMs === 0 || elapsedMs < bestMs) {
    localStorage.setItem(key, String(elapsedMs));
    updateBestDisplay();
  }
}

function handleGuess() {
  if (!isPlaying) {
    return;
  }

  const raw = guessEl.value.trim();
  const num = Number(raw);

  if (!raw || !Number.isInteger(num)) {
    setStatus("숫자를 입력해주세요.");
    return;
  }
  if (num < 1 || num > max) {
    setStatus(`1~${max} 사이의 숫자를 입력해주세요.`);
    return;
  }

  attempts += 1;
  attemptsEl.textContent = String(attempts);

  let result = "low";
  let message = "더 큰 수";

  if (num > answer) {
    result = "high";
    message = "더 작은 수";
  }
  if (num === answer) {
    result = "correct";
    message = "정답!";
  }

  guesses = [
    {
      attempt: attempts,
      value: num,
      result,
      message,
    },
    ...guesses,
  ];

  renderHistory();
  guessEl.value = "";
  guessEl.focus();

  if (num === answer) {
    const elapsedMs = Date.now() - startTime;
    finishGame(elapsedMs);
    return;
  }

  setStatus(message);
}

difficultyEl.addEventListener("change", () => {
  max = Number(difficultyEl.value);
  resetGame();
});

submitBtn.addEventListener("click", handleGuess);

guessEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleGuess();
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

resetGame();
