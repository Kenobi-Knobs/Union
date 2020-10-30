$(document).ready(function () {


    $('body').keydown(function (e) {
        if (e.keyCode === 13) {
            if ($('.infoWrapper').css('display') == 'block') {
                understandInfo();
            }
            if ($('.infoWrapper').css('display') == 'none') {
                submitForm();
            }
        }
    });


    let submitButton = $('#submit');
    submitButton.on('click', function () {
        submitForm();
    });

    $('#understandInfo').on('click', function () {
        understandInfo();
    })
});

function understandInfo() {
    $('.infoWrapper').fadeOut(300);
    setTimeout(function () {
        $('.infoWrapper').css({
            'display': 'none'
        });
    }, 400);
}

function submitForm() {
    let regMail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/gi;
    let mail = $('#mail').val();

    if (regMail.test(mail)) {
        $.post(
            "/api/resetPasswordMail", {
                mail: mail
            },
            function (data) {
                data = JSON.parse(data);
                //                    console.log(data);
                if (data.reset == 'false') {
                    $('.infoWrapper').fadeIn(300);
                    $('.infoWrapper').css({
                        'display': 'block'
                    });
                    $('#singInInfo').html('This mail is not registered or letter does not sent. Please try again');
                }
                if (data.reset == 'true') {
                    $('#singInInfo').text(`Please follow the link sent to ${data.mail} to change password`);
                    $('.infoWrapper').css({
                        'display': 'block'
                    });
                    $('.infoWrapper').fadeIn(300);
                }
            }
        );

    } else {
        $('.infoWrapper').fadeIn(300);
        $('.infoWrapper').css({
            'display': 'block'
        });
        $('#singInInfo').html('Validation error: <br> - mail must contain @');
    }
}
