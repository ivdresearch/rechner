const { test } = require("node:test");
const assert = require("node:assert/strict");
const IvdCalc = require("../calc.js");

test("rueckzahlungsdauer: Annuitätendarlehen mit Zinssatz > 0", () => {
    // 300.000 Kredit, 2% Zins, 2% Tilgung -> Annuität pm = 300000*0.04/12 = 1000
    let jahre = IvdCalc.rueckzahlungsdauer(300000, 1000, 0.02);
    assert.ok(jahre > 30 && jahre < 40, "erwartete Rückzahlungsdauer zwischen 30 und 40 Jahren, war " + jahre);
});

test("rueckzahlungsdauer: Zinssatz 0 wird linear berechnet, kein NaN (P2-003)", () => {
    // 120.000 Kredit, Annuität 1000/Monat, 0% Zins -> 120 Monate = 10 Jahre
    let jahre = IvdCalc.rueckzahlungsdauer(120000, 1000, 0);
    assert.equal(jahre, 10);
    assert.ok(!Number.isNaN(jahre));
});

test("restschuld: Referenzwerte nach 5/10/15 Jahren bei normalem Zinssatz", () => {
    let fremdkapital = 300000;
    let tilgungssatz = 0.02;
    let zinssatz = 0.035;
    let rs5 = IvdCalc.restschuld(fremdkapital, tilgungssatz, zinssatz, 5);
    let rs10 = IvdCalc.restschuld(fremdkapital, tilgungssatz, zinssatz, 10);
    let rs15 = IvdCalc.restschuld(fremdkapital, tilgungssatz, zinssatz, 15);
    // Restschuld muss mit der Zeit monoton sinken und unter dem Ausgangskredit liegen
    assert.ok(rs5 < fremdkapital);
    assert.ok(rs10 < rs5);
    assert.ok(rs15 < rs10);
    assert.ok(rs15 >= 0);
});

test("restschuld: Zinssatz 0 wird linear (nicht NaN/-Infinity) berechnet (P2-003)", () => {
    // 100.000 Kredit, 10% Tilgung p.a., 0% Zins -> nach 5 Jahren: 100000 - 100000*0.1*5 = 50000
    let rs = IvdCalc.restschuld(100000, 0.10, 0, 5);
    assert.equal(rs, 50000);
    assert.ok(Number.isFinite(rs));
});

test("restschuld: wird bei vollständiger Tilgung auf 0 gedeckelt, nie negativ (P2-003)", () => {
    // hohe Tilgung: Kredit ist nach wenigen Jahren getilgt -> Restschuld darf nicht negativ werden
    let rs = IvdCalc.restschuld(50000, 0.20, 0.03, 15);
    assert.ok(rs >= 0, "Restschuld darf nicht negativ sein, war " + rs);
});

test("belastung: Grenzfall Tilgungssatz 0 erzeugt keinen NaN in den Kernwerten (P2-003)", () => {
    let ergebnis = IvdCalc.belastung({
        preis: 429000,
        nebenkosten_prozent: 12.07,
        eigenkapital_eingabe: 15,
        eigenkapital_ist_prozent: true,
        einkommen_jahr: 45000,
        zinssatz_prozent: 0.035,
        tilgungssatz_prozent: 0,
    });
    // rueckzahlungsdauer ist bei Tilgung 0 mathematisch nicht sinnvoll (Kredit wird nie getilgt);
    // die UI blockiert diesen Fall separat per Validierung, aber calc.js selbst darf nicht crashen.
    assert.ok(Number.isFinite(ergebnis.fremdkapital));
    assert.ok(Number.isFinite(ergebnis.kreditbelastung_pm));
});

test("belastung: Grenzfall Einkommen 0 erzeugt Infinity statt Crash (Validierung erfolgt in der UI-Schicht)", () => {
    let ergebnis = IvdCalc.belastung({
        preis: 429000,
        nebenkosten_prozent: 12.07,
        eigenkapital_eingabe: 15,
        eigenkapital_ist_prozent: true,
        einkommen_jahr: 0,
        zinssatz_prozent: 0.035,
        tilgungssatz_prozent: 0.02,
    });
    assert.equal(ergebnis.kreditbelastung_anteilig, Infinity);
});

