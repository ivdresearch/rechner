let result_container = $("#result-container");

let nebenkosten_input = $("#nebenkosten");
let annuitaet_pm_input = $("#annuitaet_pm");
let zinssatz_input = $("#zinssatz");
let tilgungssatz_input = $("#tilgungssatz");
let eigenkapital_input = $("#eigenkapital");
let zinsvergleich1 = $("#zinsvergleich1");
let zinsvergleich2 = $("#zinsvergleich2");

let vergleich_dates = null;
let latest_bundesbank_value = null;
let monat_jahr_dict = {};
let bundesbank_zinsen = {};

window.onload = function() {
    bundesbank_request();
    set_date_options();
    zinssatz_input.val(latest_bundesbank_value);
};

$("#calculate").click(function() {
    let valid = validate_inputs();
    if (valid === false) {return;}
    let input_data = get_input_dict();
    let calculator_results = calculator(input_data);
    if (Object.keys(bundesbank_zinsen).length > 0) {
        vergleich_dates = get_dates();
        
        let date1 = split_year_month(vergleich_dates[0]);
        input_data.zinssatz_prozent = bundesbank_zinsen[date1[0]][date1[1]-1] / 100;
        let results_first_comparison = calculator(input_data);
        results_first_comparison["date"] = monat_jahr_dict[vergleich_dates[0]];
        
        let date2 = split_year_month(vergleich_dates[1]);
        input_data.zinssatz_prozent = bundesbank_zinsen[date2[0]][date2[1]-1] / 100;
        let results_second_comparison = calculator(input_data);
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

function bundesbank_request() {
    $.ajax({
        type: "GET",
        async: false,
        url: "https://api.statistiken.bundesbank.de/rest/data/BBK01/SUD118?detail=dataonly", // ?startPeriod=" + vergleich_dates[0] + "&endPeriod=" + vergleich_dates[1] + "&detail=dataonly",
        contentType: 'application/json',
        dataType: "json",
        success: function (result, status, xhr) {
            const result_array = xhr["responseJSON"]["data"]["dataSets"]["0"]["series"]["0"]["observations"];
            const results = xhr["responseJSON"]["data"]["structure"]["dimensions"]["observation"][0]["values"]
            let position = 0;
            for (let key in result_array) {
                let zins = result_array[key];
                let date = split_year_month(results[position]["id"]);
                if (date[1] === 1) {
                    bundesbank_zinsen[date[0]] = [zins[0]];
                } else {
                    bundesbank_zinsen[date[0]].push(zins[0]);
                }
                latest_bundesbank_value = zins[0];
                position++;
            }
        },
        error: function (xhr, status, error) {
            alert("Result: " + status + " " + error + " " + xhr.status + " " + xhr.statusText);
        }
    });
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
    zinsvergleich1.innerHTML = "";
    zinsvergleich2.innerHTML = "";
    const date = new Date();
    const current_month = date.getMonth()+1; // startet bei 0
    const current_year = date.getFullYear();
    const preselect1 =  year_month(current_year-1, current_month);
    const preselect2 =  year_month(current_year-2, current_month);
    // const month_names = {
    //     1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
    //     5: "Mai", 6: "Jun", 7: "Jul", 8: "Aug",
    //     9: "Sep", 10: "Okt", 11: "Nov", 12: "Dez",
    // }
    const month_names = {
        1: "Januar", 2: "Februar", 3: "März", 4: "April",
        5: "Mai", 6: "Juni", 7: "Juli", 8: "August",
        9: "September", 10: "Oktober", 11: "November", 12: "Dezember",
    }
    for (let jahr in bundesbank_zinsen) {
        let monat = 1;
        for (monat; monat <= bundesbank_zinsen[jahr].length; monat++) {
            if (jahr === current_year && monat >= current_month -3) {
                break;
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
    // if (d1.localeCompare(d2) >= 0) {
    //     return [d2, d1];
    // } else {
    //     return [d1, d2];
    // }
    return [d1, d2];
}

function calculate_rueckzahlungsdauer(kredit, annuitaet, zinssatz) {
    // Annuität pro Monat
    zinssatz = zinssatz / 12;
    return ((Math.log(annuitaet) - Math.log(annuitaet - (zinssatz * kredit))) / Math.log(1 + zinssatz)) / 12;
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

    return {
        "nebenkosten_prozent": nebenkosten_prozent,
        "kreditbelastung_pm": kreditbelastung_pm,
        "zinssatz_prozent": zinssatz_prozent,
        "tilgungssatz_prozent": tilgungssatz_prozent,
        "eigenkapital": eigenkapital
    };
}

function calculator(inputs) {
    let fremdkapital = (inputs.kreditbelastung_pm * 12) / (inputs.zinssatz_prozent + inputs.tilgungssatz_prozent);
    let gesamtkosten = fremdkapital + inputs.eigenkapital;
    let preis = gesamtkosten / (1 + inputs.nebenkosten_prozent);
    let rueckzahlungsdauer = calculate_rueckzahlungsdauer(fremdkapital, inputs.kreditbelastung_pm, inputs.zinssatz_prozent);
    let eigenkapital_anteilig = 1 - (fremdkapital / preis);
    let eigenkapital_anteilig_warning = false;

    if (eigenkapital_anteilig < 0) {
        eigenkapital_anteilig = 0;
        eigenkapital_anteilig_warning = true;
    }

    return {
        "preis": preis.toLocaleString("de-DE", { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
        "gesamtkosten": gesamtkosten.toLocaleString("de-DE", { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
        "fremdkapital": fremdkapital.toLocaleString("de-DE", { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
        "rueckzahlungsdauer": rueckzahlungsdauer.toLocaleString("de-DE", { style: 'decimal', maximumFractionDigits: 1 }),
        "eigenkapital_anteilig_warning": eigenkapital_anteilig_warning,
        "eigenkapital_anteilig": eigenkapital_anteilig.toLocaleString("de-DE", { style: 'percent', maximumFractionDigits: 1 }),
        "zinssatz": inputs.zinssatz_prozent.toLocaleString("de-DE", { style: 'percent', maximumFractionDigits: 2 }),
    };
}

function set_results(results, first_comparison, second_comparison) {
    result_container.css("display", "block");
    $("#kaufpreis").text(results.preis);
    $("#gesamtkosten").text(results.gesamtkosten);
    $("#kredithoehe").text(results.fremdkapital);
    let eigenkapital_anteilig_helpline = $("#eigenkapital_anteilig_helpline");
    if (results.eigenkapital_anteilig_warning) {
        eigenkapital_anteilig_helpline.addClass("text-danger");
        eigenkapital_anteilig_helpline.html("Anteil des Eigenkapitals am Kaufpreis<br>Achtung: Das Eigenkapital würde bei dieser Kalkulation nicht ausreichen um die Kaufnebenkosten zu decken.");
    } else {
        eigenkapital_anteilig_helpline.removeClass("text-danger");
        eigenkapital_anteilig_helpline.html("");
    }
    $("#eigenkapital_anteilig").text(results.eigenkapital_anteilig);
    $("#rueckzahlungsdauer").text(results.rueckzahlungsdauer + " Jahre");
    if (first_comparison !== null) {
        $("#kaufpreis_first_comparison").text(first_comparison.preis);
        $("#gesamtkosten_first_comparison").text(first_comparison.gesamtkosten);
        $("#kredithoehe_first_comparison").text(first_comparison.fremdkapital);
        $("#eigenkapital_first_comparison_anteilig").text(first_comparison.eigenkapital_anteilig);
        let eigenkapital_first_comparison_anteilig_helpline = $("#eigenkapital_first_comparison_anteilig_helpline");
        if (first_comparison.eigenkapital_anteilig_warning) {
            eigenkapital_first_comparison_anteilig_helpline.addClass("text-danger");
            eigenkapital_first_comparison_anteilig_helpline.html("Anteil des Eigenkapitals am Kaufpreis<br>Das Eigenkapital hätte bei dieser Kalkulation nicht ausgereicht um die Kaufnebenkosten zu decken.");
        } else {
            eigenkapital_first_comparison_anteilig_helpline.removeClass("text-danger");
            eigenkapital_first_comparison_anteilig_helpline.html("");
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
        if (first_comparison.zinssatz > results.zinssatz) {
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
        let eigenkapital_second_comparison_anteilig_helpline = $("#eigenkapital_second_comparison_anteilig_helpline");
        if (second_comparison.eigenkapital_anteilig_warning) {
            eigenkapital_second_comparison_anteilig_helpline.addClass("text-danger");
            eigenkapital_second_comparison_anteilig_helpline.html("Anteil des Eigenkapitals am Kaufpreis<br>Das Eigenkapital hätte bei dieser Kalkulation nicht ausgereicht um die Kaufnebenkosten zu decken.");
        } else {
            eigenkapital_second_comparison_anteilig_helpline.removeClass("text-danger");
            eigenkapital_second_comparison_anteilig_helpline.html("");
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
        if (second_comparison.zinssatz > results.zinssatz) {
            schd.addClass("bg-warning");
        } else {
            schd.addClass("bg-success");
            schd.addClass("text-white");
        }
    }
}