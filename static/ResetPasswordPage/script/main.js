$(document).ready(function () {

    let submitButton = $('#submit');

    let regMail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/gi;
    submitButton.on('click', function () {

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
    });

    $('#understandInfo').on('click', function () {
        $('.infoWrapper').fadeOut(300);
        setTimeout(function () {
            $('.infoWrapper').css({
                'display': 'none'
            });
            location.reload();
        }, 400);

    })
});
