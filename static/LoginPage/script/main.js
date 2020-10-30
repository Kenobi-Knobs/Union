$(document).ready(function () {

    //checking authorized use or not
    $.get(
        "api/isAuth", {},
        function (data) {
            data = JSON.parse(data);

            if (data.auth == "true") {
                //                console.log("Auth is true");
                $(location).attr('href', '/');
            }
        }
    );

    $('body').keydown(function (e) {
        if (e.keyCode === 13) {
            if ($('.infoWrapper').css('display') == 'block') {
                understandInfo();
            } else {
                submitForm();
            }
        }
    });

    //get "confirm" from URL
    let url = window.location.href;
    let isConfirmed = getURLParameter(url, 'info');
    //    console.log(isConfirmed);

    if (isConfirmed == 'confirmed') {
        $('.infoWrapper').fadeIn(300);
        $('.infoWrapper').css({
            'display': 'block',
        });
        $('#singInInfo').text('Mail was confirmed');
        $('#singInInfo').css('paddingLeft', '35%');
    }

    $('#submit').on('click', function () {
        submitForm();
    });

    $('.circle').on('click', function () {
        $(location).attr('href', '/reset');
    });


    $('#understandInfo').on('click', function () {
        understandInfo();
    });

});


function understandInfo() {
    $('.infoWrapper').fadeOut(300);
    setTimeout(function () {
        $('.infoWrapper').css({
            'display': 'none'
        });
        //        location.reload();
    }, 400);
}

function getURLParameter(sUrl, sParam) {
    let sPageURL = sUrl.substring(sUrl.indexOf('?') + 1);
    let sURLVariables = sPageURL.split('&');
    for (let i = 0; i < sURLVariables.length; i++) {
        let sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

function submitForm() {
    $.get(
        "/api/auth", {
            mail: $('#mail').val(),
            pass: $('#password').val()
        },
        function (data) {
            data = JSON.parse(data);
            if (data.auth == "true") {
                //                    console.log("ok");
                $(location).attr('href', '/');
            } else {
                $('.infoWrapper').fadeIn(300);
                $('.infoWrapper').css({
                    'display': 'block'
                });
                $('#singInInfo').text('Login or password are wrong');
                $('#singInInfo').css('paddingLeft', '30%');
            }
        }
    );
}
