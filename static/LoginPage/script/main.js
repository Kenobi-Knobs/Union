$(document).ready(function () {
    $('#submit').on('click', function () {
        $.get(
            "/api/auth", {
                mail: $('#mail').val(),
                pass: $('#password').val()
            },
            function (data) {
                data = JSON.parse(data);
                if (data.auth == "true") {
                    console.log("ok");
                    $(location).attr('href', '/');
                } else {
                    alert("something went wrong")
                }
            }
        );
    });
});
