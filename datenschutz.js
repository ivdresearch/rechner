$(function () {
    let loaded = false;
    $("#datenschutz").on("show.bs.collapse", function () {
        if (loaded) {
            return;
        }
        loaded = true;
        let target = $("#datenschutz-content");
        fetch("partials/datenschutz.html")
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Status " + response.status);
                }
                return response.text();
            })
            .then(function (html) {
                target.html(html);
            })
            .catch(function () {
                target.html('<p>Datenschutzerklärung konnte nicht geladen werden. <a href="partials/datenschutz.html" target="_blank">Direkt öffnen</a>.</p>');
            });
    });
});
