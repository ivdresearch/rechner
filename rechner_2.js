const e_eigenkapital_prozent = $("#e_eigenkapital_prozent");
const e_eigenkapital_euro = $("#e_eigenkapital_euro");
const l_anteil_eigenkapital = $("#l_anteil_eigenkapital");
const l_einkommenbelastung = $("#l_einkommenbelastung");
const result_fields = $("#result-fields");

$("#calculate").click(function() {
    if ($("#auswahl_berechnung_belastung").is(":checked")) {calculator_belastung()}
    else if ($("#auswahl_berechnung_leistbarkeit").is(":checked")) {calculator_leistbarkeit()}
});

$("#auswahl_berechnung_belastung").click(function() {
    result_fields.empty();
    $("#result-container").css("display", "none");
    // $("#headline").html("&nbsp;Leistbarkeitsrechner&nbsp;");
    $(".container-belastung").css("display", "flex");
    $(".container-leistbarkeit").css("display", "none");
    reset_eigenkapital_prozent();
});

$("#auswahl_berechnung_leistbarkeit").click(function() {
    $("#result-container").css("display", "none");
    // $("#headline").html("&nbsp;Leistbarkeitsrechner&nbsp;");
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

function calculate_rueckzahlungsdauer(kredit, annuitaet, zinssatz) {
    // Annuität pro Monat
    zinssatz = zinssatz / 12;
    return ((Math.log(annuitaet) - Math.log(annuitaet - (zinssatz * kredit))) / Math.log(1 + zinssatz)) / 12;
}

function calculator_belastung() {
    result_fields.empty();

    let preis = parseInt($("#e_preis").val(), 10);
    let nebenkosten = parseFloat($("#nebenkosten").val());
    let gesamtkosten = preis * ((100 + nebenkosten) / 100);
    let nebenkosten_summe = gesamtkosten - preis;

    let fremdkapital;
    let eigenkapital_eingabe = parseFloat($("#eigenkapital").val());
    let eigenkapital = eigenkapital_eingabe;
    if (e_eigenkapital_prozent.prop("checked")) {
        fremdkapital = preis * ((100 - eigenkapital) / 100);
        eigenkapital = gesamtkosten - fremdkapital;
    } else {
        fremdkapital = gesamtkosten - eigenkapital;
    }
    let beleihungsauslauf = (fremdkapital / preis) * 100;

    let einkommen = parseInt($("#einkommen").val(), 10);
    if ($("#einkommen_zeit_monatlich").prop("checked")) {
        einkommen *= 12;
    }

    let zinssatz = parseFloat($("#zinssatz").val()) / 100;
    let tilgungssatz = parseFloat($("#tilgungssatz").val()) / 100;
    let kreditbelastung_pa = fremdkapital * (zinssatz + tilgungssatz);
    let kreditbelastung_pm = kreditbelastung_pa / 12;
    let kreditbelastung_anteilig = kreditbelastung_pa * 100 / einkommen;
    let rueckzahlungsdauer = calculate_rueckzahlungsdauer(fremdkapital, kreditbelastung_pm, zinssatz);

    if (fremdkapital <= 0) {
        fremdkapital = 0;
        rueckzahlungsdauer = 0;
        kreditbelastung_pa = 0;
        kreditbelastung_pm = 0;
        kreditbelastung_anteilig = 0;
        beleihungsauslauf = 0;
    }

    // $("#gesamtkosten").val(gesamtkosten.toFixed().toLocaleString());
    create_result_gesamtkosten(gesamtkosten);
    // $("#e_eigenkapital_benoetigt").val(eigenkapital.toFixed().toLocaleString());
    create_result_eigenkapital(eigenkapital);
    // $("#kredithoehe").val(fremdkapital.toFixed().toLocaleString());
    // $("#kredithoehe_helpline").html("Kredithöhe in Euro<br>Dies entspricht einem Fremdkapitalanteil von <strong>" + beleihungsauslauf.toFixed().toLocaleString() + "</strong> Prozent am Kaufpreis.");
    create_result_kredithoehe(fremdkapital, "Kredithöhe in Euro<br>Dies entspricht einem Fremdkapitalanteil von <strong>" + beleihungsauslauf.toFixed().toLocaleString() + "</strong> Prozent am Kaufpreis.");
    // $("#kreditbelastung").val(kreditbelastung_pm.toFixed().toLocaleString());
    create_result_kreditbelastung(kreditbelastung_pm);
    // $("#kreditbelastung-anteil").val(einkommenbelastung_final.toFixed(1).toLocaleString().replace(".", ","));
    // $("#kreditbelastung-anteil").val(kreditbelastung_anteilig.toFixed(1).toLocaleString().replace(".", ","));
    create_result_kreditbelastung_anteil(kreditbelastung_anteilig);
    // $("#rueckzahlungsdauer").val(rueckzahlungsdauer.toFixed(1).toLocaleString().replace(".", ","));
    create_result_rueckzahlungsdauer(rueckzahlungsdauer);

    const restschuld_jahre = [5, 10, 15, 20, 25];
    for (let jahr of restschuld_jahre) {
        let rs = restschuld(fremdkapital, tilgungssatz, zinssatz, jahr);
        create_result_restschuld(rs, jahr);
    }

    let eigenkapitel_helpline = $("#e_eigenkapital_benoetigt_helpline");
    if (eigenkapital < nebenkosten_summe) {
        eigenkapitel_helpline.addClass("text-danger");
        eigenkapitel_helpline.html('Eigenkapital in Euro<br>Das Eigenkapital sollte einen Betrag von <strong>' + nebenkosten_summe.toFixed().toLocaleString() + ' Euro </strong> nicht unterschreiten, damit die Nebenkosten gedeckt sind.');
    } else if (e_eigenkapital_prozent.prop("checked")) {
        eigenkapitel_helpline.removeClass("text-danger");
        eigenkapitel_helpline.html("Eigenkapital in Euro<br>Dies entspricht einem Eigenkapitalanteil von <strong>" + eigenkapital_eingabe.toFixed().toLocaleString() + "</strong> Prozent am Kaufpreis zzgl. der Kaufnebenkosten.");
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
    let fremdkapital_anteil = 100 - eigenkapital_anteil;

    let einkommenbelastung = parseInt(l_einkommenbelastung.val(), 10);
    let einkommen = parseInt($("#einkommen").val(), 10);
    if ($("#einkommen_zeit_monatlich").prop("checked")) {
        einkommen *= 12;
    }

    let annuitaet_max = einkommen * (einkommenbelastung / 100);
    let zinssatz = parseFloat($("#zinssatz").val()) / 100;
    let tilgungssatz = parseFloat($("#tilgungssatz").val()) / 100;
    let fremdkapital_v1 = annuitaet_max / (zinssatz + tilgungssatz);
    let fremdkapital_v2 = (eigenkapital * (fremdkapital_anteil / 100)) / ((nebenkosten + eigenkapital_anteil) / 100);
    let fremdkapital = Math.min(fremdkapital_v1, fremdkapital_v2);
    
    let gesamtkosten = eigenkapital + fremdkapital;
    let kaufpreis = gesamtkosten / (1 + (nebenkosten / 100));
    let eigenkapital_anteil_final = (1 - (fremdkapital / kaufpreis)) * 100;
    let annuitaet_pa = fremdkapital * (zinssatz + tilgungssatz);
    let annuitaet_pm = annuitaet_pa / 12;
    let einkommenbelastung_final = (annuitaet_pa / einkommen) * 100;
    let rueckzahlungsdauer = calculate_rueckzahlungsdauer(fremdkapital, annuitaet_pm, zinssatz);

    // $("#l_kaufpreis").val(kaufpreis.toFixed().toLocaleString());
    create_result_kaufpreis(kaufpreis);

    // $("#gesamtkosten").val(gesamtkosten.toFixed().toLocaleString());
    create_result_gesamtkosten(gesamtkosten);

    // $("#kredithoehe").val(fremdkapital.toFixed().toLocaleString());
    // $("#kredithoehe_helpline").html("Kredithöhe in Euro");
    create_result_kredithoehe(fremdkapital, "Kredithöhe in Euro");

    // $("#l_eigenkapitalanteil_final").val(eigenkapital_anteil_final.toFixed(1).toLocaleString().replace(".", ","));
    create_result_eigenkapitalanteil(eigenkapital_anteil_final);

    // $("#kreditbelastung").val(annuitaet_pm.toFixed().toLocaleString());
    create_result_kreditbelastung(annuitaet_pm);

    // $("#kreditbelastung-anteil").val(einkommenbelastung_final.toFixed(1).toLocaleString().replace(".", ","));
    create_result_kreditbelastung_anteil(einkommenbelastung_final);

    // $("#rueckzahlungsdauer").val(rueckzahlungsdauer.toFixed(1).toLocaleString().replace(".", ","));
    create_result_rueckzahlungsdauer(rueckzahlungsdauer);

    const restschuld_jahre = [5, 10, 15, 20, 25];
    for (let jahr of restschuld_jahre) {
        let rs = restschuld(fremdkapital, tilgungssatz, zinssatz, jahr);
        create_result_restschuld(rs, jahr);
    }

    $("#result-container").css("display", "block");
}

function restschuld(fremdkapital, tilgungssatz, zinssatz, jahre) {
    let tilgung_monat1 = fremdkapital * tilgungssatz / 12;
    return  fremdkapital - ((tilgung_monat1*(((1+zinssatz/12)**(jahre*12))-1))/(zinssatz/12));
}

function create_result_kaufpreis(wert) {
    let id_name = "kaufpreis";
    let label = "Kaufpreis:";
    let helptext = "maximaler Kaufpreis in Euro";
    create_result(id_name, label, helptext, wert.toFixed().toLocaleString(), "€");
}

function create_result_gesamtkosten(wert) {
    let id_name = "gesamtkosten";
    let label = "Gesamtkosten:";
    let helptext = "Gesamtkosten in Euro";
    create_result(id_name, label, helptext, wert.toFixed().toLocaleString(), "€");
}

function create_result_kredithoehe(wert, helptext) {
    let id_name = "kredithoehe";
    let label = "Kredithöhe:";
    create_result(id_name, label, helptext, wert.toFixed().toLocaleString(), "€");
}

function create_result_eigenkapital(wert) {
    let id_name = "eigenkapital";
    let label = "Eigen&shy;kapital:";
    let helptext = "";
    create_result(id_name, label, helptext, wert.toFixed().toLocaleString(), "€");
}

function create_result_eigenkapitalanteil(wert) {
    let id_name = "eigenkapitalanteil";
    let label = "Eigen&shy;kapital&shy;anteil am Kaufpreis:";
    let helptext = "Höhe des Eigenkapitals am Kaufpreis";
    create_result(id_name, label, helptext, wert.toFixed(1).toLocaleString().replace(".", ","), "%");
}

function create_result_kreditbelastung(wert) {
    let id_name = "kreditbelastung";
    let label = "Kredit&shy;belastung pro Monat:";
    let helptext = "Kreditbelastung pro Monat in Euro";
    create_result(id_name, label, helptext, wert.toFixed().toLocaleString(), "€");
}

function create_result_kreditbelastung_anteil(wert) {
    let id_name = "kreditbelastung-anteil";
    let label = "Anteil Kredit&shy;belastung am Einkommen:";
    let helptext = "anteilige Kreditbelastung am Einkommen in Prozent";
    create_result(id_name, label, helptext, wert.toFixed(1).toLocaleString().replace(".", ","), "%");
}

function create_result_rueckzahlungsdauer(wert) {
    let id_name = "rueckzahlungsdauer";
    let label = "Rück&shy;zahlungs&shy;dauer des Kredits:";
    let helptext = "Dauer in Jahren, bis der Kredit zurückgezahlt wäre";
    create_result(id_name, label, helptext, wert.toFixed(1).toLocaleString().replace(".", ","), "");
}

function create_result_restschuld(wert, jahre) {
    let id_name = "restschuld" + jahre;
    let label = `Restschuld nach <strong>${jahre}</strong> Jahren:`;
    let helptext = `Restschuld des Darlehens nach einer Zinsbindung von ${jahre} Jahren.`;
    create_result(id_name, label, helptext, wert.toFixed().toLocaleString(), "€");
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
            <div class="col-md-3 d-none d-md-block d-lg-none d-xl-none d-xxl-none"></div>
            <div class="col-md-9 col-lg-7">
                <span id="${id_name}_helpline" class="form-text">${helptext}</span>
            </div>
        </div>`
    )
    result_fields.append(result_html);
}