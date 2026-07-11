let result_container = $("#result-container");

let nebenkosten_input = $("#nebenkosten");
let belastung_pm_input = $("#belastung_pm");
let betriebskosten_pm_input = $("#betriebskosten_pm");
let annuitaet_pm_input = $("#annuitaet_pm");
let zinssatz_input = $("#zinssatz");
let tilgungssatz_input = $("#tilgungssatz");
let eigenkapital_input = $("#eigenkapital");
let zinsvergleich1 = $("#zinsvergleich1");
let zinsvergleich2 = $("#zinsvergleich2");
let zinsvergleich_container = $("#zinsvergleich-container");
let zinsvergleich_unavailable_hint = $("#zinsvergleich-unavailable-hint");

let vergleich_dates = null;
let latest_bundesbank_value = null;
let monat_jahr_dict = {};
let bundesbank_zinsen = {};

const BUNDESBANK_TIMEOUT_MS = 5000;

window.onload = async function() {
    await bundesbank_request();
    if (Object.keys(bundesbank_zinsen).length > 0) {
        set_date_options();
        zinsvergleich_container.show();
        zinsvergleich_unavailable_hint.hide();
        if (latest_bundesbank_value !== null) {
            zinssatz_input.val(latest_bundesbank_value);
        }
    } else {
        zinsvergleich_container.hide();
        zinsvergleich_unavailable_hint.show();
    }
    set_annuitaet();
};

belastung_pm_input.change(function () {
    set_annuitaet();
})

betriebskosten_pm_input.change(function () {
    set_annuitaet();
})

function set_annuitaet() {
    let betriebskosten = betriebskosten_pm_input.val();
    let belastung = belastung_pm_input.val();
    annuitaet_pm_input.val(belastung - betriebskosten);
}

$("#calculate").click(function() {
    let valid = validate_inputs();
    if (valid === false) {return;}
    let input_data = get_input_dict();
    let calculator_results = calculator(input_data, true);
    if (Object.keys(bundesbank_zinsen).length > 0) {
        vergleich_dates = get_dates();
        
        let date1 = split_year_month(vergleich_dates[0]);
        input_data.zinssatz_prozent = bundesbank_zinsen[date1[0]][date1[1]-1] / 100;
        let results_first_comparison = calculator(input_data, false);
        results_first_comparison["date"] = monat_jahr_dict[vergleich_dates[0]];
        
        let date2 = split_year_month(vergleich_dates[1]);
        input_data.zinssatz_prozent = bundesbank_zinsen[date2[0]][date2[1]-1] / 100;
        let results_second_comparison = calculator(input_data, false);
        results_second_comparison["date"] = monat_jahr_dict[vergleich_dates[1]];
        
        set_results(calculator_results, results_first_comparison, results_second_comparison);
    } else {
        set_results(calculator_results, null, null);
    }
});

function split_year_month(input_string) {
    let date = input_string.split("-", 2);
    let year = parseInt(date[0]);
    let month = parseInt(date[1]);
    return [year, month];
}

async function bundesbank_request() {
    const controller = new AbortController();
    const timeout_id = setTimeout(() => controller.abort(), BUNDESBANK_TIMEOUT_MS);
    try {
        const response = await fetch(
            "https://api.statistiken.bundesbank.de/rest/data/BBIM1/M.DE.B.A2C.O.R.A.2250.EUR.N?detail=dataonly",
            {headers: {"Accept": "application/json"}, signal: controller.signal}
        );
        if (!response.ok) {
            throw new Error("Bundesbank API antwortete mit Status " + response.status);
        }
        const body = await response.json();
        const parsed = IvdCalc.parseBundesbankResponse(body);
        bundesbank_zinsen = parsed.zinsen;
        latest_bundesbank_value = parsed.neuester;
    } catch (error) {
        bundesbank_zinsen = {};
        latest_bundesbank_value = null;
    } finally {
        clearTimeout(timeout_id);
    }
}

// $(document).ajaxStart(function () {
//     $("img").show();
// });

// $(document).ajaxStop(function () {
//     $("img").hide();
// });

function zero_leading_num(num) {
    return num.toString().padStart(2, '0');
}

function year_month(year, month) {
    return year.toString() + '-' + zero_leading_num(month);
}

