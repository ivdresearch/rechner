$("#auswahl_berechnung_belastung").click(function() {
    $("#result-container").css("display", "none");
    $("#headline").html("&nbsp;Belastungsrechner&nbsp;");
    $(".container-belastung").css({"display": ""});
    $(".container-leistbarkeit").css({"display": "none"});
    reset_eigenkapital_prozent();
});

$("#auswahl_berechnung_leistbarkeit").click(function() {
    $("#result-container").css("display", "none");
    $("#headline").html("&nbsp;Leistbarkeitsrechner&nbsp;");
    $(".container-belastung").css({"display": "none"});
    $(".container-leistbarkeit").css({"display": "flex"});
    $("#eigenkapital").attr("step", "1000");
    $("#eigenkapital").val("100000");
    $("#eigenkapital_sign").text("€");
    $("#eigenkapital_helpline").html("Eigenkapital in Euro<br>Wie viel Eigenkapital wollen Sie aufbringen?");
});

$("#e_eigenkapital_prozent").click(function() {reset_eigenkapital_prozent()});

$("#l_anteil_eigenkapital").on("input", function() {
    $("#l_anteil_eigenkapital_wert").text($("#l_anteil_eigenkapital").val() + "%");
});

$("#l_einkommenbelastung").on("input", function() {
    $("#l_einkommenbelastung_wert").text($("#l_einkommenbelastung").val() + "%");
});

function reset_eigenkapital_prozent() {
    $("#e_eigenkapital_euro").prop("checked", false);
    $("#e_eigenkapital_prozent").prop("checked", true);
    $("#eigenkapital").val(15);
    $("#eigenkapital").attr("step", "1");
    $("#eigenkapital_sign").text("%");
    $("#eigenkapital_helpline").html("Eigenkapital in Prozent<br>Wie viel Eigenkapital anteilig am Kaufpreis kann aufgebracht werden? Beachten Sie, dass die Kaufnebenkosten ebenfalls aus Eigenkapital beglichen werden.");
}

$("#e_eigenkapital_euro").click(function() {
    var preis = parseInt($("#e_preis").val(), 10);
    var nebenkosten = parseFloat($("#nebenkosten").val());
    var nebenkosten_summe = preis * ((15 + nebenkosten) / 100);
    $("#eigenkapital").val(parseInt(nebenkosten_summe, 10));
    $("#eigenkapital").attr("step", "1000");
    $("#eigenkapital_sign").text("€");
    $("#eigenkapital_helpline").html("Eigenkapital in Euro<br>Wie viel Eigenkapital wollen Sie aufbringen? Beachten Sie, dass das Eigenkapital zumindest die Kaufnebenkosten abdecken sollte.");
});

$("#calculate").click(function() {
    if ($("#auswahl_berechnung_belastung").is(":checked")) {calculator_belastung()}
    else if ($("#auswahl_berechnung_leistbarkeit").is(":checked")) {calculator_leistbarkeit()}
});

