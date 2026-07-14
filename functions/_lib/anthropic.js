// Duenner fetch()-Wrapper fuer beide Claude-Calls (siehe PLAN Abschnitt 5).
// Kein Anthropic-SDK -- rohes fetch() reicht, keine Build-Pipeline noetig.
//
// Robustheit (PLAN Phase 4 / Abschnitt 8): Timeout ~20s, 1x automatischer
// Retry bei 429/5xx. Nach dem Retry wird der Fehler an den Aufrufer
// durchgereicht, damit attempt.js eine freundliche Fehlermeldung bauen kann.

import { ALEX_BASE_PERSONA } from "./alexPersona.js";
import { JUDGE_SCHEMA, JUDGE_BASE_INSTRUCTION } from "./judgeSchema.js";

const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;

export class AnthropicCallError extends Error {
  constructor(message, { retryable = false, cause } = {}) {
    super(message);
    this.name = "AnthropicCallError";
    this.retryable = retryable;
    if (cause) this.cause = cause;
  }
}

async function postMessages(apiKey, body) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (res.ok) {
        return await res.json();
      }

      const retryable = res.status === 429 || res.status >= 500;
      const text = await res.text().catch(() => "");
      lastError = new AnthropicCallError(`Anthropic API antwortete mit HTTP ${res.status}: ${text}`, {
        retryable,
      });

      if (!retryable || attempt === MAX_RETRIES) {
        throw lastError;
      }
      // sonst: Schleife macht 1 Retry
    } catch (err) {
      if (err instanceof AnthropicCallError) {
        if (!err.retryable || attempt === MAX_RETRIES) throw err;
        lastError = err;
        continue;
      }
      // Netzwerkfehler oder Timeout (AbortError) -- als retrybar behandeln
      const isTimeout = err.name === "AbortError";
      lastError = new AnthropicCallError(
        isTimeout ? "Zeitueberschreitung bei Anfrage an die Anthropic API." : `Netzwerkfehler: ${err.message}`,
        { retryable: true, cause: err }
      );
      if (attempt === MAX_RETRIES) throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

/** Ausfuehrungs-Call: "Alex" antwortet auf den Spieler-Prompt (PLAN Abschnitt 5a). */
export async function callAlex(env, level, playerPrompt) {
  const data = await postMessages(env.ANTHROPIC_API_KEY, {
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: ALEX_BASE_PERSONA + "\n\n" + level.server.alexPersonaAddendum,
    messages: [{ role: "user", content: playerPrompt }],
  });

  const block = data.content.find((b) => b.type === "text");
  if (!block) {
    throw new AnthropicCallError("Keine Textantwort von Alex erhalten.", { retryable: false });
  }
  return block.text;
}

/** Judge-Call: bewertet Alex' Antwort gegen die versteckte Level-Rubrik (PLAN Abschnitt 5b). */
export async function callJudge(env, level, alexResponse) {
  const system = JUDGE_BASE_INSTRUCTION + "\n\nKRITERIEN FUER DIESES LEVEL:\n" + level.server.judgeRubric;

  const data = await postMessages(env.ANTHROPIC_API_KEY, {
    model: "claude-sonnet-5",
    max_tokens: 300,
    system,
    messages: [
      {
        role: "user",
        content: `Hier ist die Antwort von Alex, die bewertet werden soll:\n\n---\n${alexResponse}\n---`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: JUDGE_SCHEMA } },
  });

  const block = data.content.find((b) => b.type === "text");
  if (!block) {
    throw new AnthropicCallError("Keine Textantwort vom Judge erhalten.", { retryable: false });
  }

  try {
    return JSON.parse(block.text);
  } catch (err) {
    // Sollte durch Structured Outputs praktisch nie passieren (siehe PLAN
    // Abschnitt 5b, Verifikations-Hinweis) -- z.B. bei stop_reason "refusal"
    // oder "max_tokens" moeglich. Als nicht-retrybaren Fehler behandeln.
    throw new AnthropicCallError(`Judge-Antwort war kein gueltiges JSON: ${err.message}`, {
      retryable: false,
      cause: err,
    });
  }
}
