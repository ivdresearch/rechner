const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

$( document ).ready(function() {
    let page_title = urlParams.get("titel");
    if (typeof page_title === "string" && page_title.length > 0) {
        $("#headline").text(page_title);
    }
    let page_bgcolor = urlParams.get("bgcolor");
    if (typeof page_bgcolor === "string" && page_bgcolor.length === 7 && page_bgcolor.startsWith("#")) {
        $( document.body ).css("background-color", page_bgcolor);
    }
    let page_boxcolor = urlParams.get("boxcolor");
    if (typeof page_boxcolor === "string" && page_boxcolor.length === 7 && page_boxcolor.startsWith("#")) {
        let container = $(".bg-light");
        container.removeClass("bg-light");
        container.css("background-color", page_boxcolor);
    }
    let page_impressum = urlParams.get("impressum");
    if (page_impressum === "false") {
        $("#impressum").remove();
    }
    let page_footer = urlParams.get("footer");
    if (page_footer === "false") {
        $("#footer").remove();
    }
});
