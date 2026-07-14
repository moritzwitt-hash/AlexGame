// JSON-Schema für den Judge-Output (siehe PLAN Abschnitt 5b).
// Wird per response_format (Structured Outputs, strict: true) bei der OpenAI
// Chat-Completions-API erzwungen -- garantiert gültiges JSON, das als
// JSON-String in choices[0].message.content zurückkommt und selbst per
// JSON.parse() geparst wird. Verifiziert gegen die offizielle OpenAI-Doku
// am 2026-07-14, siehe PLAN Abschnitt 5b.

export const JUDGE_SCHEMA = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    missing_element: {
      type: ["string", "null"],
      enum: ["context", "ask", "rules", "examples", null],
    },
    reasoning: {
      type: "string",
      description: "Interne Begründung -- wird dem Spieler NICHT gezeigt.",
    },
  },
  required: ["pass", "missing_element", "reasoning"],
  additionalProperties: false,
};

export const JUDGE_BASE_INSTRUCTION = [
  "Du bist ein exakter und konsistenter Bewertungs-Assistent für ein Prompting-Lernspiel.",
  "Du bekommst die Antwort einer anderen KI (Alex) auf den Prompt eines Spielers. Deine",
  "EINZIGE Aufgabe: Bewerte anhand der unten stehenden Kriterien, ob die Antwort von Alex",
  "die Erfolgsbedingung erfüllt. Bewerte AUSSCHLIESSLICH das sichtbare Ergebnis (den Text",
  "von Alex), NICHT die Qualität des Spieler-Prompts selbst. Halte dich an die Kriterien",
  "so, wie sie unten formuliert sind, inklusive etwaiger eigener Hinweise zum Umgang mit",
  "Grenzfällen. Wo die Kriterien selbst keine Aussage zu einem Grenzfall treffen, entscheide",
  "großzügig zugunsten des Spielers, solange der eigentliche Lernpunkt des Kriteriums klar",
  "erfüllt ist. Sei KONSISTENT: Bei inhaltlich gleichwertigen Antworten (auch bei",
  "unterschiedlicher Formulierung) muss das Ergebnis immer gleich ausfallen -- lass dich nicht",
  "von Oberflächenmerkmalen wie Satzbau oder Wortwahl beeinflussen, sondern bewerte nach der",
  "inhaltlichen Substanz gegen das Kriterium.",
].join(" ");
