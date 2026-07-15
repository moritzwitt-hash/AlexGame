// Game-State-Machine, Level-Navigation, localStorage, fetch-Calls.
// Siehe PLAN Abschnitt 1/3/7 (Phase 1-4). Kennt NUR public Level-Felder --
// Rubrik/Persona-Fallen bleiben serverseitig (lib/levels.config.js).
//
// Wachsender Prompt (siehe PLAN-Changelog "Ein Prompt statt vier Teile"):
// Level 1-4 sind "cumulative" -- der Spieler tippt pro Level nur den NEUEN
// Teil, vorherige Teile werden nur noch angezeigt. Beim Absenden wird der
// volle Prompt (bisherige Teile + neuer Teil) an /api/attempt geschickt --
// das Backend sieht nur einen längeren playerPrompt-String, es ändert
// sich dort nichts. Nach dem letzten cumulative Level gibt es einen kurzen
// Recap-Screen, der den fertigen Prompt zeigt, bevor es zum Boss-Level geht.

const STORAGE_KEY = "care_game_state_v2";
const REQUEST_TIMEOUT_MS = 25_000; // etwas großzügiger als das Backend-Timeout (20s)

const mainEl = document.getElementById("app");
const progressEl = document.getElementById("care-progress");
const resetBtn = document.getElementById("reset-btn");

/**
 * @type {{levels: any[], currentLevelIndex: number, completed: Record<string, boolean>,
 *         attempts: Record<string, number>, promptSegments: Record<string, string>,
 *         recapPrompt: string|null, hasStarted: boolean}}
 */
let state = {
  levels: [],
  currentLevelIndex: 0,
  completed: {},
  attempts: {},
  promptSegments: {},
  recapPrompt: null,
  hasStarted: false,
};

/** @type {{loading: boolean, alexResponse: string|null, pass: boolean|null, hint: string|null, error: string|null, retryable: boolean, draft: string, revealed: boolean}} */
let viewState = resetViewState();

function resetViewState() {
  return {
    loading: false,
    alexResponse: null,
    pass: null,
    hint: null,
    error: null,
    retryable: false,
    draft: "",
    revealed: false,
  };
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      completed: parsed.completed ?? {},
      attempts: parsed.attempts ?? {},
      promptSegments: parsed.promptSegments ?? {},
      hasStarted: parsed.hasStarted ?? false,
    };
  } catch {
    return null;
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      completed: state.completed,
      attempts: state.attempts,
      promptSegments: state.promptSegments,
      hasStarted: state.hasStarted,
    })
  );
}

function computeCurrentLevelIndex() {
  const firstOpenIndex = state.levels.findIndex((level) => !state.completed[level.id]);
  return firstOpenIndex === -1 ? state.levels.length : firstOpenIndex;
}

/** Bereits bestätigte Prompt-Teile früherer cumulative Level, in Reihenfolge. */
function getPriorSegments(level) {
  if (!level.cumulative) return [];
  return state.levels
    .filter((l) => l.cumulative && l.order < level.order)
    .map((l) => state.promptSegments[l.id])
    .filter(Boolean);
}

function isLastCumulativeLevel(level) {
  return level.cumulative && !state.levels.some((l) => l.cumulative && l.order > level.order);
}

function render() {
  renderCareProgress(progressEl, {
    levels: state.levels,
    currentLevelIndex: state.currentLevelIndex,
    completed: state.completed,
  });

  document.body.classList.toggle("layout-solo", !state.hasStarted);

  if (!state.hasStarted) {
    syncCareGlossary(null);
    renderWelcomeScreen(mainEl, handleStartGame);
    return;
  }

  if (state.recapPrompt) {
    syncCareGlossary("ALL");
    renderPromptRecap(mainEl, state.recapPrompt, handleRecapContinue);
    return;
  }

  if (state.currentLevelIndex >= state.levels.length) {
    syncCareGlossary("ALL");
    renderFinished(mainEl);
    return;
  }

  const level = state.levels[state.currentLevelIndex];
  syncCareGlossary(level.careLetter === "BOSS" ? "ALL" : level.careLetter);
  renderLevelCard(
    mainEl,
    level,
    { ...viewState, priorSegments: getPriorSegments(level) },
    { onSubmit: handleSubmit, onRetry: handleRetry, onNext: handleNext, onReveal: handleReveal }
  );
}

