const e_eigenkapital_prozent = $("#e_eigenkapital_prozent");
const e_eigenkapital_euro = $("#e_eigenkapital_euro");
const l_anteil_eigenkapital = $("#l_anteil_eigenkapital");
const l_einkommenbelastung = $("#l_einkommenbelastung");
const result_fields = $("#result-fields");

$("#calculate").click(function() {
    if (!validate_inputs()) {return;}
    if ($("#auswahl_berechnung_belastung").is(":checked")) {calculator_belastung()}
    else if ($("#auswahl_berechnung_leistbarkeit").is(":checked")) {calculator_leistbarkeit()}
});

function validate_inputs() {
    let valid = true;

    let tilgungssatz_helpline = $("#tilgungssatz_helpline");
    if (parseFloat($("#tilgungssatz").val()) === 0) {
        tilgungssatz_helpline.addClass("text-danger");
        tilgungssatz_helpline.html("Tilgungssatz in Prozent<br>Achtung: Ohne Tilgung kann keine Rückzahlungsdauer berechnet werden");
        valid = false;
    } else {
        tilgungssatz_helpline.removeClass("text-danger");
        tilgungssatz_helpline.html("Tilgungssatz in Prozent");
    }

    let einkommen_helpline = $("#einkommen_helpline");
    if (parseFloat($("#einkommen").val()) === 0) {
        einkommen_helpline.addClass("text-danger");
        einkommen_helpline.html("Nettoeinkommen in Euro<br>gegebenenfalls inkl. Kindergeld<br>Achtung: Ohne Einkommen kann keine Einkommensbelastung berechnet werden");
        valid = false;
    } else {
        einkommen_helpline.removeClass("text-danger");
        einkommen_helpline.html("Nettoeinkommen in Euro<br>gegebenenfalls inkl. Kindergeld");
    }

    if (!valid) {
        $("#result-container").css("display", "none");
    }
    return valid;
}

$("#auswahl_berechnung_belastung").click(function() {
    result_fields.empty();
    $("#result-container").css("display", "none");
    $(".container-belastung").css("display", "flex");
    $(".container-leistbarkeit").css("display", "none");
    reset_eigenkapital_prozent();
});

$("#auswahl_berechnung_leistbarkeit").click(function() {
    $("#result-container").css("display", "none");
    $(".container-belastung").css("display", "none");
    $(".container-leistbarkeit").css("display", "flex");
    let eigenkapital = $("#eigenkapital");
    eigenkapital.attr("step", "1000");
    eigenkapital.val("100000");
    $("#eigenkapital_sign").text("€");
    $("#eigenkapital_helpline").html("Eigenkapital in Euro<br>Wie viel Eigenkapital wollen Sie aufbringen?");
});
e_eigenkapital_prozent.click(function() {
    reset_eigenkapital_prozent()
});

e_eigenkapital_euro.click(function() {
    let preis = parseInt($("#e_preis").val(), 10);
    let nebenkosten = parseFloat($("#nebenkosten").val());
    let nebenkosten_summe = preis * ((15 + nebenkosten) / 100);
    let eigenkapital = $("#eigenkapital");
    eigenkapital.val(nebenkosten_summe.toFixed());
    eigenkapital.attr("step", "1000");
    $("#eigenkapital_sign").text("€");
    $("#eigenkapital_helpline").html("Eigenkapital in Euro<br>Wie viel Eigenkapital wollen Sie aufbringen? Beachten Sie, dass das Eigenkapital zumindest die Kaufnebenkosten abdecken sollte.");
});

l_anteil_eigenkapital.on("input", function() {
    $("#l_anteil_eigenkapital_wert").text(l_anteil_eigenkapital.val() + "%");
});

l_einkommenbelastung.on("input", function() {
    $("#l_einkommenbelastung_wert").text(l_einkommenbelastung.val() + "%");
});


function reset_eigenkapital_prozent() {
    e_eigenkapital_euro.prop("checked", false);
    e_eigenkapital_prozent.prop("checked", true);
    let eigenkapital = $("#eigenkapital");
    eigenkapital.val(15);
    eigenkapital.attr("step", "1");
    $("#eigenkapital_sign").text("%");
    $("#eigenkapital_helpline").html("Eigenkapital in Prozent<br>Wie viel Eigenkapital anteilig am Kaufpreis kann aufgebracht werden? Beachten Sie, dass die Kaufnebenkosten ebenfalls aus Eigenkapital beglichen werden.");
}

