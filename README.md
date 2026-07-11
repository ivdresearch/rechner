# IVD Rechner

Statische, per iframe einbettbare Rechner rund um Immobilienfinanzierung. Kein Build-Schritt, kein Server-Backend — alle Berechnungen laufen clientseitig im Browser.

Siehe [LICENSE](LICENSE) für die Nutzungsbedingungen.

## Komponenten

### Leistbarkeitsrechner
`rechner.html` + `calc.js` + `rechner.js`

Berechnet wahlweise die monatliche Belastung für einen gegebenen Kaufpreis oder den leistbaren Kaufpreis für ein gegebenes Budget.

### Einkaufsrechner
`einkaufsrechner.html` + `calc.js` + `einkaufsrechner.js`

Ermittelt Kaufpreis und Kredithöhe aus der verfügbaren monatlichen Rate und vergleicht das Ergebnis optional mit historischen Referenzzinsen der Deutschen Bundesbank (Zeitreihe [BBIM1/SUD118](https://api.statistiken.bundesbank.de/rest/data/BBIM1/M.DE.B.A2C.O.R.A.2250.EUR.N?detail=dataonly), Effektivzins für Wohnungsbaukredite an private Haushalte). Der Abruf erfolgt beim Laden der Seite; ist die API nicht erreichbar, wird ein Standardzinssatz verwendet und der Zinsvergleich ausgeblendet, statt die Seite unbenutzbar zu machen.

### Rechner-Konfigurator
`konfigurator.html` + `konfigurator.js`

Erzeugt die Einbettungs-URL (inkl. `<iframe>`-Snippet) für Leistbarkeits- oder Einkaufsrechner mit den unten beschriebenen URL-Parametern.

### Gemeinsame Bausteine
- `calc.js`: DOM-freie Rechenlogik (Annuität, Restschuld, Belastung/Leistbarkeit, Bundesbank-Parsing), gemeinsam genutzt von Leistbarkeits- und Einkaufsrechner und von der Testsuite.
- `api_params.js`: wertet die unten beschriebenen URL-Parameter aus (Titel, Farben, Logo).

## URL-Parameter

Alle Rechner-Seiten akzeptieren folgende Query-Parameter zur individuellen Einbettung:

| Parameter | Beispiel | Wirkung |
| --- | --- | --- |
| `titel` | `titel=Meine%20Baufinanzierung` | Überschreibt die Überschrift |
| `bgcolor` | `bgcolor=%23f0f0f0` | Hintergrundfarbe der Seite (Hex, `#rrggbb`) |
| `boxcolor` | `boxcolor=%23ffffff` | Hintergrundfarbe der Inhaltsboxen (Hex, `#rrggbb`) |
| `logo_url` | `logo_url=https%3A%2F%2F...` | Eigenes Logo neben der Überschrift; muss mit `https://` beginnen |

Diese Parameter sind frei setzbar (nicht auf Kunden beschränkt) — die Rechner-Domain kann damit fremdgebrandet werden. Das ist eine bewusste Designentscheidung für die iframe-Einbettung durch Kunden, siehe `IMPROVEMENTS.md` für die Abwägung.

## Lokale Bibliotheken

Bootstrap (`static/bootstrap_5-3-3/`) und jQuery (`static/jquery-3.7.1.min.js`) werden vollständig aus dem Repository ausgeliefert statt von einem externen CDN geladen. Das reduziert das Lieferketten-Risiko für die in Kunden-Websites eingebetteten Rechner und macht die Seiten unabhängig von der Verfügbarkeit externer CDNs.

## Cache-Busting

Bei Änderungen an `rechner.js` die Versionsnummer im zugehörigen `<script src="rechner.js?v=...">`-Tag in `rechner.html` erhöhen, statt die Datei umzubenennen.

## Tests

`calc.js` wird über Node's eingebauten Test-Runner getestet (keine npm-Abhängigkeiten nötig):

```
node --test
```

Ein GitHub-Actions-Workflow (`.github/workflows/test.yml`) führt die Tests bei jedem Push/PR aus.

## Deployment

Deployment erfolgt statisch über GitHub Pages aus diesem Repository.
