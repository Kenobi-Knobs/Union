$(document).ready(function () {

    let url = new URL(document.referrer)

    $('.back').on('click', function () {
        if (url.pathname == '/settings') {
            $(location).attr('href', '/settings');
        }
        if (url.pathname == '/sign-in') {
            $(location).attr('href', '/sign-in');
        } else {
            $(location).attr('href', '/');
        }
    });
});