function calculator_belastung() {
    $("#result-container").css("display", "block");

    var preis = parseInt($("#e_preis").val(), 10);
    var nebenkosten = parseFloat($("#nebenkosten").val());
    var gesamtkosten = preis * ((100 + nebenkosten) / 100);
    var nebenkosten_summe = gesamtkosten - preis;

    if ($("#e_eigenkapital_prozent").prop("checked")) {
        var eigenkapital = parseFloat($("#eigenkapital").val());
        var fremdkapital = preis * ((100 - eigenkapital) / 100);
        eigenkapital = gesamtkosten - fremdkapital;
        $("#e_eigenkapital_benoetigt_helpline").removeClass("text-danger");
        $("#e_eigenkapital_benoetigt_helpline").text("Eigenkapital in Euro");
    } else {
        var eigenkapital = parseFloat($("#eigenkapital").val());
        var fremdkapital = gesamtkosten - eigenkapital;
        if (eigenkapital < nebenkosten_summe) {
            $("#e_eigenkapital_benoetigt_helpline").addClass("text-danger");
            $("#e_eigenkapital_benoetigt_helpline").html('Eigenkapital in Euro<br>Das Eigenkapital sollte einen Betrag von <strong>' + parseInt(nebenkosten_summe, 10).toLocaleString() + ' Euro </strong> nicht unterschreiten, damit die Nebenkosten gedeckt sind.');
        } else {
            $("#e_eigenkapital_benoetigt_helpline").removeClass("text-danger");
            $("#e_eigenkapital_benoetigt_helpline").text("Eigenkapital in Euro");
        }
    }
    var beleihungsauslauf = (fremdkapital / preis) * 100;

    var einkommen = parseInt($("#einkommen").val(), 10);
    if ($("#einkommen_zeit_monatlich").prop("checked")) {
        einkommen *= 12;
    }

    var zinssatz = parseFloat($("#zinssatz").val());
    var tilgungssatz = parseFloat($("#tilgungssatz").val());
    var kreditbelastung_pa = fremdkapital * ((zinssatz + tilgungssatz) / 100);
    var kreditbelastung_pm = kreditbelastung_pa / 12;
    var kreditbelastung_anteilig = kreditbelastung_pa * 100 / einkommen;

    if (fremdkapital <= 0) {
        fremdkapital = 0;
        kreditbelastung_pa = 0;
        kreditbelastung_pm = 0;
        kreditbelastung_anteilig = 0;
        beleihungsauslauf = 0;
    }

    $("#gesamtkosten").val(parseInt(gesamtkosten, 10).toLocaleString());
    $("#e_eigenkapital_benoetigt").val(parseInt(eigenkapital, 10).toLocaleString());
    $("#kredithoehe").val(parseInt(fremdkapital, 10).toLocaleString());
    $("#kreditbelastung").val(parseInt(kreditbelastung_pm, 10).toLocaleString());
    $("#kreditbelastung-anteil").val(kreditbelastung_anteilig.toFixed(1).toLocaleString().replace(".", ","));
    $("#kredithoehe_helpline").html("Kredithöhe in Euro<br>Dies entspricht einem Fremdkapitalanteil von <strong>" + parseInt(beleihungsauslauf, 10).toLocaleString() + "</strong> Prozent am Kaufpreis.");
}

function calculator_leistbarkeit() {
    $("#result-container").css("display", "block");

    var nebenkosten = parseFloat($("#nebenkosten").val());
    var eigenkapital = parseInt($("#eigenkapital").val(), 10);
    var eigenkapital_anteil = parseInt($("#l_anteil_eigenkapital").val(), 10);
    var fremdkapital_anteil = 100 - eigenkapital_anteil;

    var einkommenbelastung = parseInt($("#l_einkommenbelastung").val(), 10);
    var einkommen = parseInt($("#einkommen").val(), 10);
    if ($("#einkommen_zeit_monatlich").prop("checked")) {
        einkommen *= 12;
    }

    var annuitaet_max = einkommen * (einkommenbelastung / 100);
    var zinssatz = parseFloat($("#zinssatz").val());
    var tilgungssatz = parseFloat($("#tilgungssatz").val());
    var fremdkapital_v1 = annuitaet_max / ((zinssatz + tilgungssatz) / 100);
    var fremdkapital_v2 = (eigenkapital * (fremdkapital_anteil / 100)) / ((nebenkosten + eigenkapital_anteil) / 100);
    var fremdkapital = Math.min(fremdkapital_v1, fremdkapital_v2);
    
    var gesamtkosten = eigenkapital + fremdkapital;
    var kaufpreis = gesamtkosten / (1 + (nebenkosten / 100));
    var eigenkapital_anteil_final = (1 - (fremdkapital / kaufpreis)) * 100;
    var annuitaet_pa = fremdkapital * ((zinssatz + tilgungssatz) / 100);
    var annuitaet_pm = annuitaet_pa / 12;
    var einkommenbelastung_final = (annuitaet_pa / einkommen) * 100;

    // $("#result-container").css("display", "block");
    $("#l_kaufpreis").val(parseInt(kaufpreis, 10).toLocaleString());
    $("#gesamtkosten").val(parseInt(gesamtkosten, 10).toLocaleString());
    $("#kredithoehe").val(parseInt(fremdkapital, 10).toLocaleString());
    $("#kredithoehe_helpline").html("Kredithöhe in Euro");
    $("#l_eigenkapitalanteil_final").val(eigenkapital_anteil_final.toFixed(1).toLocaleString().replace(".", ","));
    $("#kreditbelastung").val(parseInt(annuitaet_pm, 10).toLocaleString());
    $("#kreditbelastung-anteil").val(einkommenbelastung_final.toFixed(1).toLocaleString().replace(".", ","));
}