function set_date_options() {
    zinsvergleich1.empty();
    zinsvergleich2.empty();
    const date = new Date();
    const current_month = date.getMonth()+1; // startet bei 0
    const current_year = date.getFullYear();
    const preselect1 =  year_month(current_year-1, current_month);
    const preselect2 =  year_month(current_year-2, current_month);
    const month_names = {
        1: "Januar", 2: "Februar", 3: "März", 4: "April",
        5: "Mai", 6: "Juni", 7: "Juli", 8: "August",
        9: "September", 10: "Oktober", 11: "November", 12: "Dezember",
    }
    for (let jahr in bundesbank_zinsen) {
        for (let monat = 1; monat <= bundesbank_zinsen[jahr].length; monat++) {
            if (parseInt(jahr, 10) === current_year && monat >= current_month - 3) {
                break;
            }
            if (bundesbank_zinsen[jahr][monat - 1] === undefined) {
                continue;
            }
            let value = year_month(jahr, monat);
            let monat_name = month_names[monat];
            let name = jahr.toString() + " " + monat_name;
            monat_jahr_dict[value] = {jahr: jahr, monat: monat, monat_name: monat_name}
            append_date_option(zinsvergleich1, value, name, preselect1)
            append_date_option(zinsvergleich2, value, name, preselect2)
        }
    }
}

function append_date_option(object, value, name, current) {
    let newOption = new Option(name, value)
    if (value === current) {
        newOption.selected = true;
    }
    object.append(newOption);
}

function get_dates() {
    let d1 = zinsvergleich1.val();
    let d2 = zinsvergleich2.val();
    return [d1, d2];
}

function validate_inputs() {
    let tilgungssatz_helpline = $("#tilgungssatz_helpline");
    if (parseFloat(tilgungssatz_input.val()) === 0) {
        tilgungssatz_helpline.addClass("text-danger");
        tilgungssatz_helpline.html("Tilgungssatz in Prozent, 2% ist ein guter Richtwert, höher ist jedoch besser<br>Achtung: Ohne Tilgung funktioniert kein Annuitätendarlehen");
        result_container.css("display", "none");
        return false;
    } else {
        tilgungssatz_helpline.removeClass("text-danger");
        tilgungssatz_helpline.html("Tilgungssatz in Prozent, 2% ist ein guter Richtwert, höher ist jedoch besser");
        return true;
    }
}

function get_input_dict() {
    let nebenkosten_prozent = parseFloat(nebenkosten_input.val()) / 100;
    let kreditbelastung_pm = parseInt(annuitaet_pm_input.val());
    let zinssatz_prozent = parseFloat(zinssatz_input.val()) / 100;
    let tilgungssatz_prozent = parseFloat(tilgungssatz_input.val()) / 100;
    let eigenkapital = parseInt(eigenkapital_input.val());
    let betriebskosten_pm = parseInt(betriebskosten_pm_input.val());

    return {
        "nebenkosten_prozent": nebenkosten_prozent,
        "kreditbelastung_pm": kreditbelastung_pm,
        "zinssatz_prozent": zinssatz_prozent,
        "tilgungssatz_prozent": tilgungssatz_prozent,
        "eigenkapital": eigenkapital,
        "betriebskosten": betriebskosten_pm,
    };
}

/**
 * Kalkuliert Ergebnisse
 * @param inputs object
 * @param calculate_betriebskosten bool
 * @returns {{preis: string, rueckzahlungsdauer: string, zinssatz: string, eigenkapital_anteilig: string, gesamtkosten: string, betriebskosten, eigenkapital_anteilig_warning: boolean, fremdkapital: string}}
 */
