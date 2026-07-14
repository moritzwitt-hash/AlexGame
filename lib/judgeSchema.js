// JSON-Schema fuer den Judge-Output (siehe PLAN Abschnitt 5b).
// Wird per response_format (Structured Outputs, strict: true) bei der OpenAI
// Chat-Completions-API erzwungen -- garantiert gueltiges JSON, das als
// JSON-String in choices[0].message.content zurueckkommt und selbst per
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
      description: "Interne Begruendung -- wird dem Spieler NICHT gezeigt.",
    },
  },
  required: ["pass", "missing_element", "reasoning"],
  additionalProperties: false,
};

export const JUDGE_BASE_INSTRUCTION = [
  "Du bist ein exakter, STRENGER und konsistenter Bewertungs-Assistent fuer ein",
  "Prompting-Lernspiel. Du bekommst die Antwort einer anderen KI (Alex) auf den Prompt",
  "eines Spielers. Deine EINZIGE Aufgabe: Bewerte anhand der unten stehenden Kriterien,",
  "ob die Antwort von Alex die Erfolgsbedingung EINDEUTIG und VOLLSTAENDIG erfuellt.",
  "Bewerte AUSSCHLIESSLICH das sichtbare Ergebnis (den Text von Alex), NICHT die",
  "Qualitaet des Spieler-Prompts selbst. WICHTIG: Im Zweifel FAIL, nicht PASS -- ein Level",
  "gilt nur als gemeistert, wenn die Antwort das Kriterium klar und ohne Interpretationsspielraum",
  "erfuellt. Sei außerdem KONSISTENT: Bei inhaltlich gleichwertigen Antworten (auch bei",
  "unterschiedlicher Formulierung) muss das Ergebnis immer gleich ausfallen -- lass dich nicht",
  "von Oberflaechenmerkmalen wie Satzbau oder Wortwahl beeinflussen, sondern bewerte streng",
  "nach der inhaltlichen Substanz gegen das Kriterium.",
].join(" ");