function calculator_belastung() {
    result_fields.empty();

    let preis = parseInt($("#e_preis").val(), 10);
    let nebenkosten = parseFloat($("#nebenkosten").val());
    let eigenkapital_eingabe = parseFloat($("#eigenkapital").val());
    let eigenkapital_ist_prozent = e_eigenkapital_prozent.prop("checked");

    let einkommen = parseInt($("#einkommen").val(), 10);
    if ($("#einkommen_zeit_monatlich").prop("checked")) {
        einkommen *= 12;
    }

    let zinssatz = parseFloat($("#zinssatz").val()) / 100;
    let tilgungssatz = parseFloat($("#tilgungssatz").val()) / 100;

    let ergebnis = IvdCalc.belastung({
        preis: preis,
        nebenkosten_prozent: nebenkosten,
        eigenkapital_eingabe: eigenkapital_eingabe,
        eigenkapital_ist_prozent: eigenkapital_ist_prozent,
        einkommen_jahr: einkommen,
        zinssatz_prozent: zinssatz,
        tilgungssatz_prozent: tilgungssatz,
    });

    create_result_gesamtkosten(ergebnis.gesamtkosten);
    create_result_eigenkapital(ergebnis.eigenkapital);
    create_result_kredithoehe(ergebnis.fremdkapital, "Kredithöhe in Euro<br>Dies entspricht einem Fremdkapitalanteil von <strong>" + ergebnis.beleihungsauslauf.toLocaleString("de-DE", {maximumFractionDigits: 1}) + "</strong> Prozent am Kaufpreis.");
    create_result_kreditbelastung(ergebnis.kreditbelastung_pm);
    create_result_kreditbelastung_anteil(ergebnis.kreditbelastung_anteilig);
    create_result_rueckzahlungsdauer(ergebnis.rueckzahlungsdauer);

    const restschuld_jahre = [5, 10, 15];
    for (let jahr of restschuld_jahre) {
        let rs = IvdCalc.restschuld(ergebnis.fremdkapital, tilgungssatz, zinssatz, jahr);
        create_result_restschuld(rs, jahr);
    }

    let eigenkapitel_helpline = $("#e_eigenkapital_benoetigt_helpline");
    if (ergebnis.eigenkapital < ergebnis.nebenkosten_summe) {
        eigenkapitel_helpline.addClass("text-danger");
        eigenkapitel_helpline.html('Eigenkapital in Euro<br>Das Eigenkapital sollte einen Betrag von <strong>' + ergebnis.nebenkosten_summe.toLocaleString("de-DE", {maximumFractionDigits: 0}) + ' Euro </strong> nicht unterschreiten, damit die Nebenkosten gedeckt sind.');
    } else if (eigenkapital_ist_prozent) {
        eigenkapitel_helpline.removeClass("text-danger");
        eigenkapitel_helpline.html("Eigenkapital in Euro<br>Dies entspricht einem Eigenkapitalanteil von <strong>" + eigenkapital_eingabe.toLocaleString("de-DE", {maximumFractionDigits: 1}) + "</strong> Prozent am Kaufpreis zzgl. der Kaufnebenkosten.");
    } else {
        eigenkapitel_helpline.removeClass("text-danger");
        eigenkapitel_helpline.text("Eigenkapital in Euro");
    }

    $("#result-container").css("display", "block");
}

function calculator_leistbarkeit() {
    result_fields.empty();

    let nebenkosten = parseFloat($("#nebenkosten").val());
    let eigenkapital = parseInt($("#eigenkapital").val(), 10);
    let eigenkapital_anteil = parseInt(l_anteil_eigenkapital.val(), 10);

    let einkommenbelastung = parseInt(l_einkommenbelastung.val(), 10);
    let einkommen = parseInt($("#einkommen").val(), 10);
    if ($("#einkommen_zeit_monatlich").prop("checked")) {
        einkommen *= 12;
    }

    let zinssatz = parseFloat($("#zinssatz").val()) / 100;
    let tilgungssatz = parseFloat($("#tilgungssatz").val()) / 100;

    let ergebnis = IvdCalc.leistbarkeit({
        nebenkosten_prozent: nebenkosten,
        eigenkapital: eigenkapital,
        eigenkapital_anteil_prozent: eigenkapital_anteil,
        einkommenbelastung_prozent: einkommenbelastung,
        einkommen_jahr: einkommen,
        zinssatz_prozent: zinssatz,
        tilgungssatz_prozent: tilgungssatz,
    });

    create_result_kaufpreis(ergebnis.kaufpreis);
    create_result_gesamtkosten(ergebnis.gesamtkosten);
    create_result_kredithoehe(ergebnis.fremdkapital, "Kredithöhe in Euro");
    create_result_eigenkapitalanteil(ergebnis.eigenkapital_anteil_final);
    create_result_kreditbelastung(ergebnis.annuitaet_pm);
    create_result_kreditbelastung_anteil(ergebnis.einkommenbelastung_final);
    create_result_rueckzahlungsdauer(ergebnis.rueckzahlungsdauer);

    const restschuld_jahre = [5, 10, 15];
    for (let jahr of restschuld_jahre) {
        let rs = IvdCalc.restschuld(ergebnis.fremdkapital, tilgungssatz, zinssatz, jahr);
        create_result_restschuld(rs, jahr);
    }

    $("#result-container").css("display", "block");
}

