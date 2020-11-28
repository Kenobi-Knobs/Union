    let arrLang = {
        'en': {
            'titleReset': 'Reset password',
            'placeholder': 'Email',
            'reset': 'Reset',
            'ok': 'Ok'


        },
        'ua': {
            'titleReset': 'Відновлення паролю',
            'placeholder': 'Електронна пошта',
            'reset': 'Відновити',
            'ok': 'Ок'

        }
    };
    let currentLang;

    $(document).ready(function () {
        getLocalLang();

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

            $.ajax({
                url: '/api/resetPasswordMail',
                type: 'post',
                headers: {
                    'csrf': getCookie('csrf_token')
                },
                data: {
                    mail: mail,
                    lang: currentLang
                },
                dataType: 'json',
                success: function (data) {
                    if (data.reset == 'false') {
                        $('.infoWrapper').fadeIn(300);
                        $('.infoWrapper').css({
                            'display': 'block'
                        });
                        if (currentLang == 'en') {
                            $('#singInInfo').html('This mail is not registered or letter does not sent. Please try again');
                        }
                        if (currentLang == 'ua') {
                            $('#singInInfo').html('Ця пошта не зареєстрована. Або лист для відновлення не відправився. Будь заска, спробуйте ще раз');
                        }

                    }
                    if (data.reset == 'true') {
                        if (currentLang == 'en') {
                            $('#singInInfo').text(`Please follow the link sent to ${data.mail} to change password`);
                        }
                        if (currentLang == 'ua') {
                            $('#singInInfo').text(`Будь ласка перевірте пошту ${data.mail}, щоб змінити пароль`);
                        }

                        $('.infoWrapper').css({
                            'display': 'block'
                        });
                        $('.infoWrapper').fadeIn(300);
                    }
                }
            });

        } else {
            $('.infoWrapper').fadeIn(300);
            $('.infoWrapper').css({
                'display': 'block'
            });
            if (currentLang == 'en') {
                $('#singInInfo').html('Validation error: <br> - mail must contain @');
            }
            if (currentLang == 'ua') {
                $('#singInInfo').html('Помилка валідації: <br> - пошта повинна включати @');
            }
        }
    }


    function getLocalLang() {
        let langs;
        if (localStorage.getItem('langs') === null) {
            langs = [];

        } else {
            langs = JSON.parse(localStorage.getItem('langs'));
        }
        langs.forEach(function (language) {
            let lang = langs[langs.length - 1];
            currentLang = lang;
            setTimeout(() => {
                $('.langText').each(function (index, item) {
                    $(this).text(arrLang[lang][$(this).attr('key')]);
                });
                $('.langPlaceholder').each(function (index, item) {
                    $(this).attr('placeholder', arrLang[lang][$(this).attr('key')]);
                });
                $('.langBtn').each(function (index, item) {
                    $(this).val(arrLang[lang][$(this).attr('key')]);
                });
            }, 0);
        })
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
