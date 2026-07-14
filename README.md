# CARE-Prompting-Lernspiel

Browserbasiertes Lernspiel fuers TCW-Fuehrungskraeftetraining, um das CARE-Prompting-Framework
(Context, Ask, Rules, Examples) erlebbar zu machen. Voller Hintergrund, Architektur-Entscheidungen
und Notfallplan: siehe **`.claude/plans/wir-bauen-ein-browserbasiertes-snuggly-aho.md`** (der
Umsetzungsplan, im Folgenden "PLAN" genannt).

## Aktueller Stand (2026-07-14)

Der komplette Code fuer Phase 1-3 (siehe PLAN Abschnitt 7) ist geschrieben:
- Backend: ein Cloudflare-**Worker** (`worker.js` + `lib/`) mit Static-Assets-Binding -- Proxy-Endpoint,
  Level-Config mit allen 5 Levels, Judge-Call mit Structured Outputs, Timeout/Retry, dreistufiges
  Hint-System.
- Frontend (`public/index.html`, `style.css`, `app.js`, `ui.js`): Single-Page-App mit
  KI-Lab-Branding, Level-Navigation, localStorage-Fortschritt.

**Provider: OpenAI** (nicht Anthropic -- siehe PLAN-Changelog fuer die Begruendung des Wechsels).

**Architektur-Korrektur (2026-07-14, nach erstem fehlgeschlagenem Deploy):** Urspruenglich als
klassische Cloudflare-Pages-Functions geplant (Datei-basiertes Routing unter `functions/`).
Der erste Deploy-Versuch zeigte, dass Cloudflares Git-Integration inzwischen ueber "Workers
Builds" laeuft, das dieses Datei-Routing nicht unterstuetzt (`wrangler deploy` statt
`wrangler pages deploy`, Fehler "Missing entry-point"). Umgestellt auf das aktuell empfohlene
Modell: ein einzelner Worker-Entry-Point (`worker.js`) mit `[assets]`-Binding fuer die
statischen Dateien in `public/`. Siehe PLAN-Changelog fuer Details.

**Noch NICHT gemacht (blockiert, siehe unten):**
- Phase 0 (Spike-Verifikation gegen die echte OpenAI-API) wurde noch nicht ausgefuehrt.
- Kein Cloudflare-Projekt angelegt/verbunden, kein erfolgreicher Deploy.

Grund: Auf dem Entwicklungsrechner war zum Zeitpunkt der Implementierung kein Node.js verfuegbar.
Deploy laeuft daher ueber **Cloudflare Workers + Git-Integration** (Cloudflare baut/deployed
serverseitig bei jedem Push -- kein lokales Node/Wrangler noetig). Der Code ist vollstaendig
geschrieben, aber **funktional ungetestet** -- vor dem Event unbedingt Phase 0 + einen echten
Testlauf nachholen (siehe "Naechste Schritte" unten).

## Deploy ueber Cloudflare (Git-Integration, kein lokales Node noetig)

1. Cloudflare-Account anlegen bzw. einloggen.
2. "Workers & Pages" -> "Create application" -> Git-Repo verbinden (dieses GitHub-Repo).
3. Cloudflare erkennt `wrangler.toml` automatisch (Name, `main`, `[assets]`) -- keine manuellen
   Build-Einstellungen noetig. Deploy-Kommando ist automatisch `wrangler deploy`.
4. Unter Settings -> Variables and Secrets: **`OPENAI_API_KEY`** als **Secret** eintragen
   (nicht als normale Variable, und niemals ins Repo committen).
5. In der OpenAI-Plattform ein Spend-/Budget-Limit setzen.
6. Deploy-Checkliste vor dem Event: siehe PLAN Abschnitt 8 (Firewall-Test **mehrere Tage**
   vorher, nicht erst morgens! -- Domain: `api.openai.com`).

Jeder weitere `git push` auf den verbundenen Branch loest automatisch einen Redeploy aus.

## Lokales Setup (optional, braucht Node.js)

Nur noetig, wenn du **zusaetzlich** lokal testen willst (z.B. Phase-0-Spike vor dem ersten Deploy).
Fuer den eigentlichen Event-Betrieb ist das nicht erforderlich -- siehe Deploy-Abschnitt oben.

```sh
npm install
cp .dev.vars.example .dev.vars
# .dev.vars editieren und echten OPENAI_API_KEY eintragen (Datei ist in .gitignore)
```

### Phase 0: API-Grundannahme verifizieren

Bevor irgendetwas anderes getestet wird (PLAN Abschnitt 7, Phase 0 -- hartes, nicht
verhandelbares Erfolgskriterium):

```sh
OPENAI_API_KEY=sk-... npm run spike
```

Erwartete Ausgabe: `BESTANDEN: Beide Calls lieferten gueltiges JSON, pass-Werte stimmen wie
erwartet.` Falls nicht -- vor Weiterarbeit klaeren, siehe `scripts/spike.mjs`.

### Lokal starten

```sh
npm run dev
```

Startet `wrangler dev` -- oeffnet das Spiel lokal inkl. Worker-Routing (`/api/attempt`,
`/api/levels`) und Static Assets aus `public/`. Wichtig beim ersten Test: im
Browser-Netzwerk-Tab pruefen, dass der API-Key NIE im Client sichtbar ist.

## Level-Texte anpassen

Alle Level-Inhalte (Aufgabentext, Alex-Persona-Falle, versteckte Judge-Rubrik, Hinweise) liegen
zentral in `lib/levels.config.js`. Diese Datei ist die einzige Stelle, die fuer inhaltliche
Aenderungen angefasst werden muss -- kein Code-Wissen noetig, nur die Textfelder in den
`public`/`server`/`hints`-Objekten anpassen. Aenderung direkt im GitHub-Webeditor moeglich,
Cloudflare deployed danach automatisch neu.

**Wichtig:** `levels.config.js` liegt im `lib/`-Ordner (nicht in `public/`) und wird NIE an den
Client ausgeliefert -- `lib/levels.js` extrahiert programmatisch nur die `public`-Felder.

## Fallback fuer den Notfall (API down am Eventtag)

Falls die OpenAI-API am Eventtag komplett ausfaellt (siehe PLAN Abschnitt 8, Notfallplan): kein
automatischer Fallback im Code -- der Trainer bespricht die vorbereiteten Beispielantworten
muendlich statt live zu spielen. Beispielantworten pro Level koennen aus den
`placeholderExample`-Feldern in `lib/levels.config.js` entnommen werden (das sind die "so sieht
eine schlechte Antwort aus"-Beispiele, die dem Spieler ohnehin angezeigt werden).

## Naechste Schritte

1. Cloudflare-Projekt anlegen, mit diesem Repo verbinden, `OPENAI_API_KEY`-Secret setzen
   (siehe Deploy-Abschnitt oben) -- pruefen, dass der Deploy diesmal durchlaeuft.
2. Auf der deployten URL alle 5 Level manuell durchspielen (Phase 1/2 Testkriterien aus PLAN
   Abschnitt 7).
3. Hint-Eskalation testen: pro Level bewusst 2x und 4x falsch prompten (Phase 3 Testkriterium).
4. Fehlerfaelle testen: Secret testweise entfernen, Netzwerk verzoegern (Phase 4 Testkriterium).
5. Finales Logo (`public/assets/logo.svg`, aktuell Platzhalter) durch die echte KI-Lab-Datei
   ersetzen.
6. Deploy-Generalprobe (Phase 5): Lasttest, Komplettdurchlauf von einem Nicht-Entwickler-Geraet.
