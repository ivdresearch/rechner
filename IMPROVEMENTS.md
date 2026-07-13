# Improvements

_Stand: 2026-07-11, aktualisiert nach Sprint-Umsetzung (P1-001, P3-005)_

## Sprint-Ergebnis (Zusammenfassung)

Ein umfangreicher Sprint wurde umgesetzt (Details im Sprint-Plan). Kernergebnisse:

- **Keine externen CDNs mehr**: Bootstrap und jQuery werden auf allen vier HTML-Seiten (`rechner.html`, `einkaufsrechner.html`, `konfigurator.html`, `rechner_alt.html`) ausschließlich aus `static/` ausgeliefert. Verifiziert per Grep (keine `cdn.jsdelivr.net`/`code.jquery.com`-Referenzen mehr) und per lokalem HTTP-Server (alle Asset-Pfade liefern 200).
- **Bundesbank-Anbindung robuster**: `bundesbank_request()` nutzt jetzt `fetch()` mit Timeout statt synchronem `$.ajax`, kein blockierendes `alert()` mehr im Fehlerfall, Default-Zinssatz bleibt erhalten, Zinsvergleich wird bei fehlenden Daten ausgeblendet. Parsing härter (Observation-Key als Index, `parseFloat`, monatsindizierte Jahres-Arrays).
- **Rechenlogik konsolidiert**: Gemeinsame, DOM-freie Funktionen in `calc.js` extrahiert (`rueckzahlungsdauer`, `restschuld`, `belastung`, `leistbarkeit`, `einkauf`, `parseBundesbankResponse`), von beiden Rechnern genutzt.
- **13 automatisierte Tests** (`node --test`, keine npm-Abhängigkeiten) decken Annuität/Restschuld-Referenzwerte, alle dokumentierten Grenzfälle (Zinssatz 0, Tilgung 0, Einkommen 0, vollständige Tilgung) sowie den Bundesbank-Parser (durchgehend/Lücke/Nicht-Januar-Start) ab. CI via `.github/workflows/test.yml`.
- Diverse Korrektheits-Fixes (Zinsvergleich-Farblogik, Zahlenformatierung, tote Parameter) und Repo-Hygiene (`.idea` nicht mehr getrackt, Datenschutzerklärung dedupliziert).

**Wichtiger Hinweis zur Validierung:** In dieser Session stand kein verbundener Browser zur Verfügung. Die Änderungen wurden durch automatisierte Tests, `node --check` (Syntax) und einen lokalen HTTP-Server (Asset-Erreichbarkeit, HTML-Parsing) verifiziert — **nicht** durch manuelles Durchklicken im Browser. Vor dem Deployment sollte manuell geprüft werden:

