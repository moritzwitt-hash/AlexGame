// VOLLSTAENDIGE Level-Definitionen (siehe PLAN Abschnitt 4/10) -- server-only.
// Wird NIE an den Client ausgeliefert. lib/levels.js extrahiert
// daraus programmatisch nur die public-Unterobjekte.
//
// Moritz editiert AUSSCHLIESSLICH diese Datei, um Level-Texte, Fallen-Setup,
// Judge-Rubrik oder Hinweise anzupassen -- ohne app.js oder die Endpoints
// zu beruehren.
//
// Wachsender Prompt (siehe PLAN-Changelog "Ein Prompt statt vier Teile"):
// Level 1-4 (cumulative: true) drehen sich alle um DASSELBE Szenario (die
// Kundenbeschwerde) -- jedes Level fuegt EINEN Teil des Prompts hinzu, die
// vorherigen Teile werden im Frontend nur noch angezeigt (nicht neu getippt).
// Der volle Prompt (alle bisherigen Teile + der neue) geht an Alex; das
// Backend/der Judge bekommt davon nichts mit -- fuer sie ist es einfach ein
// laengerer playerPrompt-String, die Judge-Kriterien pro Level bleiben
// unveraendert (siehe Abschnitt 5b). Level 5 (Boss) ist bewusst NICHT
// cumulative: ein komplett neues Szenario, das ohne Geruest alle vier
// CARE-Buchstaben auf einmal verlangt (Transferaufgabe).
//
// Jedes Level-Objekt:
//   id, order, careLetter, cumulative
//   public: { title, introText, goalText, placeholderExample, sourceMaterial?, email? }  -> geht an Client
//     placeholderExample: illustriert, wie Alex' Antwort OHNE die Loesung typischerweise aussieht
//     sourceMaterial: rohes Ausgangsmaterial, das der Spieler tatsaechlich braucht (z.B. Boss-
//       Level-Meeting-Notizen) -- wird im Frontend sichtbar als eigener Block angezeigt
//     email: { from, subject, body } -- feste Beschwerde-Mail fuer Level 1, wird im Frontend
//       als eigene, optisch klar erkennbare Mail-Karte angezeigt (siehe ui.js)
//   server: { alexPersonaAddendum, judgeRubric, missingElementLabel } -> bleibt im Backend
//   hints:  { afterAttempt1, afterAttempt2, afterAttempt4 } -- drei Eskalationsstufen
//           (siehe PLAN Abschnitt 5b: sanfter Wink -> expliziter CARE-Buchstabe ->
//           konkretes Beispiel-Snippet ab Versuch 4)

