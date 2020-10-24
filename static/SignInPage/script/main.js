$(document).ready(function () {

    let submitButton = $('#submit');
    submitButton.prop('disabled', true);
    submitButton.css('background', '#7C7C7C');

    $('#checkbox').on('change', function () {

        if ($(this).prop('checked') == true) {
            submitButton.prop('disabled', false);
            submitButton.css('background', '#F26B6B');
            submitButton.hover(function () {
                submitButton.css('cursor', 'pointer');
            });
        }
        if ($(this).prop('checked') == false) {
            submitButton.prop('disabled', true);
            submitButton.css('background', '#7C7C7C');
            submitButton.hover(function () {
                submitButton.css('cursor', 'default');
            });
        }
    });

    let regMail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/gi;
    let regPass = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=\S+$).{8,}$/gi;
    $('#submit').on('click', function () {

        let mail = $('#mail').val();
        let pass = $('#password').val();

        if (regMail.test(mail) && regPass.test(pass)) {
            $.post(
                "/api/registerNewUser", {
                    mail: mail,
                    pass: pass
                },
                function (data) {
                    data = JSON.parse(data);
                    //                    console.log(data);
                    if (data.register == 'false') {
                        $('.infoWrapper').fadeIn(300);
                        $('.infoWrapper').css({
                            'display': 'block'
                        });
                        $('#singInInfo').html('Validation error: <br> - mail must contain @ <br> - the password must be at least 8 characters long. Must have one number and one capital letter <br> - or confirmation letter already sent')
                    }
                    if (data.register == 'true') {
                        $('#singInInfo').text(`Thanks for the registration. Please check ${data.mail} to verify your account`);
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
            $('#singInInfo').html('Validation error: <br> - mail must contain @ <br> - the password must be at least 8 characters long. Must have one number and one capital letter <br> - or confirmation letter already sent');
        }
    });

    $('#understandInfo').on('click', function () {
        $('.infoWrapper').fadeOut(300);
        setTimeout(function () {
            $('.infoWrapper').css({
                'display': 'none'
            });
            location.reload();
        }, 400);

    });
});
