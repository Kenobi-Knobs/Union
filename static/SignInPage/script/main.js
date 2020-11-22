$(document).ready(function () {

    $('body').keydown(function (e) {
        if (e.keyCode === 13) {
            if ($('.infoWrapper').css('display') == 'block') {
                understandInfo();
            }
            if ($('.infoWrapper').css('display') == 'none' && $('#submit').prop('disabled') == false) {
                submitForm();
            }
        }
    });

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


    $('#understandInfo').on('click', function () {
        understandInfo();
    });

    //form validate
    $('#formSignIn').validate({
        rules: {
            mail: {
                required: true,
                validMail: true,

            },
            password: {
                required: true,
                minlength: 8,
                validPass: true
            }
        },
        messages: {
            mail: {
                required: "This field must be filled",
                validMail: "Enter valid mail like example@something.com"
            },
            password: {
                required: "This field must be filled",
                minlength: "At least 8 characters long",
                validPass: "Enter at least 1 capital letter and 1 number"
            }
        },
        submitHandler: function () {
            submitForm();
        }
    });

    $.validator.addMethod("validMail", function (value, element) {
        return this.optional(element) || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/gi.test(value);
    })
    $.validator.addMethod("validPass", function (value, element) {
        return this.optional(element) || /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=\S+$).{8,}$/gi.test(value);
    })

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


function submitForm() {
    let mail = $('#mail').val();
    let pass = $('#password').val();

    $.post(
        "/api/registerNewUser", {
            mail: mail,
            pass: pass,
            lang: 'en'
        },
        function (data) {
            data = JSON.parse(data);
            console.log(data);
            if (data.register == 'false' && data.info == 'User already exist') {
                $('.infoWrapper').fadeIn(300);
                $('.infoWrapper').css({
                    'display': 'block'
                });
                $('#singInInfo').html('This user already registered')
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
}
