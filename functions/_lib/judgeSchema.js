// JSON-Schema fuer den Judge-Output (siehe PLAN Abschnitt 5b).
// Wird per output_config.format (Structured Outputs) erzwungen -- garantiert
// gueltiges JSON, das als Text-Block zurueckkommt (response.content[0].text)
// und selbst per JSON.parse() geparst wird. Verifiziert gegen die offizielle
// Anthropic-Doku am 2026-07-14, siehe PLAN Abschnitt 5b.

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
  "Du bist ein exakter, konsistenter Bewertungs-Assistent fuer ein Prompting-Lernspiel.",
  "Du bekommst die Antwort einer anderen KI (Alex) auf den Prompt eines Spielers.",
  "Deine EINZIGE Aufgabe: Bewerte anhand der unten stehenden Kriterien, ob die Antwort",
  "von Alex die Erfolgsbedingung erfuellt. Bewerte AUSSCHLIESSLICH das sichtbare Ergebnis",
  "(den Text von Alex), NICHT die Qualitaet des Spieler-Prompts selbst -- das minimiert",
  "False Positives/Negatives. Sei konsistent: Bei inhaltlich gleicher Antwort muss das",
  "Ergebnis immer gleich ausfallen.",
].join(" ");
