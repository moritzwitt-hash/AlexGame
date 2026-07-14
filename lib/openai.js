// Duenner fetch()-Wrapper fuer beide OpenAI-Calls (Ausfuehrung + Judge).
// Kein SDK -- rohes fetch() reicht, keine Build-Pipeline noetig.
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

// Alex (Ausfuehrung): guenstig, schnell -- passt zur naiven, uebereifrigen Persona.
const ALEX_MODEL = "gpt-5.6-luna";
// Judge (Bewertung): entscheidet ueber Fairness des Spiels -- hier zaehlt Zuverlaessigkeit.
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
        isTimeout ? "Zeitueberschreitung bei Anfrage an die OpenAI API." : `Netzwerkfehler: ${err.message}`,
        { retryable: true, cause: err }
      );
      if (attempt === MAX_RETRIES) throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

/** Ausfuehrungs-Call: "Alex" antwortet auf den Spieler-Prompt. */
export async function callAlex(env, level, playerPrompt) {
  const data = await postChatCompletion(env.OPENAI_API_KEY, {
    model: ALEX_MODEL,
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
  const system = JUDGE_BASE_INSTRUCTION + "\n\nKRITERIEN FUER DIESES LEVEL:\n" + level.server.judgeRubric;

  const data = await postChatCompletion(env.OPENAI_API_KEY, {
    model: JUDGE_MODEL,
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
    // abgeschnittener Antwort (max_tokens) moeglich. Als nicht-retrybaren
    // Fehler behandeln.
    throw new OpenAICallError(`Judge-Antwort war kein gueltiges JSON: ${err.message}`, {
      retryable: false,
      cause: err,
    });
  }
}
