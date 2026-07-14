# CARE-Prompting-Lernspiel

Browserbasiertes Lernspiel fuers TCW-Fuehrungskraeftetraining, um das CARE-Prompting-Framework
(Context, Ask, Rules, Examples) erlebbar zu machen. Voller Hintergrund, Architektur-Entscheidungen
und Notfallplan: siehe **`.claude/plans/wir-bauen-ein-browserbasiertes-snuggly-aho.md`** (der
Umsetzungsplan, im Folgenden "PLAN" genannt).

## Aktueller Stand (2026-07-14)

Der komplette Code fuer Phase 1-3 (siehe PLAN Abschnitt 7) ist geschrieben:
- Backend (`functions/`): Proxy-Endpoint, Level-Config mit allen 5 Levels, Judge-Call mit
  Structured Outputs, Timeout/Retry, dreistufiges Hint-System.
- Frontend (`index.html`, `style.css`, `app.js`, `ui.js`): Single-Page-App mit KI-Lab-Branding,
  Level-Navigation, localStorage-Fortschritt.

**Noch NICHT gemacht (blockiert, siehe unten):**
- Phase 0 (Spike-Verifikation gegen die echte Anthropic-API) wurde noch nicht ausgefuehrt.
- Kein lokaler Testlauf (`wrangler pages dev`) durchgefuehrt.
- Kein Deploy.

Grund: Auf diesem Rechner war zum Zeitpunkt der Implementierung weder Node.js/npm noch ein
Anthropic-API-Key verfuegbar. Der Code ist vollstaendig geschrieben, aber **funktional
ungetestet** -- vor dem Event unbedingt Phase 0 + einen echten Testlauf nachholen (siehe
"Naechste Schritte" unten).

## Voraussetzungen

- Node.js LTS (fuer Wrangler/lokale Entwicklung -- das Backend selbst braucht kein npm-Paket,
  nur rohes `fetch()`)
- Ein Cloudflare-Account (neu anlegen reicht, kostenloses Konto genuegt -- siehe PLAN Abschnitt 2)
- Ein Anthropic-API-Key (idealerweise ein kurzlebiger Event-Key, siehe PLAN Abschnitt 9)

## Setup (lokal)

```sh
npm install
cp .dev.vars.example .dev.vars
# .dev.vars editieren und echten ANTHROPIC_API_KEY eintragen (Datei ist in .gitignore)
```

### Phase 0 zuerst: API-Grundannahme verifizieren

Bevor irgendetwas anderes getestet wird (PLAN Abschnitt 7, Phase 0 -- hartes, nicht
verhandelbares Erfolgskriterium):

```sh
# ANTHROPIC_API_KEY aus .dev.vars manuell exportieren oder direkt inline setzen:
ANTHROPIC_API_KEY=sk-ant-... npm run spike
```

Erwartete Ausgabe: `BESTANDEN: Beide Calls lieferten gueltiges JSON, pass-Werte stimmen wie
erwartet.` Falls nicht -- vor Phase 1/Weiterarbeit klaeren, siehe `scripts/spike.mjs`.

### Lokal starten

```sh
npm run dev
```

Startet `wrangler pages dev .` -- oeffnet das Spiel lokal inkl. Proxy-Endpoints. Wichtig beim
ersten Test (PLAN Abschnitt 7, Phase 1): im Browser-Netzwerk-Tab pruefen, dass der API-Key NIE
im Client sichtbar ist.

## Deploy (Cloudflare Pages)

1. Cloudflare-Account anlegen bzw. einloggen.
2. Neues Pages-Projekt erstellen, dieses Repo verbinden (oder `wrangler pages deploy .`
   direkt von hier aus).
3. Im Cloudflare-Dashboard unter Pages-Projekt -> Settings -> Environment Variables:
   `ANTHROPIC_API_KEY` als **Secret** setzen (nicht als normale Variable).
4. In der Anthropic Console ein Spend-Limit setzen (PLAN Abschnitt 6/8).
5. Deploy-Checkliste vor dem Event: siehe PLAN Abschnitt 8 (Firewall-Test **mehrere Tage**
   vorher, nicht erst morgens!).

## Level-Texte anpassen

Alle Level-Inhalte (Aufgabentext, Alex-Persona-Falle, versteckte Judge-Rubrik, Hinweise) liegen
zentral in `functions/_lib/levels.config.js`. Diese Datei ist die einzige Stelle, die fuer
inhaltliche Aenderungen angefasst werden muss -- kein Code-Wissen noetig, nur die Textfelder in
den `public`/`server`/`hints`-Objekten anpassen.

**Wichtig:** `levels.config.js` liegt unter `functions/_lib/` und wird NIE an den Client
ausgeliefert -- `functions/api/levels.js` extrahiert automatisch nur die `public`-Felder.

## Fallback fuer den Notfall (API down am Eventtag)

Falls die Anthropic-API am Eventtag komplett ausfaellt (siehe PLAN Abschnitt 8, Notfallplan):
kein automatischer Fallback im Code -- der Trainer bespricht die vorbereiteten
Beispielantworten muendlich statt live zu spielen. Beispielantworten pro Level koennen aus den
`placeholderExample`-Feldern in `levels.config.js` entnommen werden (das sind die "so sieht eine
schlechte Antwort aus"-Beispiele, die dem Spieler ohnehin angezeigt werden).

## Naechste Schritte (sobald Node.js + API-Key verfuegbar sind)

1. `npm install`, `.dev.vars` anlegen, `npm run spike` ausfuehren (Phase 0).
2. `npm run dev`, alle 5 Level manuell durchspielen (Phase 1/2 Testkriterien aus PLAN Abschnitt 7).
3. Hint-Eskalation testen: pro Level bewusst 2x und 4x falsch prompten (Phase 3 Testkriterium).
4. Fehlerfaelle testen: API-Key testweise ungueltig machen, Netzwerk verzoegern (Phase 4
   Testkriterium).
5. Finales Logo (`assets/logo.svg`, aktuell Platzhalter) durch die echte KI-Lab-Datei ersetzen.
6. Deploy + Generalprobe (Phase 5).