function calculator(inputs, calculate_betriebskosten) {
    let ergebnis = IvdCalc.einkauf({
        nebenkosten_prozent: inputs.nebenkosten_prozent,
        kreditbelastung_pm: inputs.kreditbelastung_pm,
        zinssatz_prozent: inputs.zinssatz_prozent,
        tilgungssatz_prozent: inputs.tilgungssatz_prozent,
        eigenkapital: inputs.eigenkapital,
        betriebskosten: inputs.betriebskosten,
    });

    let betriebskosten;
    if (calculate_betriebskosten) {
        betriebskosten = ergebnis.betriebskosten_gesamt.toLocaleString("de-DE", { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    }

    return {
        "preis": ergebnis.preis.toLocaleString("de-DE", { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
        "gesamtkosten": ergebnis.gesamtkosten.toLocaleString("de-DE", { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
        "fremdkapital": ergebnis.fremdkapital.toLocaleString("de-DE", { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
        "rueckzahlungsdauer": ergebnis.rueckzahlungsdauer.toLocaleString("de-DE", { style: 'decimal', maximumFractionDigits: 1 }),
        "eigenkapital_anteilig_warning": ergebnis.eigenkapital_anteilig_warning,
        "eigenkapital_anteilig": ergebnis.eigenkapital_anteilig.toLocaleString("de-DE", { style: 'percent', maximumFractionDigits: 1 }),
        "zinssatz": ergebnis.zinssatz_prozent.toLocaleString("de-DE", { style: 'percent', maximumFractionDigits: 2 }),
        "zinssatz_raw": ergebnis.zinssatz_prozent,
        "betriebskosten": betriebskosten,
    };
}

function set_results(results, first_comparison, second_comparison) {
    result_container.css("display", "block");
    $("#kaufpreis").text(results.preis);
    $("#gesamtkosten").text(results.gesamtkosten);
    $("#kredithoehe").text(results.fremdkapital);
    $("#belastung").text(results.betriebskosten);
    $("#eigenkapital_anteilig").text(results.eigenkapital_anteilig);
    if (results.eigenkapital_anteilig_warning) {
        $("#eigenkapital_anteilig_warning").show();
    } else {
        $("#eigenkapital_anteilig_warning").hide();
    }
    $("#rueckzahlungsdauer").text(results.rueckzahlungsdauer + " Jahre");
    if (first_comparison !== null) {
        $("#kaufpreis_first_comparison").text(first_comparison.preis);
        $("#gesamtkosten_first_comparison").text(first_comparison.gesamtkosten);
        $("#kredithoehe_first_comparison").text(first_comparison.fremdkapital);
        $("#eigenkapital_first_comparison_anteilig").text(first_comparison.eigenkapital_anteilig);
        if (first_comparison.eigenkapital_anteilig_warning) {
            $("#eigenkapital_first_comparison_anteilig_warning").show();
        } else {
            $("#eigenkapital_first_comparison_anteilig_warning").hide();
        }
        $("#rueckzahlungsdauer_first_comparison").text(first_comparison.rueckzahlungsdauer + " Jahre");
        $("#zinssatz_first_comparison").text(first_comparison.zinssatz);
        let string_date1 = first_comparison["date"]["monat_name"] + " " + first_comparison["date"]["jahr"].toString();
        $("#zinssatz_first_comparison_date").text(string_date1);
        $("#first_comparison_header").text(string_date1);
        const fchd = $("#first_comparison_header_div");
        fchd.removeClass("bg-warning");
        fchd.removeClass("bg-success");
        fchd.removeClass("text-white");
        if (first_comparison.zinssatz_raw > results.zinssatz_raw) {
            fchd.addClass("bg-warning");
        } else {
            fchd.addClass("bg-success");
            fchd.addClass("text-white");
        }
    }
    if (second_comparison !== null) {
        $("#kaufpreis_second_comparison").text(second_comparison.preis);
        $("#gesamtkosten_second_comparison").text(second_comparison.gesamtkosten);
        $("#kredithoehe_second_comparison").text(second_comparison.fremdkapital);
        $("#eigenkapital_second_comparison_anteilig").text(second_comparison.eigenkapital_anteilig);
        if (second_comparison.eigenkapital_anteilig_warning) {
            $("#eigenkapital_second_comparison_anteilig_warning").show();
        } else {
            $("#eigenkapital_second_comparison_anteilig_warning").hide();
        }
        $("#rueckzahlungsdauer_second_comparison").text(second_comparison.rueckzahlungsdauer + " Jahre");
        $("#zinssatz_second_comparison").text(second_comparison.zinssatz);
        let string_date2 = second_comparison["date"]["monat_name"] + " " + second_comparison["date"]["jahr"].toString();
        $("#zinssatz_second_comparison_date").text(string_date2);
        $("#second_comparison_header").text(string_date2);
        const schd = $("#second_comparison_header_div");
        schd.removeClass("bg-warning");
        schd.removeClass("bg-success");
        schd.removeClass("text-white");
        if (second_comparison.zinssatz_raw > results.zinssatz_raw) {
            schd.addClass("bg-warning");
        } else {
            schd.addClass("bg-success");
            schd.addClass("text-white");
        }
    }
}