export const LEVELS = [
  {
    id: "L1_context",
    order: 1,
    careLetter: "C",
    cumulative: true,
    public: {
      title: "Level 1: Kontext",
      introText:
        "Der Chef hat Alex nur gesagt: 'Kuemmere dich um die Kundenbeschwerde.' Mehr weiss " +
        "er nicht. Die Mail, um die es geht, steht unten. Schau dir erstmal an, was bei Alex " +
        "dabei rauskommt.",
      goalText:
        "Sag Alex, aus wessen Sicht er das bearbeitet, zum Beispiel dass er im Auftrag des " +
        "Unternehmens antwortet. Nimm dann die Angaben aus der Mail unten in deinen Prompt " +
        "auf: wer schreibt, von welcher Firma, und worueber genau er sich beschwert. Ohne " +
        "diese Angaben kann Alex nur raten oder schreibt aus der falschen Perspektive.",
      placeholderExample:
        "Ich bin unzufrieden mit [Produkt] und moechte mich beschweren, weil [Problem] " +
        "aufgetreten ist.",
      email: {
        from: "Jonas Brandt <j.brandt@nordwind-logistik.de>",
        subject: "Wieder tagelang keine Antwort, Ticket #48213",
        body:
          "Hallo,\n\n" +
          "ich schreibe jetzt zum zweiten Mal, weil ich seit ueber einer Woche auf eine " +
          "Antwort von Ihrem Support warte. Mein Ticket (#48213) wurde am 3. Juli eroeffnet, " +
          "seitdem kam nur die automatische Eingangsbestaetigung.\n\n" +
          "Wir nutzen Ihre Software seit drei Jahren und hatten nie Probleme mit dem Produkt " +
          "selbst, aber die Reaktionszeiten im Support sind mittlerweile wirklich nicht mehr " +
          "akzeptabel. Bei einem dringenden Problem kann ich nicht tagelang auf Rueckmeldung " +
          "warten.\n\n" +
          "Ich wuerde mir wuenschen, dass sich zeitnah jemand meldet. Sonst muss ich das " +
          "intern eskalieren.\n\n" +
          "Viele Gruesse\n" +
          "Jonas Brandt\n" +
          "Nordwind Logistik GmbH",
      },
    },
    server: {
      alexPersonaAddendum:
        "Dein Chef hat dir nur gesagt: 'Kuemmere dich um die Kundenbeschwerde.' Wenn der " +
        "Prompt nicht ausdruecklich klarstellt, dass DU (Alex) im Auftrag des Unternehmens " +
        "antwortest, gehst du davon aus, dass DU SELBST der Kunde bist, der sich beschwert, " +
        "und schreibst die Nachricht konsequent aus dessen Ich-Perspektive (z.B. 'Ich bin " +
        "unzufrieden mit...', 'Meine Bestellung...'), nicht aus der Perspektive von jemandem, " +
        "der die Beschwerde bearbeitet. Zusaetzlich gilt eine HARTE, AUSNAHMSLOSE Regel: Fuer " +
        "JEDE einzelne Information, die nicht WOERTLICH und KONKRET im Prompt des Nutzers " +
        "steht (z.B. Kundenname, Produktname, das konkrete Problem), setzt du IMMER einen " +
        "Platzhalter in eckigen Klammern ein, z.B. [Name], [Produkt], [Problem]. Du erfindest " +
        "NIEMALS einen plausibel klingenden Namen oder ein Detail aus eigener Initiative, " +
        "auch nicht, um hilfreich oder professionell zu wirken. Das waere ein Regelverstoss. " +
        "Du fragst auch NICHT nach. Diese Regeln gelten ohne Ausnahme.",
      judgeRubric:
        "PASS NUR, wenn die Antwort ALLE der folgenden Bedingungen zweifelsfrei erfuellt: " +
        "(1) KEIN Platzhalter-Muster vorhanden (eckige/geschweifte Klammern, XXX, Unterstriche " +
        "als Luecken-Fueller), (2) konkrete Namen/Produkte/Details sind vorhanden, UND (3) die " +
        "Antwort ist erkennbar aus der Perspektive von jemandem geschrieben, der die " +
        "Beschwerde im Auftrag des Unternehmens bearbeitet (z.B. 'wir', 'ich kuemmere mich " +
        "darum', Beschreibung des Kunden in dritter Person), NICHT aus der Ich-Perspektive " +
        "des sich beschwerenden Kunden selbst ('ich bin unzufrieden', 'meine Bestellung'). " +
        "FAIL, wenn mindestens eine Bedingung nicht erfuellt ist oder die Perspektive unklar " +
        "oder vermischt ist. Im Zweifel: FAIL.",
      missingElementLabel: "context",
    },
    hints: {
      afterAttempt1:
        "Schau dir Alex' Antwort nochmal an. Aus wessen Sicht ist sie eigentlich geschrieben, " +
        "und was fehlt ihm, um wirklich zu wissen, worum es geht, statt zu raten?",
      afterAttempt2:
        "Dir fehlt das C aus CARE: Context. Sag Alex, dass er im Auftrag des Unternehmens " +
        "antwortet, und erzaehl ihm, was passiert ist: welcher Kunde, welches Produkt, " +
        "welches Problem.",
      afterAttempt4:
        "Probier sowas: 'Du bearbeitest das im Namen unseres Unternehmens. Der Kunde heisst " +
        "[Name], hat [Produkt] gekauft und beschwert sich, weil [Problem].' Ersetz die " +
        "Klammern durch echte Angaben.",
    },
  },

  {
    id: "L2_ask",
    order: 2,
    careLetter: "A",
    cumulative: true,
    public: {
      title: "Level 2: Ask",
      introText:
        "Jetzt kennt Alex die Fakten. Trotzdem antwortet er direkt dem Kunden, mit " +
        "Entschuldigung und allem. Das Problem: wir brauchen einen Plan fuers Team, keine " +
        "Nachricht an den Kunden.",
      goalText:
        "Sag Alex klar, fuer wen die Antwort ist (das Team, nicht der Kunde) und was du " +
        "willst: konkrete naechste Schritte statt einer Mail an den Kunden.",
      placeholderExample:
        "Sehr geehrte Kundin, es tut uns sehr leid, dass Sie mit unserem Service unzufrieden " +
        "waren. Wir schaetzen Ihr Feedback sehr und werden uns umgehend darum kuemmern...",
    },
    server: {
      alexPersonaAddendum:
        "Solange der Prompt nicht ausdruecklich sagt, dass das Ergebnis ein interner Text " +
        "fuer das Team sein soll, gehst du automatisch davon aus, dass du direkt dem Kunden " +
        "antworten sollst: du schreibst grundsaetzlich eine freundliche, entschuldigende " +
        "E-Mail-Antwort MIT ANREDE AN DEN KUNDEN (z.B. 'Sehr geehrte(r) Kunde/Kundin') und " +
        "einer Gruszformel. Du erwaehnst nirgends, dass du unsicher bist, wer das lesen soll. " +
        "Du triffst diese Annahme stillschweigend.",
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
        "Probier sowas: 'Schreib das als interne Nachricht ans Team, nicht als Antwort an den " +
        "Kunden, mit konkreten naechsten Schritten.'",
    },
  },

  {
    id: "L3_rules",
    order: 3,
    careLetter: "R",
    cumulative: true,
    public: {
      title: "Level 3: Rules",
      introText:
        "Jetzt schreibt Alex endlich die richtige interne Nachricht. Nur ist sie ellenlang, " +
        "voller Emojis, und hoert einfach auf, ohne zu sagen, was als Naechstes passiert.",
      goalText:
        "Gib Alex klare Regeln fuer Laenge, Ton und Aufbau. Ziel: maximal 80 Woerter, keine " +
        "Emojis, ein klarer Aufruf zum Handeln am Ende.",
      placeholderExample:
        "Hey Team! 🎉 Also, wir haben da eine Beschwerde reinbekommen und ich wollte euch mal " +
        "ganz ausfuehrlich auf den neuesten Stand bringen... 😊 (und so weiter, sehr lang, " +
        "ohne klaren naechsten Schritt)",
    },
    server: {
      alexPersonaAddendum:
        "Ohne ausdrueckliche Vorgaben zu Laenge, Ton oder Format schreibst du die interne " +
        "Nachricht ausfuehrlich (mindestens 150 Woerter), locker mit mehreren passenden " +
        "Emojis, und laesst sie ohne eine klare abschliessende Handlungsaufforderung " +
        "(Call-to-Action) einfach auslaufen.",
      judgeRubric:
        "FAIL bei mehr als 80 Woertern ODER Emoji-Vorkommen ODER fehlendem Call-to-Action am " +
        "Ende. PASS, wenn alle drei Bedingungen erfuellt sind (max. 80 Woerter, keine Emojis, " +
        "klarer CTA).",
      missingElementLabel: "rules",
    },
    hints: {
      afterAttempt1:
        "Lies dir Alex' Nachricht durch. Ist sie so kurz und klar, wie du es dir wuenschst?",
      afterAttempt2:
        "Dir fehlt das R aus CARE: Rules. Gib Alex klare Formatregeln: maximale Wortzahl, " +
        "keine Emojis, ein klarer Aufruf zum Handeln am Ende.",
      afterAttempt4:
        "Probier sowas: 'Halte es unter 80 Woertern, keine Emojis, und beende es mit einem " +
        "klaren naechsten Schritt.'",
    },
  },

  {
    id: "L4_examples",
    order: 4,
    careLetter: "E",
    cumulative: true,
    public: {
      title: "Level 4: Examples",
      introText:
        "Das Team hat einen festen Kurzstil fuer solche internen Notizen. Beschreiben laesst " +
        "der sich kaum, zeigen schon. Gib Alex ein Beispiel, dann uebernimmt er den Stil.",
      goalText:
        "Schreib mindestens eine Beispielzeile im Zielstil in deinen Prompt: beginnt mit " +
        "einem Pfeil (→), endet ohne Punkt, maximal sechs Woerter. Sag Alex auch ausdruecklich, " +
        "dass die GESAMTE Antwort nur aus solchen Zeilen bestehen soll, ohne Einleitung oder " +
        "Abschluss davor oder danach. Alex uebernimmt den Stil nur, wenn er ihn sieht, nicht " +
        "wenn du ihn beschreibst.",
      placeholderExample:
        "Kunde ist unzufrieden, bitte zeitnah nachfassen und Rueckmeldung geben.",
    },
    server: {
      alexPersonaAddendum:
        "Du hast keinen festen Schreibstil: du schreibst standardmaessig in normalen, " +
        "vollstaendigen Saetzen mit Satzzeichen und gelegentlichen Adjektiven. Nur wenn der " +
        "Prompt dir mindestens eine konkrete Beispielzeile im gewuenschten Zielstil vorgibt, " +
        "uebernimmst du exakt dieses Stilmuster fuer deine gesamte Antwort (inklusive " +
        "Zeilenanfang, Satzzeichen-Verzicht und Wortzahl-Begrenzung), ohne das Muster zu " +
        "beschreiben oder zu kommentieren. WICHTIG: Solange der Prompt dir nicht ausdruecklich " +
        "sagt, dass die GESAMTE Antwort nur aus solchen Zeilen bestehen soll (ohne Einleitung, " +
        "ohne Betreffzeile, ohne abschliessende Bemerkung), fuegst du als hilfsbereiter " +
        "Werkstudent trotzdem eine kurze hoefliche Einleitung wie 'Hier die Notiz:' oder einen " +
        "Abschlusssatz hinzu, auch wenn du sonst den Stil der Beispielzeile befolgst. Erst " +
        "eine explizite Anweisung, KEINEN zusaetzlichen Text davor oder danach zu schreiben, " +
        "unterdrueckt dieses Verhalten.",
      judgeRubric:
        "PASS, wenn OHNE JEDE AUSNAHME jede einzelne Zeile der Antwort (auch eine etwaige " +
        "Einleitungs-, Betreff- oder Abschlusszeile) mit '→ ' beginnt, kein Satzzeichen am " +
        "Zeilenende steht, und keine Zeile mehr als 6 Woerter hat. FAIL, wenn auch nur eine " +
        "einzige Zeile davon abweicht, z.B. eine Begruessung, ein Titel oder ein Schlusssatz " +
        "ohne Pfeil. Im Zweifel: FAIL.",
      missingElementLabel: "examples",
    },
    hints: {
      afterAttempt1:
        "Schau dir Alex' Antwort ganz genau an, Zeile fuer Zeile. Steht da wirklich ueberall " +
        "nur der Kurzstil, oder hat sich irgendwo eine normale Zeile eingeschlichen?",
      afterAttempt2:
        "Dir fehlt das E aus CARE: Examples. Zeig Alex mindestens eine Beispielzeile im " +
        "Zielformat, und sag ihm ausdruecklich, dass die GESAMTE Antwort nur aus solchen " +
        "Zeilen bestehen soll, ohne Einleitung oder Abschluss.",
      afterAttempt4:
        "Probier sowas: 'Schreib deine gesamte Antwort nur in diesem Stil, ohne Einleitung " +
        "oder Abschlusssatz:\n→ Kunde kontaktieren\n→ Rueckmeldung einholen'",
    },
  },

  {
    id: "L5_boss",
    order: 5,
    careLetter: "BOSS",
    cumulative: false,
    public: {
      title: "Level 5: Boss",
      introText:
        "Kein Geruest mehr. Ein chaotisches Meeting ist vorbei, hier sind Alex' rohe " +
        "Notizen. Mach daraus ein Protokoll, das jemand nutzen kann, der nicht dabei war. " +
        "Diesmal schreibst du den ganzen Prompt selbst, mit allem, was du gelernt hast.",
      goalText:
        "Kopier die Notizen unten in deinen Prompt und baue drumherum alle vier " +
        "CARE-Buchstaben gleichzeitig: gib Kontext, sag klar was rauskommen soll (ein " +
        "Protokoll, keine Zusammenfassung), gib eine Struktur vor (zum Beispiel Themen, " +
        "Entscheidungen, Aufgaben) und zeig bei Bedarf, wie eine gute Zeile aussieht.",
      sourceMaterial:
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
        "Schau dir Alex' Protokoll an. Koennte jemand, der nicht im Meeting war, sofort " +
        "erkennen, WER sich um welche Aufgabe kuemmert, nicht nur WAS zu tun ist?",
      afterAttempt2:
        "Hier brauchst du alle vier CARE-Buchstaben gleichzeitig: Context (worum ging's im " +
        "Meeting), Ask (ein strukturiertes Protokoll fuers Team, keine Zusammenfassung), Rules " +
        "(feste Abschnitte Themen/Entscheidungen/Aufgaben UND dass jede Aufgabe eine " +
        "verantwortliche Person nennt) und Examples (zeig, wie so eine Zeile aussehen soll).",
      afterAttempt4:
        "Probier sowas: 'Erstell aus diesen Meeting-Notizen ein Protokoll mit den Abschnitten " +
        "Themen, Entscheidungen und Aufgaben. Jede Aufgabe nennt eine verantwortliche Person " +
        "oder Rolle, Format pro Aufgabe: Aufgabe, dann Verantwortlich: Person. Notizen: ...' " +
        "Fuege die rohen Notizen ein.",
    },
  },
];

export function getLevelById(id) {
  return LEVELS.find((l) => l.id === id);
}
