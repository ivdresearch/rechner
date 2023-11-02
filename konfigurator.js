$(document).ready(function () {
    const titel_input = $("#titel");
    const bgcolor_input = $("#bgcolor");
    const erstellen_button = $("#erstellen");

    const result_container = $("#result_container");
    const preview_container = $("#preview_container");
    const preview_iframe = $("#preview_iframe");
    const result_url = $("#result_url");
    const result_iframe = $("#result_iframe");

    erstellen_button.click(function () {
        let rechnertyp = $("input:radio[name='auswahl_rechner_angabe']:checked").val();
        let url = "";
        if (rechnertyp === "auswahl_rechner_einkauf") {
            url = "https://ivdresearch.github.io/rechner/einkaufsrechner.html?";
        } else if (rechnertyp === "auswahl_rechner_leistbarkeit") {
            url = "https://ivdresearch.github.io/rechner/rechner.html?";
        } else {
            return;
        }
        
        let params = ["footer=false"];
        let titel = titel_input.val();
        if (titel.length > 0) {
            params.push("titel=" + encodeURIComponent(titel));
        }
        let bgcolor = bgcolor_input.val();
        params.push("bgcolor=" + encodeURIComponent(bgcolor));
        url = url.concat(params.join("&"));
        let iframe = '<iframe src="' + url + '" style="width:100%; height:800px"></iframe>'
        result_url.val(url);
        result_iframe.val(iframe);
        result_container.show();
        preview_iframe.html(iframe);
        preview_container.show();
    });
});