// VOLLSTAENDIGE Level-Definitionen (siehe PLAN Abschnitt 4/10) -- server-only.
// Wird NIE an den Client ausgeliefert. lib/levels.js extrahiert
// daraus programmatisch nur die public-Unterobjekte.
//
// Moritz editiert AUSSCHLIESSLICH diese Datei, um Level-Texte, Fallen-Setup,
// Judge-Rubrik oder Hinweise anzupassen -- ohne app.js oder die Endpoints
// zu beruehren.
//
// Jedes Level-Objekt:
//   id, order, careLetter
//   public: { title, introText, goalText, placeholderExample }  -> geht an Client
//   server: { alexPersonaAddendum, judgeRubric, missingElementLabel } -> bleibt im Backend
//   hints:  { afterAttempt1, afterAttempt2, afterAttempt4 } -- drei Eskalationsstufen
//           (siehe PLAN Abschnitt 5b: sanfter Wink -> expliziter CARE-Buchstabe ->
//           konkretes Beispiel-Snippet ab Versuch 4)

export const LEVELS = [
  {
    id: "L1_context",
    order: 1,
    careLetter: "C",
    public: {
      title: "Level 1 — Kontext (das C in CARE)",
      introText:
        "Alex soll eine E-Mail an einen Kunden schreiben. Er weiss aber nichts ueber den Kunden, " +
        "das Produkt oder den Anlass. Schau dir seine Antwort an -- und gib ihm dann den Kontext, " +
        "den er braucht.",
      goalText:
        "Ziel: Die Antwort von Alex enthaelt keine Platzhalter mehr (z.B. eckige Klammern) -- " +
        "nur konkrete Angaben aus deinem Prompt.",
      placeholderExample:
        "Hallo [Name], vielen Dank fuer Ihr Interesse an [Produkt]. Wir melden uns bald bei " +
        "Ihnen bezueglich [Anlass].",
    },
    server: {
      alexPersonaAddendum:
        "Fuer diese Aufgabe hast du von deinem Chef NUR den Auftrag 'Schreibe eine E-Mail an " +
        "einen Kunden' bekommen. Wenn im Prompt wichtige Informationen fehlen, erfindest du " +
        "NICHTS und fragst NICHT nach -- du setzt stattdessen einen Platzhalter in eckigen " +
        "Klammern ein, bei jeder fehlenden Information, ohne es zu kommentieren.",
      judgeRubric:
        "PASS nur, wenn die Antwort KEINE Platzhalter-Muster mehr enthaelt (eckige/geschweifte " +
        "Klammern, XXX, Unterstriche) UND stattdessen konkrete, im Nutzer-Prompt tatsaechlich " +
        "vorgegebene Inhalte verwendet. FAIL, wenn mindestens ein Platzhalter vorkommt.",
      missingElementLabel: "context",
    },
    hints: {
      afterAttempt1:
        "Versuche es noch einmal: Was muesste ein neuer Kollege wissen, um diese E-Mail zu " +
        "schreiben, OHNE nachzufragen?",
      afterAttempt2:
        "Dir fehlt das C aus CARE: Context. Gib Alex konkrete Informationen direkt im Prompt.",
      afterAttempt4:
        "Beispiel-Baustein zum Weiterbauen: 'Der Kunde heisst [Name], hat [Produkt] gekauft, " +
        "Anlass ist [Anlass]. Schreibe eine E-Mail, die...' -- ersetze die Klammern durch echte " +
        "Angaben und ergaenze den Rest deiner Aufgabe.",
    },
  },

  {
    id: "L2_ask",
    order: 2,
    careLetter: "A",
    public: {
      title: "Level 2 — Ask (das A in CARE)",
      introText:
        "Der Chef hat Alex nur gesagt: 'Kuemmere dich um die Kundenbeschwerde.' Alex hat sofort " +
        "reagiert. Das Problem: Wir brauchen intern einen Fahrplan fuers Team, keine Nachricht " +
        "an den Kunden. Schau dir an, was Alex produziert hat -- und formuliere eine Ask, die " +
        "eindeutig macht, WER das Ergebnis liest.",
      goalText:
        "Ziel: Alex' Antwort ist ein interner Massnahmenplan mit konkreten Schritten fuer das " +
        "Team -- NICHT eine an den Kunden gerichtete Nachricht.",
      placeholderExample:
        "Sehr geehrte Kundin, es tut uns sehr leid, dass Sie mit unserem Service unzufrieden " +
        "waren. Wir schaetzen Ihr Feedback sehr und werden uns umgehend darum kuemmern...",
    },
    server: {
      alexPersonaAddendum:
        "Dein Chef hat dir nur gesagt: 'Kuemmere dich um die Kundenbeschwerde.' Du gehst " +
        "automatisch davon aus, dass eine Kundenbeschwerde bedeutet, direkt dem Kunden zu " +
        "antworten -- du schreibst grundsaetzlich eine freundliche, entschuldigende " +
        "E-Mail-Antwort MIT ANREDE AN DEN KUNDEN (z.B. 'Sehr geehrte(r) Kunde/Kundin') und " +
        "einer Gruszformel, sofern der Prompt nicht ausdruecklich sagt, dass das Ergebnis ein " +
        "interner Text fuer das Team sein soll. Du erwaehnst nirgends, dass du unsicher bist, " +
        "wer das lesen soll -- du triffst diese Annahme stillschweigend.",
      judgeRubric:
        "FAIL, wenn die Antwort erkennbar an den Kunden adressiert ist (Anrede wie 'Sehr " +
        "geehrte(r) Kunde/Kundin', Entschuldigungsformel, kundengerichteter Ton) ODER keine " +
        "konkreten Handlungsschritte enthaelt. PASS, wenn die Antwort als interner Text an ein " +
        "Teammitglied erkennbar ist UND mindestens 2 konkrete, umsetzbare Schritte enthaelt.",
      missingElementLabel: "ask",
    },
    hints: {
      afterAttempt1:
        "Schau dir Alex' Antwort genau an: An wen ist sie eigentlich gerichtet? Ist das " +
        "wirklich das, was wir brauchen?",
      afterAttempt2:
        "Dir fehlt das A aus CARE: Ask. Sag Alex explizit, WER das Ergebnis liest (das Team, " +
        "nicht der Kunde) und WAS fuer ein Format du willst (Massnahmenplan, keine E-Mail an " +
        "den Kunden).",
      afterAttempt4:
        "Beispiel-Baustein zum Weiterbauen: 'Schreibe eine interne Nachricht AN DAS TEAM " +
        "(nicht an den Kunden) mit konkreten naechsten Schritten zur Kundenbeschwerde: ...' -- " +
        "ergaenze die konkreten Schritte, die du dir wuenschst.",
    },
  },

  {
    id: "L3_rules",
    order: 3,
    careLetter: "R",
    public: {
      title: "Level 3 — Rules (das R in CARE)",
      introText:
        "Alex soll eine Ankuendigung fuer das Team-Meeting schreiben. Ohne Formatvorgaben " +
        "schreibt er, wie ihm der Schnabel gewachsen ist. Gib ihm klare Regeln: Laenge, Ton, " +
        "Struktur.",
      goalText:
        "Ziel: Antwort ist kurz (max. 80 Woerter), ohne Emojis, mit klarem Call-to-Action.",
      placeholderExample:
        "Hey Team! 🎉 Ich hoffe, es geht euch allen super! Ich wollte euch nur ganz kurz " +
        "informieren, dass wir naechste Woche ein Meeting haben werden... 😊 (und so weiter, " +
        "sehr lang, ohne klaren Abschluss)",
    },
    server: {
      alexPersonaAddendum:
        "Du bekommst den Auftrag, eine Ankuendigung fuers Team-Meeting zu schreiben. Ohne " +
        "ausdrueckliche Vorgaben zu Laenge, Ton oder Format schreibst du ausfuehrlich " +
        "(mindestens 150 Woerter), locker mit mehreren passenden Emojis, und laesst die " +
        "Nachricht ohne eine klare abschliessende Handlungsaufforderung (Call-to-Action) " +
        "einfach auslaufen.",
      judgeRubric:
        "FAIL bei mehr als 80 Woertern ODER Emoji-Vorkommen ODER fehlendem Call-to-Action am " +
        "Ende. PASS, wenn alle drei Bedingungen erfuellt sind (max. 80 Woerter, keine Emojis, " +
        "klarer CTA).",
      missingElementLabel: "rules",
    },
    hints: {
      afterAttempt1:
        "Lies dir Alex' Ankuendigung durch: Ist sie so kurz und klar, wie du es dir fuer ein " +
        "Meeting wuenschst?",
      afterAttempt2:
        "Dir fehlt das R aus CARE: Rules. Gib Alex klare Formatregeln vor: maximale Wortzahl, " +
        "keine Emojis, ein klarer Call-to-Action am Ende.",
      afterAttempt4:
        "Beispiel-Baustein zum Weiterbauen: 'Schreibe eine Ankuendigung fuers Team-Meeting. " +
        "Regeln: maximal 80 Woerter, keine Emojis, letzter Satz ist ein klarer Aufruf zum " +
        "Handeln (z.B. Teilnahme bestaetigen).' -- ergaenze Thema und Termin des Meetings.",
    },
  },

  {
    id: "L4_examples",
    order: 4,
    careLetter: "E",
    public: {
      title: "Level 4 — Examples (das E in CARE)",
      introText:
        "Der Abteilungsleiter hat einen sehr eigenwilligen Stil fuer interne Status-Updates. " +
        "Du kannst ihn nicht beschreiben, nur zeigen. Gib Alex ein Beispiel, dann uebernimmt " +
        "er den Stil.",
      goalText:
        "Ziel: Antwort folgt der Stil-Signatur -- jede Zeile beginnt mit '→ ', endet ohne " +
        "Satzzeichen, maximal 6 Woerter pro Zeile.",
      placeholderExample:
        "Ich wollte kurz Bescheid geben, dass das Projekt gut voranschreitet und wir " +
        "voraussichtlich im Zeitplan bleiben werden.",
    },
    server: {
      alexPersonaAddendum:
        "Du hast keinen festen Schreibstil -- du schreibst standardmaessig in normalen, " +
        "vollstaendigen Saetzen mit Satzzeichen und gelegentlichen Adjektiven, wie es fuer " +
        "interne Updates ueblich ist. Nur wenn der Prompt dir mindestens eine konkrete " +
        "Beispielzeile im gewuenschten Zielstil vorgibt, uebernimmst du exakt dieses " +
        "Stilmuster fuer deine gesamte Antwort (inklusive Zeilenanfang, Satzzeichen-Verzicht " +
        "und Wortzahl-Begrenzung) -- ohne das Muster zu beschreiben oder zu kommentieren.",
      judgeRubric:
        "PASS, wenn ALLE Zeilen der Antwort mit '→ ' beginnen, kein Satzzeichen am Zeilenende " +
        "steht, und keine Zeile mehr als 6 Woerter hat. FAIL sonst.",
      missingElementLabel: "examples",
    },
    hints: {
      afterAttempt1:
        "Schau dir Alex' Antwort an: Trifft sie wirklich den besonderen Stil, den sich der " +
        "Abteilungsleiter wuenscht?",
      afterAttempt2:
        "Dir fehlt das E aus CARE: Examples. Beschreibe den Stil nicht nur, sondern zeig Alex " +
        "mindestens eine Beispielzeile im Zielformat.",
      afterAttempt4:
        "Beispiel-Baustein zum Weiterbauen: 'Schreibe im folgenden Stil (Beispiel):\n" +
        "→ Team informieren\n→ Deadline pruefen\nSchreibe jetzt ein Update im selben Stil zu: " +
        "...' -- ergaenze dein eigenes Thema nach dem Beispiel.",
    },
  },

  {
    id: "L5_boss",
    order: 5,
    careLetter: "BOSS",
    public: {
      title: "Level 5 — Boss: Alle vier Buchstaben zusammen",
      introText:
        "Letzter Test: Ein chaotisches Meeting ist vorbei, hier sind Alex' rohe Notizen. " +
        "Verwandle das in ein Protokoll, das ein Kollege, der nicht dabei war, sofort nutzen " +
        "kann.",
      goalText:
        "Ziel: Ein Protokoll mit klaren Abschnitten (Themen/Entscheidungen/Action Items mit " +
        "Verantwortlichen), das ohne Rueckfragen weiterverwendbar ist.",
      placeholderExample:
        "ok also lisa meinte budget ist knapp thomas nicht einverstanden... launch " +
        "verschieben?? sarah sagt marketing braucht 2 wochen mehr uff. action items " +
        "irgendwer muss den kunden anrufen wegen deadline. naechstes meeting keine ahnung " +
        "wann. ach und die dashboards sind kaputt seit dienstag, IT bescheid sagen.",
    },
    server: {
      alexPersonaAddendum:
        "Du bekommst rohe, unstrukturierte Meeting-Notizen und sollst daraus etwas machen. " +
        "Ohne ausdrueckliche Formatvorgaben lieferst du lediglich eine knappe " +
        "Fliesstext-Zusammenfassung der Notizen -- ohne erkennbare Abschnitte, ohne explizite " +
        "Verantwortlichkeiten pro Aufgabe und ohne Rueckfragen zu stellen, auch wenn " +
        "Informationen (z.B. Termine) unklar bleiben.",
      judgeRubric:
        "PASS, wenn die Antwort strukturiert ist (erkennbare Abschnitte, z.B. " +
        "Themen/Entscheidungen/Action Items), Action Items mit erkennbarer Verantwortlichkeit " +
        "enthaelt (auch wenn der Owner aus dem Prompt stammt), und keine offenen " +
        "Verstaendnisfragen an den Leser stellt. FAIL sonst.",
      missingElementLabel: null,
    },
    hints: {
      afterAttempt1:
        "Schau dir Alex' Protokoll an: Koennte ein Kollege, der nicht im Meeting war, damit " +
        "sofort etwas anfangen?",
      afterAttempt2:
        "Hier brauchst du alle vier CARE-Buchstaben gleichzeitig: Context (worum ging's), Ask " +
        "(was genau soll rauskommen -- ein strukturiertes Protokoll), Rules (welche " +
        "Abschnitte/Form) und Examples (wie so ein Abschnitt aussehen soll).",
      afterAttempt4:
        "Beispiel-Baustein zum Weiterbauen: 'Erstelle aus diesen Meeting-Notizen ein " +
        "Protokoll mit den Abschnitten Themen, Entscheidungen und Action Items (mit " +
        "Verantwortlichen). Format pro Action Item: - [Aufgabe] – Verantwortlich: [Person]. " +
        "Notizen: ...' -- fuege die rohen Notizen ein.",
    },
  },
];

export function getLevelById(id) {
  return LEVELS.find((l) => l.id === id);
}
