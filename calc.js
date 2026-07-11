/**
 * Gemeinsame, DOM-freie Rechenlogik für Leistbarkeitsrechner und Einkaufsrechner.
 * Kein Bundler, kein externer Code: einfaches globales Namespace-Objekt (Browser)
 * bzw. module.exports (Node, für Tests).
 */
(function (global) {
    "use strict";

    function rueckzahlungsdauer(kredit, annuitaet, zinssatz) {
        if (zinssatz === 0) {
            return kredit / (annuitaet * 12);
        }
        let zinssatz_monat = zinssatz / 12;
        return ((Math.log(annuitaet) - Math.log(annuitaet - (zinssatz_monat * kredit))) / Math.log(1 + zinssatz_monat)) / 12;
    }

    function restschuld(fremdkapital, tilgungssatz, zinssatz, jahre) {
        let rest;
        if (zinssatz === 0) {
            rest = fremdkapital - (fremdkapital * tilgungssatz * jahre);
        } else {
            let tilgung_monat1 = fremdkapital * tilgungssatz / 12;
            rest = fremdkapital - ((tilgung_monat1 * (((1 + zinssatz / 12) ** (jahre * 12)) - 1)) / (zinssatz / 12));
        }
        return Math.max(0, rest);
    }

    /**
     * Monatliche Belastung für einen gegebenen Kaufpreis (Leistbarkeitsrechner).
     * @param inputs {{preis:number, nebenkosten_prozent:number, eigenkapital_eingabe:number,
     *   eigenkapital_ist_prozent:boolean, einkommen_jahr:number, zinssatz_prozent:number, tilgungssatz_prozent:number}}
     */
    function belastung(inputs) {
        let gesamtkosten = inputs.preis * ((100 + inputs.nebenkosten_prozent) / 100);
        let nebenkosten_summe = gesamtkosten - inputs.preis;

        let fremdkapital;
        let eigenkapital;
        if (inputs.eigenkapital_ist_prozent) {
            fremdkapital = inputs.preis * ((100 - inputs.eigenkapital_eingabe) / 100);
            eigenkapital = gesamtkosten - fremdkapital;
        } else {
            eigenkapital = inputs.eigenkapital_eingabe;
            fremdkapital = gesamtkosten - eigenkapital;
        }
        let beleihungsauslauf = (fremdkapital / inputs.preis) * 100;

        let kreditbelastung_pa = fremdkapital * (inputs.zinssatz_prozent + inputs.tilgungssatz_prozent);
        let kreditbelastung_pm = kreditbelastung_pa / 12;
        let kreditbelastung_anteilig = kreditbelastung_pa * 100 / inputs.einkommen_jahr;
        let dauer = rueckzahlungsdauer(fremdkapital, kreditbelastung_pm, inputs.zinssatz_prozent);

        if (fremdkapital <= 0) {
            fremdkapital = 0;
            dauer = 0;
            kreditbelastung_pa = 0;
            kreditbelastung_pm = 0;
            kreditbelastung_anteilig = 0;
            beleihungsauslauf = 0;
        }

        return {
            gesamtkosten: gesamtkosten,
            nebenkosten_summe: nebenkosten_summe,
            fremdkapital: fremdkapital,
            eigenkapital: eigenkapital,
            beleihungsauslauf: beleihungsauslauf,
            kreditbelastung_pa: kreditbelastung_pa,
            kreditbelastung_pm: kreditbelastung_pm,
            kreditbelastung_anteilig: kreditbelastung_anteilig,
            rueckzahlungsdauer: dauer,
        };
    }

    /**
     * Maximaler Kaufpreis für gegebene Budgetvorgaben (Leistbarkeitsrechner).
     * @param inputs {{nebenkosten_prozent:number, eigenkapital:number, eigenkapital_anteil_prozent:number,
     *   einkommenbelastung_prozent:number, einkommen_jahr:number, zinssatz_prozent:number, tilgungssatz_prozent:number}}
     */
    function leistbarkeit(inputs) {
        let fremdkapital_anteil = 100 - inputs.eigenkapital_anteil_prozent;
        let annuitaet_max = inputs.einkommen_jahr * (inputs.einkommenbelastung_prozent / 100);
        let fremdkapital_v1 = annuitaet_max / (inputs.zinssatz_prozent + inputs.tilgungssatz_prozent);
        let fremdkapital_v2 = (inputs.eigenkapital * (fremdkapital_anteil / 100)) / ((inputs.nebenkosten_prozent + inputs.eigenkapital_anteil_prozent) / 100);
        let fremdkapital = Math.min(fremdkapital_v1, fremdkapital_v2);

        let gesamtkosten = inputs.eigenkapital + fremdkapital;
        let kaufpreis = gesamtkosten / (1 + (inputs.nebenkosten_prozent / 100));
        let eigenkapital_anteil_final = (1 - (fremdkapital / kaufpreis)) * 100;
        let annuitaet_pa = fremdkapital * (inputs.zinssatz_prozent + inputs.tilgungssatz_prozent);
        let annuitaet_pm = annuitaet_pa / 12;
        let einkommenbelastung_final = (annuitaet_pa / inputs.einkommen_jahr) * 100;
        let dauer = rueckzahlungsdauer(fremdkapital, annuitaet_pm, inputs.zinssatz_prozent);

        return {
            kaufpreis: kaufpreis,
            gesamtkosten: gesamtkosten,
            fremdkapital: fremdkapital,
            eigenkapital_anteil_final: eigenkapital_anteil_final,
            annuitaet_pa: annuitaet_pa,
            annuitaet_pm: annuitaet_pm,
            einkommenbelastung_final: einkommenbelastung_final,
            rueckzahlungsdauer: dauer,
        };
    }

    /**
     * Kaufpreis/Kredithöhe aus verfügbarer monatlicher Belastung (Einkaufsrechner).
     * @param inputs {{nebenkosten_prozent:number, kreditbelastung_pm:number, zinssatz_prozent:number,
     *   tilgungssatz_prozent:number, eigenkapital:number, betriebskosten:number}}
     */
    function einkauf(inputs) {
        let fremdkapital = (inputs.kreditbelastung_pm * 12) / (inputs.zinssatz_prozent + inputs.tilgungssatz_prozent);
        let gesamtkosten = fremdkapital + inputs.eigenkapital;
        let preis = gesamtkosten / (1 + inputs.nebenkosten_prozent);
        let dauer = rueckzahlungsdauer(fremdkapital, inputs.kreditbelastung_pm, inputs.zinssatz_prozent);
        let eigenkapital_anteilig = 1 - (fremdkapital / preis);
        let eigenkapital_anteilig_warning = false;
        if (eigenkapital_anteilig < 0) {
            eigenkapital_anteilig = 0;
            eigenkapital_anteilig_warning = true;
        }

        return {
            preis: preis,
            gesamtkosten: gesamtkosten,
            fremdkapital: fremdkapital,
            rueckzahlungsdauer: dauer,
            eigenkapital_anteilig: eigenkapital_anteilig,
            eigenkapital_anteilig_warning: eigenkapital_anteilig_warning,
            zinssatz_prozent: inputs.zinssatz_prozent,
            betriebskosten_gesamt: inputs.betriebskosten + inputs.kreditbelastung_pm,
        };
    }

    /**
     * Parst die SDMX-JSON-Antwort der Bundesbank-API (Zeitreihe BBIM1/SUD118) defensiv:
     * Observation-Schlüssel wird direkt als Index in die Datums-Dimension verwendet
     * (statt eines separaten Zählers), Werte werden explizit als Zahl geparst, und
     * Jahres-Arrays werden monatsindiziert befüllt (robust gegen Lücken/Nicht-Januar-Start).
     * @param body geparster JSON-Body der Bundesbank-API-Antwort
     * @returns {{zinsen: Object<number, number[]>, neuester: (number|null)}}
     */
    function parseBundesbankResponse(body) {
        const series_dict = body["data"]["dataSets"][0]["series"];
        const observations = series_dict[Object.keys(series_dict)[0]]["observations"];
        const date_values = body["data"]["structure"]["dimensions"]["observation"][0]["values"];

        let zinsen = {};
        let neuester = null;
        for (let key in observations) {
            let index = parseInt(key, 10);
            let date_value = date_values[index];
            if (date_value === undefined) {
                continue;
            }
            let zins = parseFloat(observations[key][0]);
            if (Number.isNaN(zins)) {
                continue;
            }
            let date = date_value["id"].split("-", 2);
            let jahr = parseInt(date[0], 10);
            let monat = parseInt(date[1], 10);
            if (!zinsen[jahr]) {
                zinsen[jahr] = [];
            }
            zinsen[jahr][monat - 1] = zins;
            neuester = zins;
        }
        return {zinsen: zinsen, neuester: neuester};
    }

    const IvdCalc = {
        rueckzahlungsdauer: rueckzahlungsdauer,
        restschuld: restschuld,
        belastung: belastung,
        leistbarkeit: leistbarkeit,
        einkauf: einkauf,
        parseBundesbankResponse: parseBundesbankResponse,
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = IvdCalc;
    } else {
        global.IvdCalc = IvdCalc;
    }
})(typeof window !== "undefined" ? window : globalThis);
