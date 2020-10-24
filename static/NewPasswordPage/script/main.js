$(document).ready(function () {

    //get token from URL
    let path = location.pathname.split('/');
    let token = path[path.length - 1];

    //flag to understand if the user has changed the password
    let isAuth;

    let submitButton = $('#submit');

    let regPass = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=\S+$).{8,}$/gi;

    submitButton.on('click', function () {

        let pass = $('#password').val();

        if (regPass.test(pass)) {
            $.post(
                "/api/changePassword", {
                    new_pass: pass,
                    token: token
                },
                function (data) {
                    data = JSON.parse(data);
                    if (data.reset == 'false') {
                        $('.infoWrapper').fadeIn(300);
                        $('.infoWrapper').css({
                            'display': 'block'
                        });
                        $('#singInInfo').html('Validation error: <br> - the password must be at least 8 characters long. Must have one number and one capital letter');
                        isAuth = false;
                    }
                    if (data.reset == 'true') {
                        $('#singInInfo').text('Your password was changed. Please authorize with new data');
                        $('.infoWrapper').css({
                            'display': 'block'
                        });
                        $('.infoWrapper').fadeIn(300);
                        isAuth = true;
                    }
                }
            );

        } else {
            $('.infoWrapper').fadeIn(300);
            $('.infoWrapper').css({
                'display': 'block'
            });
            $('#singInInfo').html('Validation error: <br> - the password must be at least 8 characters long. Must have one number and one capital letter');
        }
    });

    $('#understandInfo').on('click', function () {
        if (isAuth) {
            $('.infoWrapper').fadeOut(300);
            setTimeout(function () {
                $('.infoWrapper').css({
                    'display': 'none'
                });
                $(location).attr('href', '/login');
            }, 400);
        } else {
            $('.infoWrapper').fadeOut(300);
            setTimeout(function () {
                $('.infoWrapper').css({
                    'display': 'none'
                });
                location.reload();
            }, 400);
        }


    })
});