1. Visuelle Regression auf `einkaufsrechner.html`, `konfigurator.html`, `rechner_alt.html` durch den Bootstrap-Versionssprung 5.2.3 → 5.3.3.
2. Bundesbank-Offline-Verhalten im echten Browser (DevTools-Netzwerk-Drosselung „Offline"): Default-Zinssatz 3.5, kein Alert, Vergleichskarten ausgeblendet.
3. Datenschutzerklärung: Collapse-Panel auf allen vier Seiten öffnen, Text muss per `fetch()` nachgeladen werden (erfordert echten HTTP-Server, nicht `file://`).

## Prioritätsübersicht

| Priorität | Anzahl | Schwerpunkt |
| --- | ---: | --- |
| P0 | 0 | – |
| P1 | 0 | - |
| P2 | 1 | Offene Design-Entscheidung URL-Parametrisierung — bewusst unverändert belassen |
| P3 | 0 | – |

## P0 — Kritisch

Keine bestätigten Befunde.

## P1 — Hoch

Keine bestätigten Befunde.

## P2 — Mittel

### [P2-005] Offene URL-Parametrisierung erlaubt Fremd-Branding unter der offiziellen Domain (Design-Entscheidung offen)

**Status:** Teilweise behoben
**Bereich:** Sicherheit
**Umgesetzt:** `logo_url` erfordert jetzt `https://`-Präfix, die doppelte `decodeURIComponent`-Anwendung wurde entfernt (`api_params.js`).
**Weiterhin offen:** Die eigentliche Design-Entscheidung — soll `titel` künftig mit einem festen Zusatz („– IVD Rechner") kombiniert oder die freie Betitelung als akzeptiertes Restrisiko dokumentiert bleiben? — ist eine Geschäfts-, keine reine Code-Entscheidung.
**Entscheidung (2026-07-11):** Nutzer hat entschieden, dass dieser Punkt so bleibt wie er ist — keine weitere Änderung geplant.
**Konfidenz:** Hoch

## P3 — Niedrig

Keine offenen Befunde. Ein zuvor offener Punkt wurde in diesem Sprint abgeschlossen:

### [P3-005] Altlasten im Deployment: `rechner_alt.html`/`rechner_alt.js` weiterhin öffentlich ausgeliefert (erledigt)

**Status:** Behoben (2026-07-11)
**Bereich:** Wartbarkeit
**Umgesetzt:** `rechner_alt.html` ist jetzt eine minimale Redirect-Seite (Meta-Refresh + `location.replace`) auf `rechner.html`, die Query-String und Hash unverändert weiterreicht — bestehende Kunden-Einbettungen mit `titel`/`bgcolor`/`boxcolor`/`logo_url` funktionieren dadurch unverändert weiter, laden aber die aktuelle Rechnerlogik. `rechner_alt.js` wurde entfernt (keine Referenz mehr vorhanden). Der reine Dev-Helfer `tools/extract_classes.py` (nirgends im Produktivcode referenziert) wurde ebenfalls entfernt, das gesamte `tools/`-Verzeichnis ist damit weg.
**Validierung:** `node --test` weiterhin 13/13 grün; lokaler HTTP-Server bestätigt `rechner_alt.html?titel=Test` liefert HTTP 200 und der `location.replace`-Aufruf reicht den Query-String an `rechner.html` weiter. Kein manueller Browser-Test der tatsächlichen Weiterleitung durchgeführt.
**Konfidenz:** Hoch

## Durchgeführte Prüfungen (Sprint-Umsetzung)

- `node --test`: 13/13 Tests grün (Annuität/Restschuld-Referenzwerte, Grenzfälle, Bundesbank-Parser-Varianten, numerischer Zinssatz-Vergleich)
- `node --check` auf allen geänderten JS-Dateien (Syntaxprüfung)
- Lokaler HTTP-Server: alle referenzierten lokalen Asset-Pfade (HTML, JS, `static/`, `partials/`) liefern HTTP 200
- HTML-Parsing-Check (Python `html.parser`) auf allen fünf HTML-Seiten: keine fatalen Parse-Fehler
- Grep-Verifikation: keine verbleibenden Referenzen auf `cdn.jsdelivr.net`, `code.jquery.com`, das alte Dateinamensschema `rechner_2024-06-24.js` oder den toten `footer=false`-Parameter
- Sprint P1-001/P3-005: `node --test` erneut 13/13 grün nach Entfernen von `rechner_alt.js`; lokaler HTTP-Server bestätigt `rechner_alt.html?titel=Test` → HTTP 200 mit `location.replace("rechner.html" + search + hash)`; Grep bestätigt keine verbleibenden Referenzen auf `rechner_alt.js` oder `tools/`

## Nicht geprüft / Grenzen dieser Sprint-Umsetzung

- **Visuelle/manuelle Browser-Prüfung**: In dieser Session war kein verbundener Browser verfügbar (siehe Hinweis oben). Insbesondere der Bootstrap-Versionssprung auf drei Seiten und das Bundesbank-Offline-Verhalten sollten vor Deployment manuell im Browser geprüft werden. Auch die tatsächliche Weiterleitung von `rechner_alt.html` wurde nicht in einem echten Browser (inkl. `meta refresh`-Fallback bei deaktiviertem JS) verifiziert.
- **GitHub-Pages-/Repo-Einstellungen**: weiterhin kein Zugriff aus dieser Umgebung.
- **Tatsächliche Kunden-Einbindungen**: weiterhin nur über Hoster-Statistiken feststellbar. Da der Redirect Query-String/Hash 1:1 weiterreicht, sollte eine Kunden-Einbettung von `rechner_alt.html` funktional unverändert bleiben — dies ist aber nicht mit echten Kundendaten getestet.
- **P1-001 (Token-Rotation)**: Nicht ausgeführt — siehe Hinweis im Befund, manuelle Schritte durch Nutzer erforderlich.