function handleStartGame() {
  state.hasStarted = true;
  persist();
  render();
}

function handleReveal() {
  viewState.revealed = true;
  render();
}

function handleReset() {
  const confirmed = window.confirm(
    "Fortschritt wirklich zurücksetzen? Du springst zurück zu Level 1, der gesamte Fortschritt geht dabei verloren."
  );
  if (!confirmed) return;

  state.completed = {};
  state.attempts = {};
  state.promptSegments = {};
  state.recapPrompt = null;
  state.currentLevelIndex = 0;
  viewState = resetViewState();
  persist();
  render();
}

let lastNewSegment = "";

async function handleSubmit(promptText) {
  const trimmed = promptText.trim();
  if (!trimmed) return;

  const level = state.levels[state.currentLevelIndex];
  lastNewSegment = trimmed;
  viewState.draft = promptText;
  viewState.loading = true;
  viewState.error = null;
  render();

  const priorSegments = getPriorSegments(level);
  const fullPrompt = priorSegments.length ? [...priorSegments, trimmed].join(" ") : trimmed;

  await sendAttempt(level, fullPrompt, trimmed);
}

async function handleRetry() {
  const level = state.levels[state.currentLevelIndex];
  viewState.loading = true;
  viewState.error = null;
  render();

  const priorSegments = getPriorSegments(level);
  const fullPrompt = priorSegments.length
    ? [...priorSegments, lastNewSegment].join(" ")
    : lastNewSegment;

  await sendAttempt(level, fullPrompt, lastNewSegment);
}

function handleNext() {
  const finishedLevel = state.levels[state.currentLevelIndex];
  viewState = resetViewState();

  if (isLastCumulativeLevel(finishedLevel)) {
    const allSegments = getPriorSegments(finishedLevel).concat(
      state.promptSegments[finishedLevel.id] ?? ""
    );
    state.recapPrompt = allSegments.filter(Boolean).join(" ");
    render();
    return;
  }

  state.currentLevelIndex = computeCurrentLevelIndex();
  render();
}

function handleRecapContinue() {
  state.recapPrompt = null;
  state.currentLevelIndex = computeCurrentLevelIndex();
  render();
}

async function sendAttempt(level, fullPrompt, newSegment) {
  const attemptNo = (state.attempts[level.id] ?? 0) + 1;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch("/api/attempt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ levelId: level.id, playerPrompt: fullPrompt, attemptNo }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      viewState.loading = false;
      viewState.error =
        (data && data.error) || "Da ist etwas schiefgelaufen. Bitte versuche es noch einmal.";
      viewState.retryable = (data && data.retryable) ?? true;
      render();
      return;
    }

    state.attempts[level.id] = attemptNo;
    if (data.pass) {
      state.completed[level.id] = true;
      if (level.cumulative) {
        state.promptSegments[level.id] = newSegment;
      }
    }
    persist();

    viewState.loading = false;
    viewState.alexResponse = data.alexResponse;
    viewState.pass = data.pass;
    viewState.hint = data.hint;
    viewState.error = null;
    render();
  } catch (err) {
    viewState.loading = false;
    viewState.error =
      err.name === "AbortError"
        ? "Die Anfrage hat zu lange gedauert. Bitte versuche es noch einmal."
        : "Verbindung zum Server fehlgeschlagen. Bitte versuche es noch einmal.";
    viewState.retryable = true;
    render();
  } finally {
    clearTimeout(timer);
  }
}

async function init() {
  renderLoading(mainEl);

  const persisted = loadPersisted();
  if (persisted) {
    state.completed = persisted.completed;
    state.attempts = persisted.attempts;
    state.promptSegments = persisted.promptSegments;
    state.hasStarted = persisted.hasStarted;
  }

  resetBtn.addEventListener("click", handleReset);

  try {
    const res = await fetch("/api/levels");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.levels = await res.json();
  } catch (err) {
    mainEl.innerHTML = `<div class="error-box"><p>Level konnten nicht geladen werden. Bitte Seite neu laden.</p></div>`;
    return;
  }

  state.currentLevelIndex = computeCurrentLevelIndex();
  render();
}

init();
