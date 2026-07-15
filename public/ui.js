// Reine Render-Funktionen (DOM-Updates) -- siehe PLAN Abschnitt 3.
// Enthält KEINE Spiellogik/State-Machine (das lebt in app.js) und KEINE
// fetch()-Aufrufe. Event-Handler werden als Callback-Funktionen übergeben.
// Plain globale Funktionen (kein ES-Module-Script), damit das Spiel ohne
// Build-Schritt auch auf älteren Browsern läuft (siehe PLAN Abschnitt 9,
// offene Frage Browser-Kompatibilität).

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

/** Erster Screen vor Level 1: erklärt Alex und den Ablauf, bevor es losgeht. */
function renderWelcomeScreen(container, onStart) {
  container.innerHTML = `
    <div class="level-card welcome-card">
      <h2 class="level-title">Wer ist Alex?</h2>
      <p class="level-intro">Alex ist der neue Werkstudent. Hochbegabt, aber komplett neu im Unternehmen. Er denkt scharf nach, sobald er eine Aufgabe verstanden hat, nimmt aber alles beim Wort.</p>
      <p class="level-intro">Sagst du ihm nicht genau, was du willst, füllt er die Lücken auf seine Art. Meistens nicht so, wie du es meinst.</p>
      <div class="sidebar-divider"></div>
      <h3 class="sidebar-subtitle">So läuft's</h3>
      <ol class="sidebar-steps">
        <li>Du schreibst Alex eine Anweisung.</li>
        <li>Er antwortet sofort, genau wie du es formulierst.</li>
        <li>Passt es noch nicht, bekommst du einen Tipp und probierst es nochmal.</li>
      </ol>
      <div class="actions">
        <button id="start-btn" class="btn-primary">Spiel starten</button>
      </div>
    </div>
  `;

  container.querySelector("#start-btn").addEventListener("click", onStart);
}

/** Hebt in der rechten CARE-Sidebar den Buchstaben hervor, der zum aktuellen Level passt. */
function syncCareGlossary(careLetter) {
  document.querySelectorAll(".care-badge[data-letter]").forEach((badge) => {
    const isActive = careLetter === "ALL" || badge.dataset.letter === careLetter;
    badge.classList.toggle("current", Boolean(careLetter) && isActive);
  });
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
 * viewState: { attemptNo, loading, alexResponse, pass, hint, error, retryable, draft, priorSegments }
 * handlers: { onSubmit(promptText), onRetry() }
 */
function renderLevelCard(container, level, viewState, handlers) {
  const { loading, alexResponse, pass, hint, error, retryable, draft, priorSegments, revealed } = viewState;

  const hasPrior = Array.isArray(priorSegments) && priorSegments.length > 0;
  const priorBlock = hasPrior
    ? `
      <div class="prompt-so-far">
        <div class="prompt-so-far-label">Dein Prompt bisher</div>
        <div class="prompt-so-far-text">${escapeHtml(priorSegments.join(" "))}</div>
      </div>
    `
    : "";
  const sourceMaterialBlock = level.sourceMaterial
    ? `
      <div class="prompt-so-far">
        <div class="prompt-so-far-label">Rohe Meeting-Notizen</div>
        <div class="prompt-so-far-text">${escapeHtml(level.sourceMaterial)}</div>
      </div>
    `
    : "";
  const emailBlock = level.email
    ? `
      <div class="email-card">
        <div class="email-card-label">✉ Eingegangene Mail</div>
        <div class="email-card-header">
          <div><span class="email-card-field">Von:</span> ${escapeHtml(level.email.from)}</div>
          <div><span class="email-card-field">Betreff:</span> ${escapeHtml(level.email.subject)}</div>
        </div>
        <div class="email-card-body">${escapeHtml(level.email.body)}</div>
      </div>
    `
    : "";
  const textareaPlaceholder = hasPrior
    ? "Ergänze den nächsten Teil ..."
    : "Schreib deinen Prompt an Alex ...";
  const textareaSizeClass = level.careLetter === "BOSS" ? " prompt-input-large" : "";

  const promptFormBlock = revealed
    ? `
      <textarea
        id="prompt-input"
        class="prompt-input${textareaSizeClass}"
        placeholder="${textareaPlaceholder}"
        ${loading ? "disabled" : ""}
      ></textarea>

      <div class="actions">
        <button id="submit-btn" class="btn-primary" ${loading ? "disabled" : ""}>
          ${loading ? `${DOT_LOADER}<span>Alex antwortet</span>` : "An Alex senden"}
        </button>
      </div>

      <div id="result-area"></div>
    `
    : `
      <div class="actions">
        <button id="reveal-btn" class="btn-primary">Jetzt prompten</button>
      </div>
    `;

  container.innerHTML = `
    <div class="level-card">
      <h2 class="level-title">${escapeHtml(level.title)}</h2>
      <p class="level-intro">${escapeHtml(level.introText)}</p>
      <p class="level-goal">${escapeHtml(level.goalText)}</p>

      ${emailBlock}
      ${sourceMaterialBlock}
      ${priorBlock}

      ${promptFormBlock}
    </div>
  `;

  if (!revealed) {
    container.querySelector("#reveal-btn").addEventListener("click", handlers.onReveal);
    return;
  }

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

/** Zeigt den fertig zusammengebauten Prompt nach dem letzten cumulative Level. */
function renderPromptRecap(container, fullPrompt, onContinue) {
  container.innerHTML = `
    <div class="level-card recap-card">
      <h2 class="level-title">Das ist dein vollständiger Prompt</h2>
      <p class="level-intro">
        Stück für Stück aufgebaut: Kontext, eine klare Ask, Regeln und ein Beispiel,
        alles zusammen in einem Prompt.
      </p>
      <div class="prompt-so-far">
        <div class="prompt-so-far-label">Dein vollständiger Prompt</div>
        <div class="prompt-so-far-text">${escapeHtml(fullPrompt)}</div>
      </div>
      <div class="actions">
        <button id="recap-continue-btn" class="btn-primary">Weiter zum Boss-Level →</button>
      </div>
    </div>
  `;

  container.querySelector("#recap-continue-btn").addEventListener("click", onContinue);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
