// Game-State-Machine, Level-Navigation, localStorage, fetch-Calls.
// Siehe PLAN Abschnitt 1/3/7 (Phase 1-4). Kennt NUR public Level-Felder --
// Rubrik/Persona-Fallen bleiben serverseitig (lib/levels.config.js).

const STORAGE_KEY = "care_game_state_v1";
const REQUEST_TIMEOUT_MS = 25_000; // etwas grosszuegiger als das Backend-Timeout (20s)

const mainEl = document.getElementById("app");
const progressEl = document.getElementById("care-progress");

/** @type {{levels: any[], currentLevelIndex: number, completed: Record<string, boolean>, attempts: Record<string, number>}} */
let state = {
  levels: [],
  currentLevelIndex: 0,
  completed: {},
  attempts: {},
};

/** @type {{loading: boolean, alexResponse: string|null, pass: boolean|null, hint: string|null, error: string|null, retryable: boolean, draft: string}} */
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
    };
  } catch {
    return null;
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ completed: state.completed, attempts: state.attempts })
  );
}

function computeCurrentLevelIndex() {
  const firstOpenIndex = state.levels.findIndex((level) => !state.completed[level.id]);
  return firstOpenIndex === -1 ? state.levels.length : firstOpenIndex;
}

function render() {
  renderCareProgress(progressEl, {
    levels: state.levels,
    currentLevelIndex: state.currentLevelIndex,
    completed: state.completed,
  });

  if (state.currentLevelIndex >= state.levels.length) {
    renderFinished(mainEl);
    return;
  }

  const level = state.levels[state.currentLevelIndex];
  renderLevelCard(mainEl, level, viewState, {
    onSubmit: handleSubmit,
    onRetry: handleRetry,
    onNext: handleNext,
  });
}

let lastPromptSent = "";

async function handleSubmit(promptText) {
  const trimmed = promptText.trim();
  if (!trimmed) return;

  const level = state.levels[state.currentLevelIndex];
  lastPromptSent = trimmed;
  viewState.draft = promptText;
  viewState.loading = true;
  viewState.error = null;
  render();

  await sendAttempt(level, trimmed);
}

async function handleRetry() {
  const level = state.levels[state.currentLevelIndex];
  viewState.loading = true;
  viewState.error = null;
  render();
  await sendAttempt(level, lastPromptSent);
}

function handleNext() {
  viewState = resetViewState();
  state.currentLevelIndex = computeCurrentLevelIndex();
  render();
}

async function sendAttempt(level, promptText) {
  const attemptNo = (state.attempts[level.id] ?? 0) + 1;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch("/api/attempt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ levelId: level.id, playerPrompt: promptText, attemptNo }),
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
    if (data.pass) state.completed[level.id] = true;
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
  }

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
