// POST /api/attempt -- Haupt-Endpoint (siehe PLAN Abschnitt 1/5).
// Orchestriert Ausfuehrungs- und Judge-Call in einem Roundtrip. Der Client
// bekommt NIE den API-Key, NIE die Judge-Rubrik, NIE den vollen
// Alex-System-Prompt zu sehen -- nur { alexResponse, pass, hint }.

import { getLevelById } from "../_lib/levels.config.js";
import { callAlex, callJudge, AnthropicCallError } from "../_lib/anthropic.js";

const MAX_PROMPT_LENGTH = 4000;

// Hint-Zusammenbau (PLAN Abschnitt 5b): drei Eskalationsstufen.
// Versuch 1 = sanfter Wink, Versuch 2-3 = expliziter CARE-Buchstabe,
// ab Versuch 4 = konkretes Beispiel-Snippet als Starthilfe.
function buildHint(level, attemptNo, judgeVerdict) {
  if (judgeVerdict.pass) return null;
  if (attemptNo === 1) return level.hints.afterAttempt1;
  if (attemptNo < 4) return level.hints.afterAttempt2;
  return level.hints.afterAttempt4;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Ungueltiger Request-Body (kein JSON)." }, 400);
  }

  const { levelId, playerPrompt, attemptNo } = body ?? {};

  if (typeof levelId !== "string" || typeof playerPrompt !== "string" || typeof attemptNo !== "number") {
    return jsonResponse(
      { error: "levelId (string), playerPrompt (string) und attemptNo (number) sind erforderlich." },
      400
    );
  }

  if (playerPrompt.trim().length === 0) {
    return jsonResponse({ error: "Bitte gib einen Prompt ein." }, 400);
  }

  if (playerPrompt.length > MAX_PROMPT_LENGTH) {
    return jsonResponse({ error: `Prompt ist zu lang (max. ${MAX_PROMPT_LENGTH} Zeichen).` }, 400);
  }

  const level = getLevelById(levelId);
  if (!level) {
    return jsonResponse({ error: `Unbekanntes Level: ${levelId}` }, 404);
  }

  if (!env.ANTHROPIC_API_KEY) {
    // Sollte im Betrieb nie auftreten (Secret ist Teil der Deploy-Checkliste,
    // PLAN Abschnitt 8) -- klarer Fehler statt kryptischem 401 der Anthropic API.
    return jsonResponse({ error: "Server ist nicht korrekt konfiguriert (fehlender API-Key)." }, 500);
  }

  try {
    const alexResponse = await callAlex(env, level, playerPrompt);
    const judgeVerdict = await callJudge(env, level, alexResponse);
    const hint = buildHint(level, attemptNo, judgeVerdict);

    return jsonResponse({ alexResponse, pass: judgeVerdict.pass, hint });
  } catch (err) {
    if (err instanceof AnthropicCallError) {
      // Notfallplan (PLAN Abschnitt 8): freundliche Fehlermeldung, Frontend
      // zeigt bei retryable=true einen Retry-Button.
      return jsonResponse(
        {
          error: "Die Anfrage an die KI ist fehlgeschlagen. Bitte versuche es gleich noch einmal.",
          retryable: err.retryable,
        },
        502
      );
    }
    console.error("Unerwarteter Fehler in /api/attempt:", err);
    return jsonResponse({ error: "Unerwarteter Serverfehler." }, 500);
  }
}
