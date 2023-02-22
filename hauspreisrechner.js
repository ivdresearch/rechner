$("#calculate").click(function() {
    calculator()
});

function calculate_rueckzahlungsdauer(kredit, annuitaet, zinssatz) {
    // Annuität pro Monat
    zinssatz = zinssatz / 12;
    return ((Math.log(annuitaet) - Math.log(annuitaet - (zinssatz * kredit))) / Math.log(1 + zinssatz)) / 12;
}

function calculator() {
    let result_container = $("#result-container");

    let nebenkosten_prozent = parseFloat($("#nebenkosten").val()) / 100;
    let kreditbelastung_pm = parseInt($("#annuitaet_pm").val());
    let zinssatz_prozent = parseFloat($("#zinssatz").val()) / 100;
    let tilgungssatz_prozent = parseFloat($("#tilgungssatz").val()) / 100;
    let eigenkapital = parseInt($("#eigenkapital").val());

    let tilgungssatz_helpline = $("#tilgungssatz_helpline");
    if (tilgungssatz_prozent === 0) {
        tilgungssatz_helpline.addClass("text-danger");
        tilgungssatz_helpline.html("Tilgungssatz in Prozent, 2% ist ein guter Richtwert, höher ist jedoch besser<br>Achtung: Ohne Tilgung funktioniert kein Annuitätendarlehen");
        result_container.css("display", "none");
        return;
    } else {
        tilgungssatz_helpline.removeClass("text-danger");
        tilgungssatz_helpline.html("Tilgungssatz in Prozent, 2% ist ein guter Richtwert, höher ist jedoch besser");
    }

    result_container.css("display", "block");

    let preis;
    let gesamtkosten;
    let fremdkapital;
    let rueckzahlungsdauer;
    let eigenkapital_anteilig;

    fremdkapital = (kreditbelastung_pm * 12) / (zinssatz_prozent + tilgungssatz_prozent);
    gesamtkosten = fremdkapital + eigenkapital;
    preis = gesamtkosten / (1 + nebenkosten_prozent);
    rueckzahlungsdauer = calculate_rueckzahlungsdauer(fremdkapital, kreditbelastung_pm, zinssatz_prozent);
    eigenkapital_anteilig = (1 - (fremdkapital / preis)) * 100;

    $("#kaufpreis").val(preis.toFixed().toLocaleString());
    $("#gesamtkosten").val(gesamtkosten.toFixed().toLocaleString());
    $("#kredithoehe").val(fremdkapital.toFixed().toLocaleString());
    if (eigenkapital_anteilig < 0) {
        eigenkapital_anteilig = 0;
        let eigenkapital_anteilig_helpline = $("#eigenkapital_anteilig_helpline");
        eigenkapital_anteilig_helpline.addClass("text-danger");
        eigenkapital_anteilig_helpline.html("Anteil des Eigenkapitals am Kaufpreis<br>Achtung: Das Eigenkapital würde bei dieser Kalkulation nicht ausreichen um die Kaufnebenkosten zu decken.");
    }
    $("#eigenkapital_anteilig").val(eigenkapital_anteilig.toFixed(1).toLocaleString().replace(".", ","));
    $("#rueckzahlungsdauer").val(rueckzahlungsdauer.toFixed(1).toLocaleString().replace(".", ","));
}