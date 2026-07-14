// Reine Render-Funktionen (DOM-Updates) -- siehe PLAN Abschnitt 3.
// Enthaelt KEINE Spiellogik/State-Machine (das lebt in app.js) und KEINE
// fetch()-Aufrufe. Event-Handler werden als Callback-Funktionen uebergeben.
// Plain globale Funktionen (kein ES-Module-Script), damit das Spiel ohne
// Build-Schritt auch auf aelteren Browsern laeuft (siehe PLAN Abschnitt 9,
// offene Frage Browser-Kompatibilitaet).

const DOT_LOADER = '<span class="dot-loader"><span></span><span></span><span></span></span>';

function renderCareProgress(container, { levels, currentLevelIndex, completed }) {
  container.innerHTML = "";
  levels.forEach((level, index) => {
    const step = document.createElement("div");
    step.className = "care-step";
    const isDone = Boolean(completed[level.id]);
    if (isDone) step.classList.add("done");
    else if (index === currentLevelIndex) step.classList.add("current");
    step.textContent = isDone ? "✓" : level.careLetter === "BOSS" ? "★" : level.careLetter;
    step.title = level.title;
    container.appendChild(step);
  });
}

function renderLoading(container) {
  container.innerHTML = `<div class="loading">${DOT_LOADER}<span>Level werden geladen</span></div>`;
}

function renderFinished(container) {
  container.innerHTML = `
    <div class="level-card finished-card">
      <h2 class="level-title">Geschafft! 🎉</h2>
      <p class="level-intro">Du hast alle 5 Level gemeistert und dabei das CARE-Framework in Aktion erlebt.</p>
    </div>
  `;
}

/**
 * Rendert die aktuelle Level-Karte inkl. Eingabefeld, Alex-Antwort,
 * Feedback/Hint und Fehleranzeige.
 *
 * viewState: { attemptNo, loading, alexResponse, pass, hint, error, retryable, draft }
 * handlers: { onSubmit(promptText), onRetry() }
 */
function renderLevelCard(container, level, viewState, handlers) {
  const { loading, alexResponse, pass, hint, error, retryable, draft } = viewState;

  container.innerHTML = `
    <div class="level-card">
      <h2 class="level-title">${escapeHtml(level.title)}</h2>
      <p class="level-intro">${escapeHtml(level.introText)}</p>
      <p class="level-goal">${escapeHtml(level.goalText)}</p>

      <textarea
        id="prompt-input"
        class="prompt-input"
        placeholder="Schreib deinen Prompt an Alex ..."
        ${loading ? "disabled" : ""}
      ></textarea>

      <div class="actions">
        <button id="submit-btn" class="btn-primary" ${loading ? "disabled" : ""}>
          ${loading ? `${DOT_LOADER}<span>Alex antwortet</span>` : "An Alex senden"}
        </button>
      </div>

      <div id="result-area"></div>
    </div>
  `;

  const textarea = container.querySelector("#prompt-input");
  if (draft) textarea.value = draft;

  container.querySelector("#submit-btn").addEventListener("click", () => {
    handlers.onSubmit(textarea.value);
  });

  const resultArea = container.querySelector("#result-area");

  if (error) {
    resultArea.innerHTML = `
      <div class="error-box">
        <p>${escapeHtml(error)}</p>
        ${retryable ? '<button id="retry-btn" class="btn-secondary">Nochmal versuchen</button>' : ""}
      </div>
    `;
    const retryBtn = resultArea.querySelector("#retry-btn");
    if (retryBtn) retryBtn.addEventListener("click", handlers.onRetry);
    return;
  }

  if (alexResponse !== null && alexResponse !== undefined) {
    const feedbackClass = pass ? "pass" : "fail";
    const feedbackText = pass
      ? "Treffer! Alex hat geliefert, was gebraucht wurde."
      : "Noch nicht ganz. Schau dir Alex' Antwort an und probier's nochmal.";

    resultArea.innerHTML = `
      <div class="alex-response">
        <div class="alex-response-label">Alex antwortet</div>
        <div class="alex-response-text">${escapeHtml(alexResponse)}</div>
      </div>
      <div class="feedback ${feedbackClass}">
        ${escapeHtml(feedbackText)}
        ${hint ? `<div class="hint">💡 ${escapeHtml(hint)}</div>` : ""}
      </div>
      ${
        pass
          ? '<div class="actions"><button id="next-btn" class="btn-primary">Weiter →</button></div>'
          : ""
      }
    `;

    const nextBtn = resultArea.querySelector("#next-btn");
    if (nextBtn) nextBtn.addEventListener("click", handlers.onNext);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