test("leistbarkeit: liefert plausiblen Kaufpreis für Standardwerte", () => {
    let ergebnis = IvdCalc.leistbarkeit({
        nebenkosten_prozent: 12.07,
        eigenkapital: 100000,
        eigenkapital_anteil_prozent: 20,
        einkommenbelastung_prozent: 30,
        einkommen_jahr: 45000,
        zinssatz_prozent: 0.035,
        tilgungssatz_prozent: 0.02,
    });
    assert.ok(ergebnis.kaufpreis > 0);
    assert.ok(ergebnis.fremdkapital > 0);
});

test("einkauf: liefert numerischen (nicht formatierten) Zinssatz für Vergleiche (P2-001)", () => {
    let hoch = IvdCalc.einkauf({
        nebenkosten_prozent: 0.1207,
        kreditbelastung_pm: 1500,
        zinssatz_prozent: 0.102,
        tilgungssatz_prozent: 0.02,
        eigenkapital: 100000,
        betriebskosten: 300,
    });
    let niedrig = IvdCalc.einkauf({
        nebenkosten_prozent: 0.1207,
        kreditbelastung_pm: 1500,
        zinssatz_prozent: 0.098,
        tilgungssatz_prozent: 0.02,
        eigenkapital: 100000,
        betriebskosten: 300,
    });
    assert.equal(typeof hoch.zinssatz_prozent, "number");
    // zweistellige Prozentwerte (10,2 % vs. 9,8 %): ein String-Vergleich der alten Formatierung
    // ("10,20 %" < "9,80 %") wäre hier falsch gewesen. Der numerische Vergleich muss stimmen.
    assert.ok(hoch.zinssatz_prozent > niedrig.zinssatz_prozent);
});

function sampleBundesbankResponse(startPeriod, values) {
    return {
        data: {
            dataSets: [
                {
                    series: {
                        "0:0:0:0:0:0:0:0:0": {
                            observations: Object.fromEntries(
                                values.map((wert, i) => [String(i), [String(wert)]])
                            ),
                        },
                    },
                },
            ],
            structure: {
                dimensions: {
                    observation: [
                        {
                            id: "TIME_PERIOD",
                            values: startPeriod.map((id) => ({ id: id })),
                        },
                    ],
                },
            },
        },
    };
}

test("parseBundesbankResponse: durchgehende Zeitreihe ab Januar", () => {
    let body = sampleBundesbankResponse(
        ["2024-01", "2024-02", "2024-03"],
        [3.50, 3.60, 3.70]
    );
    let result = IvdCalc.parseBundesbankResponse(body);
    assert.deepEqual(result.zinsen[2024], [3.50, 3.60, 3.70]);
    assert.equal(result.neuester, 3.70);
});

test("parseBundesbankResponse: Zeitreihe mit Lücke bricht nicht (P2-004)", () => {
    let body = sampleBundesbankResponse(
        ["2024-01", "2024-02", "2024-03"],
        [3.50, 3.70]
    );
    // Observation für Index 1 (Februar) fehlt in der API-Antwort -> nur Keys "0" und "1" simulieren,
    // hier wird bewusst nur ein Key uebersprungen, indem die Observations direkt gebaut werden.
    body.data.dataSets[0].series["0:0:0:0:0:0:0:0:0"].observations = {
        "0": ["3.50"],
        "2": ["3.70"],
    };
    let result = IvdCalc.parseBundesbankResponse(body);
    assert.equal(result.zinsen[2024][0], 3.50);
    assert.equal(result.zinsen[2024][1], undefined);
    assert.equal(result.zinsen[2024][2], 3.70);
    assert.equal(result.neuester, 3.70);
});

test("parseBundesbankResponse: Zeitreihe startet nicht im Januar, kein TypeError (P2-004)", () => {
    let body = sampleBundesbankResponse(
        ["2024-07", "2024-08", "2024-09"],
        [3.10, 3.20, 3.30]
    );
    let result = IvdCalc.parseBundesbankResponse(body);
    assert.equal(result.zinsen[2024][6], 3.10);
    assert.equal(result.zinsen[2024][7], 3.20);
    assert.equal(result.zinsen[2024][8], 3.30);
    assert.equal(result.neuester, 3.30);
});

test("parseBundesbankResponse: leere Observations liefert leeres Ergebnis statt Crash", () => {
    let body = sampleBundesbankResponse([], []);
    let result = IvdCalc.parseBundesbankResponse(body);
    assert.deepEqual(result.zinsen, {});
    assert.equal(result.neuester, null);
});
