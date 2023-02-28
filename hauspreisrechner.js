let result_container = $("#result-container");

let nebenkosten_input = $("#nebenkosten");
let annuitaet_pm_input = $("#annuitaet_pm");
let zinssatz_input = $("#zinssatz");
let tilgungssatz_input = $("#tilgungssatz");
let eigenkapital_input = $("#eigenkapital");

let bundesbank_zinsen;

$("#calculate").click(function() {
    let valid = validate_inputs();
    if (valid === false) {return;}
    bundesbank_request();
    let input_data = get_input_dict();
    let calculator_results = calculator(input_data);
    if (typeof bundesbank_zinsen !== 'undefined') {
        input_data.zinssatz_prozent = parseFloat(bundesbank_zinsen[0]) / 100;
        // console.log(input_data);
        let zins_1_year_ago = calculator(input_data);
        input_data.zinssatz_prozent = parseFloat(bundesbank_zinsen[1]) / 100;
        // console.log(input_data);
        let zins_2_years_ago = calculator(input_data);
        // console.log(zins_1_year_ago);
        // console.log(zins_2_years_ago);
        set_results(calculator_results, zins_1_year_ago, zins_2_years_ago);
    } else {
        set_results(calculator_results, null, null);
    }
});

function bundesbank_request() {
    const dates = get_dates();
    $.ajax({
        type: "GET",
        async: false,
        url: "https://api.statistiken.bundesbank.de/rest/data/BBK01/SUD118?startPeriod=" + dates[1] + "&endPeriod=" + dates[0] + "&detail=dataonly",
        contentType: 'application/json',
        dataType: "json",
        success: function (result, status, xhr) {
            const result_array = xhr["responseJSON"]["data"]["dataSets"]["0"]["series"]["0"]["observations"];
            set_bundesbank_result([result_array["0"]["0"], result_array["12"]["0"]]);
        },
        error: function (xhr, status, error) {
            alert("Result: " + status + " " + error + " " + xhr.status + " " + xhr.statusText);
        }
    });
}

function set_bundesbank_result(data) {
    bundesbank_zinsen = data;
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

function year_month(month, year) {
    return year.toString() + '-' + zero_leading_num(month);
}

function get_dates() {
    const date = new Date();
    const month = date.getMonth()+1;
    const current_year = date.getFullYear();
    const one_year_ago = year_month(month, current_year-1);
    const two_years_ago = year_month(month, current_year-2);
    return [one_year_ago, two_years_ago]
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
    let eigenkapital_anteilig = (1 - (fremdkapital / preis)) * 100;

    return {
        "preis": preis.toFixed().toLocaleString(),
        "gesamtkosten": gesamtkosten.toFixed().toLocaleString(),
        "fremdkapital": fremdkapital.toFixed().toLocaleString(),
        "rueckzahlungsdauer": rueckzahlungsdauer,
        "eigenkapital_anteilig": eigenkapital_anteilig,
        "zinssatz": (inputs.zinssatz_prozent * 100).toFixed(2).toLocaleString().replace(".", ","),
    };
}

function set_results(results, one_year, two_years) {
    result_container.css("display", "block");
    $("#kaufpreis").val(results.preis);
    $("#gesamtkosten").val(results.gesamtkosten);
    $("#kredithoehe").val(results.fremdkapital);
    if (results.eigenkapital_anteilig < 0) {
        results.eigenkapital_anteilig = 0;
        let eigenkapital_anteilig_helpline = $("#eigenkapital_anteilig_helpline");
        eigenkapital_anteilig_helpline.addClass("text-danger");
        eigenkapital_anteilig_helpline.html("Anteil des Eigenkapitals am Kaufpreis<br>Achtung: Das Eigenkapital würde bei dieser Kalkulation nicht ausreichen um die Kaufnebenkosten zu decken.");
    }
    $("#eigenkapital_anteilig").val(results.eigenkapital_anteilig.toFixed(1).toLocaleString().replace(".", ","));
    $("#rueckzahlungsdauer").val(results.rueckzahlungsdauer.toFixed(1).toLocaleString().replace(".", ","));
    if (one_year !== null) {
        $("#kaufpreis_one_year").val(one_year.preis);
        $("#gesamtkosten_one_year").val(one_year.gesamtkosten);
        $("#kredithoehe_one_year").val(one_year.fremdkapital);
        $("#eigenkapital_one_year_anteilig").val(one_year.eigenkapital_anteilig.toFixed(1).toLocaleString().replace(".", ","));
        $("#rueckzahlungsdauer_one_year").val(one_year.rueckzahlungsdauer.toFixed(1).toLocaleString().replace(".", ","));
        $("#zinssatz_one_year").val(one_year.zinssatz);
    }
    if (two_years !== null) {
        $("#kaufpreis_two_years").val(two_years.preis);
        $("#gesamtkosten_two_years").val(two_years.gesamtkosten);
        $("#kredithoehe_two_years").val(two_years.fremdkapital);
        $("#eigenkapital_two_years_anteilig").val(two_years.eigenkapital_anteilig.toFixed(1).toLocaleString().replace(".", ","));
        $("#rueckzahlungsdauer_two_years").val(two_years.rueckzahlungsdauer.toFixed(1).toLocaleString().replace(".", ","));
        $("#zinssatz_two_years").val(two_years.zinssatz);
    }
}