function create_result_kaufpreis(wert) {
    let id_name = "kaufpreis";
    let label = "Kaufpreis:";
    let helptext = "maximaler Kaufpreis in Euro";
    create_result(id_name, label, helptext, wert.toLocaleString("de-DE", {maximumFractionDigits: 0}), "€");
}

function create_result_gesamtkosten(wert) {
    let id_name = "gesamtkosten";
    let label = "Gesamtkosten:";
    let helptext = "Gesamtkosten in Euro";
    create_result(id_name, label, helptext, wert.toLocaleString("de-DE", {maximumFractionDigits: 0}), "€");
}

function create_result_kredithoehe(wert, helptext) {
    let id_name = "kredithoehe";
    let label = "Kredithöhe:";
    create_result(id_name, label, helptext, wert.toLocaleString("de-DE", {maximumFractionDigits: 0}), "€");
}

function create_result_eigenkapital(wert) {
    let id_name = "eigenkapital";
    let label = "Eigen&shy;kapital:";
    let helptext = "";
    create_result(id_name, label, helptext, wert.toLocaleString("de-DE", {maximumFractionDigits: 0}), "€");
}

function create_result_eigenkapitalanteil(wert) {
    let id_name = "eigenkapitalanteil";
    let label = "Eigen&shy;kapital&shy;anteil am Kaufpreis:";
    let helptext = "Höhe des Eigenkapitals am Kaufpreis";
    create_result(id_name, label, helptext, wert.toLocaleString("de-DE", {maximumFractionDigits: 1}), "%");
}

function create_result_kreditbelastung(wert) {
    let id_name = "kreditbelastung";
    let label = "Kredit&shy;belastung pro Monat:";
    let helptext = "Kreditbelastung pro Monat in Euro";
    create_result(id_name, label, helptext, wert.toLocaleString("de-DE", {maximumFractionDigits: 0}), "€");
}

function create_result_kreditbelastung_anteil(wert) {
    let id_name = "kreditbelastung-anteil";
    let label = "Anteil Kredit&shy;belastung am Einkommen:";
    let helptext = "anteilige Kreditbelastung am Einkommen in Prozent";
    create_result(id_name, label, helptext, wert.toLocaleString("de-DE", {maximumFractionDigits: 1}), "%");
}

function create_result_rueckzahlungsdauer(wert) {
    let id_name = "rueckzahlungsdauer";
    let label = "Rück&shy;zahlungs&shy;dauer des Kredits:";
    let helptext = "Dauer in Jahren, bis der Kredit zurückgezahlt wäre";
    create_result(id_name, label, helptext, wert.toLocaleString("de-DE", {maximumFractionDigits: 1}), "");
}

function create_result_restschuld(wert, jahre) {
    let id_name = "restschuld" + jahre;
    let label = `Restschuld nach <strong>${jahre}</strong> Jahren:`;
    let helptext = `Restschuld des Darlehens nach einer Zinsbindung von ${jahre} Jahren.`;
    create_result(id_name, label, helptext, wert.toLocaleString("de-DE", {maximumFractionDigits: 0}), "€");
}

function create_result(id_name, label, helptext, wert="", suffix="") {
    let result_html = (
        `<div class="row py-1 align-items-center">
            <div class="col-md-3 col-lg-2 text-md-end">
                <label for="${id_name}" class="col-form-label">${label}</label>
            </div>
            <div class="col-md-9 col-lg-3">
                <div class="input-group">
                    <input type="text" id="${id_name}" name="${id_name}" value="${wert}" class="form-control rightnumber" readonly>
                    <span class="input-group-text fw-bold">${suffix}</span>
                </div>
            </div>
            <div class="col-md-9 offset-md-3 col-lg-7 offset-lg-0">
                <span id="${id_name}_helpline" class="form-text">${helptext}</span>
            </div>
        </div>`
    )
    result_fields.append(result_html);
}