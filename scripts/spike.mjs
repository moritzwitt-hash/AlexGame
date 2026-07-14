// Phase 0 Spike (siehe PLAN Abschnitt 7): beweist, dass ein echter Judge-Call
// gegen die Anthropic-API mit unserem Schema/Prompt/Modellpaar funktioniert,
// bevor auf 5 Level skaliert wird.
//
// Aufruf: ANTHROPIC_API_KEY=sk-ant-... node scripts/spike.mjs

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("Fehler: ANTHROPIC_API_KEY ist nicht gesetzt.");
  process.exit(1);
}

const JUDGE_SCHEMA = {
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

const JUDGE_BASE_INSTRUCTION =
  "Du bist ein exakter, konsistenter Bewertungs-Assistent fuer ein Prompting-Lernspiel. " +
  "Du bekommst die Antwort einer anderen KI (Alex) auf den Prompt eines Spielers. " +
  "Bewerte AUSSCHLIESSLICH das sichtbare Ergebnis (den Text von Alex), NICHT die Qualitaet " +
  "des Spieler-Prompts selbst -- das minimiert False Positives/Negatives. Sei konsistent.";

const LEVEL_1_RUBRIC =
  "PASS nur, wenn die Antwort KEINE Platzhalter-Muster mehr enthaelt (eckige/geschweifte " +
  "Klammern, XXX, Unterstriche) UND stattdessen konkrete, im Nutzer-Prompt tatsaechlich " +
  "vorgegebene Inhalte verwendet. FAIL, wenn mindestens ein Platzhalter vorkommt.";

async function callJudge(alexResponse) {
  const system = JUDGE_BASE_INSTRUCTION + "\n\nKRITERIEN FUER DIESES LEVEL:\n" + LEVEL_1_RUBRIC;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
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
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  const data = await res.json();
  const block = data.content.find((b) => b.type === "text");
  if (!block) {
    throw new Error(`Kein text-Block in der Antwort gefunden. Rohe content: ${JSON.stringify(data.content)}`);
  }
  return JSON.parse(block.text);
}

const FAIL_CASE =
  "Hallo [Name], vielen Dank fuer Ihr Interesse an [Produkt]. Wir melden uns bald bei Ihnen bezueglich [Anlass].";

const PASS_CASE =
  "Hallo Frau Meier, vielen Dank fuer Ihr Interesse an unserer neuen Buchhaltungssoftware. " +
  "Wir freuen uns, Ihnen anlaesslich Ihrer Anfrage vom 3. Maerz ein individuelles Angebot zu erstellen.";

async function main() {
  console.log("Phase 0 Spike -- verifiziert Judge-Call gegen echte Anthropic-API\n");

  let failResult, passResult;
  let failError = null, passError = null;

  console.log("Call 1 (erwartet pass=false, enthaelt Platzhalter)...");
  try {
    failResult = await callJudge(FAIL_CASE);
    console.log("  ->", JSON.stringify(failResult));
  } catch (e) {
    failError = e;
    console.log("  -> FEHLER:", e.message);
  }

  console.log("\nCall 2 (erwartet pass=true, keine Platzhalter)...");
  try {
    passResult = await callJudge(PASS_CASE);
    console.log("  ->", JSON.stringify(passResult));
  } catch (e) {
    passError = e;
    console.log("  -> FEHLER:", e.message);
  }

  console.log("\n--- Erfolgskriterium ---");
  const ok =
    !failError &&
    !passError &&
    typeof failResult.pass === "boolean" &&
    typeof passResult.pass === "boolean" &&
    failResult.pass === false &&
    passResult.pass === true;

  if (ok) {
    console.log("BESTANDEN: Beide Calls lieferten gueltiges JSON, pass-Werte stimmen wie erwartet.");
    process.exit(0);
  } else {
    console.log("NICHT BESTANDEN: Grundannahme nicht bestaetigt -- vor Phase 1 klaeren.");
    process.exit(1);
  }
}

main();
