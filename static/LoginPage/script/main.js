$(document).ready(function () {
    $('#submit').on('click', function () {
        $.get(
            "http://t5.tss2020.site/api/auth", {
                mail: $('#mail').val(),
                pass: $('#password').val()
            },
            function (data) {
                data = JSON.parse(data);
                if (data.auth == "true") {
                    $(location).attr('href', 'http://t5.tss2020.site/');
                } else {
                    alert("something went wrong")
                }
            }
        );
    });
});
