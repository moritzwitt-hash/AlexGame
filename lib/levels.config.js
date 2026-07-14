// VOLLSTAENDIGE Level-Definitionen (siehe PLAN Abschnitt 4/10) -- server-only.
// Wird NIE an den Client ausgeliefert. lib/levels.js extrahiert
// daraus programmatisch nur die public-Unterobjekte.
//
// Moritz editiert AUSSCHLIESSLICH diese Datei, um Level-Texte, Fallen-Setup,
// Judge-Rubrik oder Hinweise anzupassen -- ohne app.js oder die Endpoints
// zu beruehren.
//
// Wichtig fuer public.introText/goalText und hints.*: Diese Texte sieht der
// Spieler. Sie sollen klar sagen, WAS zu tun ist (z.B. "denk dir einen Namen
// aus"), nicht nur die Situation beschreiben -- siehe PLAN-Changelog
// "Intuitivitaet nach Live-Test".
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
      title: "Level 1: Kontext",
      introText:
        "Alex soll eine E-Mail an einen Kunden schreiben. Mehr Infos hat er nicht bekommen. " +
        "Schau dir erstmal an, was dabei rauskommt.",
      goalText:
        "Denk dir einen Kundennamen, ein Produkt und einen Anlass aus und schreib sie direkt " +
        "in deinen Prompt. Ohne diese Angaben kann Alex nur raten.",
      placeholderExample:
        "Hallo [Name], vielen Dank fuer Ihr Interesse an [Produkt]. Wir melden uns bald bei " +
        "Ihnen bezueglich [Anlass].",
    },
    server: {
      alexPersonaAddendum:
        "Fuer diese Aufgabe hast du von deinem Chef NUR den Auftrag 'Schreibe eine E-Mail an " +
        "einen Kunden' bekommen. Das ist eine HARTE, AUSNAHMSLOSE Regel: Fuer JEDE einzelne " +
        "Information, die nicht WOERTLICH und KONKRET im Prompt des Nutzers steht (z.B. " +
        "Kundenname, Firmenname, Produktname, Anlass, Datum), setzt du IMMER einen Platzhalter " +
        "in eckigen Klammern ein, z.B. [Name], [Produkt], [Anlass]. Du erfindest NIEMALS " +
        "einen plausibel klingenden Namen, ein Produkt oder ein Datum aus eigener Initiative, " +
        "auch nicht, um hilfreich oder professionell zu wirken. Das waere ein Regelverstoss. " +
        "Du fragst auch NICHT nach. Diese Regel gilt fuer JEDE fehlende Angabe ohne Ausnahme.",
      judgeRubric:
        "PASS NUR, wenn die Antwort ALLE der folgenden Bedingungen zweifelsfrei erfuellt: " +
        "(1) KEIN Platzhalter-Muster vorhanden (eckige/geschweifte Klammern, XXX, Unterstriche " +
        "als Luecken-Fueller), UND (2) konkrete Namen/Produkte/Daten sind vorhanden. FAIL, wenn " +
        "mindestens ein Platzhalter-Muster vorkommt ODER wenn unklar ist, ob eine Angabe ein " +
        "echter Wert oder ein verkappter Platzhalter ist (z.B. generische Fuellwoerter wie " +
        "'der Kunde', 'das Produkt' ohne echten Eigennamen). Im Zweifel: FAIL.",
      missingElementLabel: "context",
    },
    hints: {
      afterAttempt1:
        "Schau dir Alex' E-Mail nochmal an. Was fehlt ihm, um sie wirklich zu schreiben, " +
        "statt zu raten?",
      afterAttempt2:
        "Dir fehlt das C aus CARE: Context. Gib Alex konkrete Infos direkt im Prompt, zum " +
        "Beispiel einen Namen, ein Produkt und einen Anlass.",
      afterAttempt4:
        "Probier sowas: 'Der Kunde heisst [Name], hat [Produkt] gekauft, Anlass ist [Anlass]. " +
        "Schreib eine E-Mail, die...' Ersetz die Klammern durch echte Angaben und schreib den " +
        "Rest deiner Aufgabe dazu.",
    },
  },

  {
    id: "L2_ask",
    order: 2,
    careLetter: "A",
    public: {
      title: "Level 2: Ask",
      introText:
        "Der Chef hat Alex nur gesagt: 'Kuemmere dich um die Kundenbeschwerde.' Alex hat " +
        "sofort reagiert. Klingt gut, hilft aber niemandem: wir brauchen einen Plan fuers " +
        "Team, keine Nachricht an den Kunden.",
      goalText:
        "Sag Alex klar, fuer wen die Antwort ist (das Team, nicht der Kunde) und was du " +
        "willst: konkrete naechste Schritte statt einer Mail an den Kunden.",
      placeholderExample:
        "Sehr geehrte Kundin, es tut uns sehr leid, dass Sie mit unserem Service unzufrieden " +
        "waren. Wir schaetzen Ihr Feedback sehr und werden uns umgehend darum kuemmern...",
    },
    server: {
      alexPersonaAddendum:
        "Dein Chef hat dir nur gesagt: 'Kuemmere dich um die Kundenbeschwerde.' Du gehst " +
        "automatisch davon aus, dass eine Kundenbeschwerde bedeutet, direkt dem Kunden zu " +
        "antworten: du schreibst grundsaetzlich eine freundliche, entschuldigende " +
        "E-Mail-Antwort MIT ANREDE AN DEN KUNDEN (z.B. 'Sehr geehrte(r) Kunde/Kundin') und " +
        "einer Gruszformel, sofern der Prompt nicht ausdruecklich sagt, dass das Ergebnis ein " +
        "interner Text fuer das Team sein soll. Du erwaehnst nirgends, dass du unsicher bist, " +
        "wer das lesen soll. Du triffst diese Annahme stillschweigend.",
      judgeRubric:
        "FAIL, wenn die Antwort erkennbar an den Kunden adressiert ist (Anrede wie 'Sehr " +
        "geehrte(r) Kunde/Kundin', Entschuldigungsformel, kundengerichteter Ton) ODER keine " +
        "konkreten Handlungsschritte enthaelt. PASS, wenn die Antwort als interner Text an ein " +
        "Teammitglied erkennbar ist UND mindestens 2 konkrete, umsetzbare Schritte enthaelt.",
      missingElementLabel: "ask",
    },
    hints: {
      afterAttempt1:
        "Schau dir Alex' Antwort genau an. An wen richtet sie sich eigentlich? Ist das " +
        "wirklich das, was gebraucht wird?",
      afterAttempt2:
        "Dir fehlt das A aus CARE: Ask. Sag Alex ausdruecklich, wer das Ergebnis liest (das " +
        "Team, nicht der Kunde) und in welchem Format du es willst (ein Plan, keine E-Mail).",
      afterAttempt4:
        "Probier sowas: 'Schreib eine interne Nachricht ans Team (nicht an den Kunden) mit " +
        "konkreten naechsten Schritten zur Kundenbeschwerde: ...' Fuege die Schritte hinzu, " +
        "die du dir wuenschst.",
    },
  },

  {
    id: "L3_rules",
    order: 3,
    careLetter: "R",
    public: {
      title: "Level 3: Rules",
      introText:
        "Alex soll eine Ankuendigung fuers Team-Meeting schreiben. Ohne Vorgaben schreibt er " +
        "drauflos: lang, mit Emojis, ohne klaren Abschluss.",
      goalText:
        "Gib Alex klare Regeln fuer Laenge, Ton und Aufbau. Ziel: maximal 80 Woerter, keine " +
        "Emojis, ein klarer Aufruf zum Handeln am Ende.",
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
        "Lies dir Alex' Ankuendigung durch. Ist sie so kurz und klar, wie du es dir fuer ein " +
        "Meeting wuenschst?",
      afterAttempt2:
        "Dir fehlt das R aus CARE: Rules. Gib Alex klare Formatregeln: maximale Wortzahl, " +
        "keine Emojis, ein klarer Aufruf zum Handeln am Ende.",
      afterAttempt4:
        "Probier sowas: 'Schreib eine Ankuendigung fuers Team-Meeting. Regeln: maximal 80 " +
        "Woerter, keine Emojis, letzter Satz ist ein klarer Aufruf zum Handeln, zum Beispiel " +
        "Teilnahme bestaetigen.' Ergaenz Thema und Termin des Meetings.",
    },
  },

  {
    id: "L4_examples",
    order: 4,
    careLetter: "E",
    public: {
      title: "Level 4: Examples",
      introText:
        "Der Abteilungsleiter hat einen sehr eigenwilligen Stil fuer interne Updates. " +
        "Beschreiben laesst sich der kaum, zeigen schon. Gib Alex ein Beispiel, dann " +
        "uebernimmt er den Stil.",
      goalText:
        "Schreib mindestens eine Beispielzeile im Zielstil in deinen Prompt: beginnt mit " +
        "einem Pfeil (→), endet ohne Punkt, maximal sechs Woerter. Alex uebernimmt den Stil " +
        "nur, wenn er ihn sieht, nicht wenn du ihn beschreibst.",
      placeholderExample:
        "Ich wollte kurz Bescheid geben, dass das Projekt gut voranschreitet und wir " +
        "voraussichtlich im Zeitplan bleiben werden.",
    },
    server: {
      alexPersonaAddendum:
        "Du hast keinen festen Schreibstil: du schreibst standardmaessig in normalen, " +
        "vollstaendigen Saetzen mit Satzzeichen und gelegentlichen Adjektiven, wie es fuer " +
        "interne Updates ueblich ist. Nur wenn der Prompt dir mindestens eine konkrete " +
        "Beispielzeile im gewuenschten Zielstil vorgibt, uebernimmst du exakt dieses " +
        "Stilmuster fuer deine gesamte Antwort (inklusive Zeilenanfang, Satzzeichen-Verzicht " +
        "und Wortzahl-Begrenzung), ohne das Muster zu beschreiben oder zu kommentieren.",
      judgeRubric:
        "PASS, wenn ALLE Zeilen der Antwort mit '→ ' beginnen, kein Satzzeichen am Zeilenende " +
        "steht, und keine Zeile mehr als 6 Woerter hat. FAIL sonst.",
      missingElementLabel: "examples",
    },
    hints: {
      afterAttempt1:
        "Schau dir Alex' Antwort an. Trifft sie wirklich den besonderen Stil, den sich der " +
        "Abteilungsleiter wuenscht?",
      afterAttempt2:
        "Dir fehlt das E aus CARE: Examples. Beschreib den Stil nicht, sondern zeig Alex " +
        "mindestens eine Beispielzeile im Zielformat.",
      afterAttempt4:
        "Probier sowas: 'Schreib im folgenden Stil (Beispiel):\n" +
        "→ Team informieren\n→ Deadline pruefen\nSchreib jetzt ein Update im selben Stil zu: " +
        "...' Ergaenz dein eigenes Thema nach dem Beispiel.",
    },
  },

  {
    id: "L5_boss",
    order: 5,
    careLetter: "BOSS",
    public: {
      title: "Level 5: Boss",
      introText:
        "Letzter Test. Ein chaotisches Meeting ist vorbei, hier sind Alex' rohe Notizen. " +
        "Mach daraus ein Protokoll, das jemand nutzen kann, der nicht dabei war.",
      goalText:
        "Jetzt brauchst du alle vier CARE-Buchstaben zusammen: gib Kontext, sag klar was " +
        "rauskommen soll (ein Protokoll, keine Zusammenfassung), gib eine Struktur vor (zum " +
        "Beispiel Themen, Entscheidungen, Aufgaben) und zeig bei Bedarf, wie eine gute Zeile " +
        "aussieht.",
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
        "Fliesstext-Zusammenfassung der Notizen, ohne erkennbare Abschnitte, ohne explizite " +
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
        "Schau dir Alex' Protokoll an. Koennte jemand, der nicht im Meeting war, damit sofort " +
        "etwas anfangen?",
      afterAttempt2:
        "Hier brauchst du alle vier CARE-Buchstaben gleichzeitig: Context (worum ging's), Ask " +
        "(was soll rauskommen, ein strukturiertes Protokoll), Rules (welche Abschnitte) und " +
        "Examples (wie so ein Abschnitt aussehen soll).",
      afterAttempt4:
        "Probier sowas: 'Erstell aus diesen Meeting-Notizen ein Protokoll mit den Abschnitten " +
        "Themen, Entscheidungen und Aufgaben (mit Verantwortlichen). Format pro Aufgabe: " +
        "Aufgabe, dann Verantwortlich: Person. Notizen: ...' Fuege die rohen Notizen ein.",
    },
  },
];

export function getLevelById(id) {
  return LEVELS.find((l) => l.id === id);
}
