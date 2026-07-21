// Dünner fetch()-Wrapper für beide OpenAI-Calls (Ausführung + Judge).
// Kein SDK -- rohes fetch() reicht, keine Build-Pipeline nötig.
// API-Struktur verifiziert gegen die offizielle OpenAI-Doku (Chat Completions,
// Structured Outputs via response_format.json_schema) am 2026-07-14.
//
// Robustheit (siehe PLAN Phase 4 / Abschnitt 8): Timeout ~20s, 1x automatischer
// Retry bei 429/5xx. Nach dem Retry wird der Fehler an den Aufrufer
// durchgereicht, damit attempt.js eine freundliche Fehlermeldung bauen kann.

import { ALEX_BASE_PERSONA } from "./alexPersona.js";
import { JUDGE_SCHEMA, JUDGE_BASE_INSTRUCTION } from "./judgeSchema.js";

const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;

// Alex (Ausführung): günstig, schnell -- passt zur naiven, übereifrigen Persona.
const ALEX_MODEL = "gpt-5.6-luna";
// Judge (Bewertung): entscheidet über Fairness des Spiels -- hier zählt Zuverlässigkeit.
const JUDGE_MODEL = "gpt-5.6-sol";

export class OpenAICallError extends Error {
  constructor(message, { retryable = false, cause } = {}) {
    super(message);
    this.name = "OpenAICallError";
    this.retryable = retryable;
    if (cause) this.cause = cause;
  }
}

async function postChatCompletion(apiKey, body) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (res.ok) {
        return await res.json();
      }

      const retryable = res.status === 429 || res.status >= 500;
      const text = await res.text().catch(() => "");
      lastError = new OpenAICallError(`OpenAI API antwortete mit HTTP ${res.status}: ${text}`, {
        retryable,
      });

      if (!retryable || attempt === MAX_RETRIES) {
        throw lastError;
      }
      // sonst: Schleife macht 1 Retry
    } catch (err) {
      if (err instanceof OpenAICallError) {
        if (!err.retryable || attempt === MAX_RETRIES) throw err;
        lastError = err;
        continue;
      }
      // Netzwerkfehler oder Timeout (AbortError) -- als retrybar behandeln
      const isTimeout = err.name === "AbortError";
      lastError = new OpenAICallError(
        isTimeout ? "Zeitüberschreitung bei Anfrage an die OpenAI API." : `Netzwerkfehler: ${err.message}`,
        { retryable: true, cause: err }
      );
      if (attempt === MAX_RETRIES) throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

/** Ausführungs-Call: "Alex" antwortet auf den Spieler-Prompt. */
export async function callAlex(env, level, playerPrompt) {
  const data = await postChatCompletion(env.OPENAI_API_KEY, {
    model: ALEX_MODEL,
    // "low" statt "none": Alex muss zuverlässig erkennen, wo Infos fehlen und dort
    // IMMER einen Platzhalter setzen statt etwas Plausibles zu erfinden -- das braucht
    // ein Minimum an Sorgfalt. "none" führte im Livetest zu inkonsistentem Verhalten
    // (gleicher Prompt -> mal Platzhalter, mal erfundene Details -> Judge-Ergebnis kippte).
    reasoning_effort: "low",
    // Deckelt Alex' absichtlich zu ausführliches Standardverhalten (siehe Level-3-Falle:
    // "mindestens 150 Wörter, ohne Obergrenze") nach oben -- verhindert unnötig lange
    // Generierungszeiten/Timeouts bei sehr unspezifischen Prompts, ohne die Lektion zu
    // verändern (Antwort bleibt klar zu lang). max_completion_tokens statt max_tokens,
    // da max_tokens bei Reasoning-Modellen nicht mehr unterstützt wird (verifiziert
    // gegen die OpenAI-Doku, developers.openai.com). WICHTIG: max_completion_tokens
    // umfasst bei Reasoning-Modellen auch die internen Reasoning-Tokens, nicht nur den
    // sichtbaren Text -- ein zu knappes Limit (früher: 600) konnte dazu führen, dass
    // das Budget komplett fürs Reasoning aufgebraucht wird und GAR KEIN sichtbarer Text
    // mehr zurückkommt ("Keine Textantwort von Alex erhalten" -> generischer Fehler im
    // Frontend). Deshalb großzügig bemessen, deutlich über dem realistischen Bedarf.
    max_completion_tokens: 2000,
    messages: [
      { role: "system", content: ALEX_BASE_PERSONA + "\n\n" + level.server.alexPersonaAddendum },
      { role: "user", content: playerPrompt },
    ],
  });

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new OpenAICallError("Keine Textantwort von Alex erhalten.", { retryable: false });
  }
  return content;
}

/** Judge-Call: bewertet Alex' Antwort gegen die versteckte Level-Rubrik. */
export async function callJudge(env, level, alexResponse) {
  const system = JUDGE_BASE_INSTRUCTION + "\n\nKRITERIEN FÜR DIESES LEVEL:\n" + level.server.judgeRubric;

  const data = await postChatCompletion(env.OPENAI_API_KEY, {
    model: JUDGE_MODEL,
    // "medium": nach Livetest-Inkonsistenzen (gleicher Prompt -> unterschiedliches
    // Urteil) von "low" hochgesetzt -- Fairness/Strenge der Bewertung ist wichtiger
    // als die letzten Millisekunden Latenz beim Judge-Call.
    reasoning_effort: "medium",
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Hier ist die Antwort von Alex, die bewertet werden soll:\n\n---\n${alexResponse}\n---`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "care_judge_verdict",
        schema: JUDGE_SCHEMA,
        strict: true,
      },
    },
  });

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new OpenAICallError("Keine Textantwort vom Judge erhalten.", { retryable: false });
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    // Sollte durch Structured Outputs praktisch nie passieren -- z.B. bei
    // abgeschnittener Antwort (max_tokens) möglich. Als nicht-retrybaren
    // Fehler behandeln.
    throw new OpenAICallError(`Judge-Antwort war kein gültiges JSON: ${err.message}`, {
      retryable: false,
      cause: err,
    });
  }
}
